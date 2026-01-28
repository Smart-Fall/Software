import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/service';
import { getSession } from 'app/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const dbService = getDbService();
    const patient = await dbService.patients.findByUserId(session.userId);

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get last 4 weeks of data
    const monthlyData = [];
    const allFalls = await dbService.falls.findByPatientId(patient.id);

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7) + 1);
      weekEnd.setHours(0, 0, 0, 0);

      // Get falls for this week
      const fallCount = allFalls.filter(f => f.fallDatetime >= weekStart && f.fallDatetime < weekEnd).length;

      // Get health logs for this week to calculate average
      const healthLogs = await dbService.healthLogs.findBetween(patient.id, weekStart, weekEnd);

      const healthScore = healthLogs.length > 0
        ? Math.round(healthLogs.reduce((sum, log) => sum + log.healthScore, 0) / healthLogs.length)
        : 0;

      monthlyData.push({
        name: `Week ${4 - i}`,
        healthScore,
        falls: fallCount
      });
    }

    return NextResponse.json(monthlyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
