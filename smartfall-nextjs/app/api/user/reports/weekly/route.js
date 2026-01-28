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
      const fallCount = await prisma.fall.count({
        where: {
          patientId: patient.id,
          fallDatetime: { gte: date, lt: nextDate }
        }
      });

      // Get health score for this day (latest for the day)
      const healthLog = await prisma.healthLog.findFirst({
        where: {
          patientId: patient.id,
          recordedAt: { gte: date, lt: nextDate }
        },
        orderBy: { recordedAt: 'desc' }
      });

      const healthScore = healthLog?.healthScore || 0;

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
