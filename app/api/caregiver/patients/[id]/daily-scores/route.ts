import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const access = await dbService.caregiverPatients.findByIds(caregiver.id, id);
    if (!access || !access.isActive) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const now = new Date();

    const [healthLogs, falls] = await Promise.all([
      dbService.healthLogs.findBetween(id, sevenDaysAgo, now),
      dbService.falls.findByPatientId(id),
    ]);

    // Build a map of date → { scores[], falls, alerts }
    const dayMap: Record<string, { scores: number[]; falls: number; alerts: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { scores: [], falls: 0, alerts: 0 };
    }

    for (const log of healthLogs) {
      const key = log.recordedAt.toISOString().slice(0, 10);
      if (dayMap[key]) dayMap[key].scores.push(log.healthScore);
    }

    for (const fall of falls) {
      if (!fall.fallDatetime) continue;
      const key = fall.fallDatetime.toISOString().slice(0, 10);
      if (!dayMap[key]) continue;
      dayMap[key].falls += 1;
      dayMap[key].alerts += 1;
    }

    const result = Object.entries(dayMap).map(([date, data]) => ({
      date,
      score: data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      falls: data.falls,
      alerts: data.alerts,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error fetching daily scores:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
