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

    // Get fall statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const allFalls = await dbService.falls.findByPatientId(patient.id);

    const totalFalls = allFalls.length;
    const fallsThisWeek = allFalls.filter(f => f.fallDatetime >= oneWeekAgo).length;
    const fallsThisMonth = allFalls.filter(f => f.fallDatetime >= oneMonthAgo).length;
    const fallsThisYear = allFalls.filter(f => f.fallDatetime >= oneYearAgo).length;

    const stats = {
      totalFalls,
      fallsThisWeek,
      fallsThisMonth,
      fallsThisYear,
      currentHealthScore: 100 - patient.riskScore,
      isHighRisk: patient.isHighRisk
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
