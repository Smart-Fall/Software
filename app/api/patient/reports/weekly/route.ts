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

    // Get health logs for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date();

    const healthLogs = await dbService.healthLogs.findBetween(
      patient.id,
      sevenDaysAgo,
      today,
    );

    // Get falls for the last 7 days
    const allFalls = await dbService.falls.findByPatientId(patient.id);
    const recentFalls = allFalls.filter(
      (f) => new Date(f.fallDatetime) >= sevenDaysAgo,
    );

    // Group data by day
    const dataByDay: { [key: string]: { healthScore: number; falls: number } } =
      {};

    // Initialize all days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dataByDay[dayStr] = { healthScore: 0, falls: 0 };
    }

    // Aggregate health logs by day
    healthLogs.forEach((log) => {
      const logDate = new Date(log.recordedAt);
      const dayStr = logDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (dataByDay[dayStr]) {
        dataByDay[dayStr].healthScore = log.healthScore;
      }
    });

    // Aggregate falls by day
    recentFalls.forEach((fall) => {
      const fallDate = new Date(fall.fallDatetime);
      const dayStr = fallDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (dataByDay[dayStr]) {
        dataByDay[dayStr].falls += 1;
      }
    });

    // Format response
    const weeklyData = Object.entries(dataByDay).map(([name, data]) => ({
      name,
      healthScore: data.healthScore,
      falls: data.falls,
    }));

    return NextResponse.json(weeklyData);
  } catch (error) {
    console.error("[API] Error fetching weekly reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
