import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'app/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.userId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get last 12 months of data
    const yearlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - i + 1);
      monthEnd.setDate(1);
      monthEnd.setHours(0, 0, 0, 0);

      // Get falls for this month
      const fallCount = await prisma.fall.count({
        where: {
          patientId: patient.id,
          fallDatetime: { gte: monthStart, lt: monthEnd }
        }
      });

      // Get health logs for this month to calculate average
      const healthLogs = await prisma.healthLog.findMany({
        where: {
          patientId: patient.id,
          recordedAt: { gte: monthStart, lt: monthEnd }
        },
        select: { healthScore: true }
      });

      const healthScore = healthLogs.length > 0
        ? Math.round(healthLogs.reduce((sum, log) => sum + log.healthScore, 0) / healthLogs.length)
        : 0;

      yearlyData.push({
        name: monthNames[monthStart.getMonth()],
        healthScore,
        falls: fallCount
      });
    }

    return NextResponse.json(yearlyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
