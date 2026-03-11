import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const access = await dbService.caregiverPatients.findByIds(caregiver.id, params.id);
    if (!access || !access.isActive) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [falls, messages, recentHealthLogs] = await Promise.all([
      dbService.falls.findByPatientId(params.id),
      dbService.messages.findByCaregiverAndPatient(caregiver.id, params.id),
      dbService.healthLogs.findRecent(params.id, 1),
    ]);

    const fallsThisWeek = falls.filter((f) => f.fallDatetime >= sevenDaysAgo).length;
    const fallsThisMonth = falls.filter((f) => f.fallDatetime >= thirtyDaysAgo).length;
    const unreadMessages = messages.filter((m) => !m.isRead).length;
    const currentHealthScore = recentHealthLogs[0]?.healthScore ?? 0;

    return NextResponse.json({
      totalAlerts: falls.length,
      totalMessages: messages.length,
      unreadMessages,
      currentHealthScore,
      fallsThisWeek,
      fallsThisMonth,
    });
  } catch (error) {
    console.error("[API] Error fetching patient stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
