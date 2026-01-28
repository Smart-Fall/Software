import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();

    // Get patient record for the logged-in user
    const patient = await dbService.patients.findByUserId(session.userId);

    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 },
      );
    }

    // Get health logs for the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const today = new Date();

    const healthLogs = await dbService.healthLogs.findBetween(
      patient.id,
      fourWeeksAgo,
      today,
    );

    // Get falls for the last 4 weeks
    const allFalls = await dbService.falls.findByPatientId(patient.id);
    const recentFalls = allFalls.filter(
      (f) => new Date(f.fallDatetime) >= fourWeeksAgo,
    );

    // Group data by week
    const dataByWeek: { [key: string]: { scores: number[]; fallCount: number } } =
      {};

    // Initialize 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekStr = `Week ${4 - i}`;
      dataByWeek[weekStr] = { scores: [], fallCount: 0 };
    }

    // Aggregate health logs by week
    healthLogs.forEach((log) => {
      const logDate = new Date(log.recordedAt);
      const daysFromNow = Math.floor(
        (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weekIndex = Math.floor(daysFromNow / 7);

      if (weekIndex < 4) {
        const weekStr = `Week ${4 - weekIndex}`;
        if (dataByWeek[weekStr]) {
          dataByWeek[weekStr].scores.push(log.healthScore);
        }
      }
    });

    // Aggregate falls by week
    recentFalls.forEach((fall) => {
      const fallDate = new Date(fall.fallDatetime);
      const daysFromNow = Math.floor(
        (today.getTime() - fallDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weekIndex = Math.floor(daysFromNow / 7);

      if (weekIndex < 4) {
        const weekStr = `Week ${4 - weekIndex}`;
        if (dataByWeek[weekStr]) {
          dataByWeek[weekStr].fallCount += 1;
        }
      }
    });

    // Format response - average health scores for each week
    const monthlyData = Object.entries(dataByWeek).map(([name, data]) => ({
      name,
      healthScore:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
      falls: data.fallCount,
    }));

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error("[API] Error fetching monthly reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
