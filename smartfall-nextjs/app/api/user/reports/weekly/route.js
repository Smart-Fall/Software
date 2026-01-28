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

    // Get last 7 days of data
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get falls for this day
      const allFalls = await dbService.falls.findByPatientId(patient.id);
      const fallCount = allFalls.filter(f => f.fallDatetime >= date && f.fallDatetime < nextDate).length;

      // Get health score for this day (latest for the day)
      const healthLogs = await dbService.healthLogs.findBetween(patient.id, date, nextDate);
      const healthScore = healthLogs.length > 0 ? healthLogs[healthLogs.length - 1].healthScore : 0;

      weeklyData.push({
        name: daysOfWeek[date.getDay()],
        healthScore,
        falls: fallCount
      });
    }

    return NextResponse.json(weeklyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
