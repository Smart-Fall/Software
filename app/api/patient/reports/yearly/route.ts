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

    // Get health logs for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const today = new Date();

    const healthLogs = await dbService.healthLogs.findBetween(
      patient.id,
      twelveMonthsAgo,
      today,
    );

    // Get falls for the last 12 months
    const allFalls = await dbService.falls.findByPatientId(patient.id);
    const recentFalls = allFalls.filter(
      (f) => new Date(f.fallDatetime) >= twelveMonthsAgo,
    );

    // Group data by month
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dataByMonth: { [key: string]: { scores: number[]; fallCount: number } } =
      {};

    // Initialize 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthStr = months[date.getMonth()];
      dataByMonth[monthStr] = { scores: [], fallCount: 0 };
    }

    // Aggregate health logs by month
    healthLogs.forEach((log) => {
      const logDate = new Date(log.recordedAt);
      const monthStr = months[logDate.getMonth()];
      if (dataByMonth[monthStr]) {
        dataByMonth[monthStr].scores.push(log.healthScore);
      }
    });

    // Aggregate falls by month
    recentFalls.forEach((fall) => {
      const fallDate = new Date(fall.fallDatetime);
      const monthStr = months[fallDate.getMonth()];
      if (dataByMonth[monthStr]) {
        dataByMonth[monthStr].fallCount += 1;
      }
    });

    // Format response - average health scores for each month
    const yearlyData = Object.entries(dataByMonth).map(([name, data]) => ({
      name,
      healthScore:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
      falls: data.fallCount,
    }));

    return NextResponse.json(yearlyData);
  } catch (error) {
    console.error("[API] Error fetching yearly reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
