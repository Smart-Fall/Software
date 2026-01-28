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

    // Get fall statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const totalFalls = await prisma.fall.count({
      where: { patientId: patient.id }
    });

    const fallsThisWeek = await prisma.fall.count({
      where: {
        patientId: patient.id,
        fallDatetime: { gte: oneWeekAgo }
      }
    });

    const fallsThisMonth = await prisma.fall.count({
      where: {
        patientId: patient.id,
        fallDatetime: { gte: oneMonthAgo }
      }
    });

    const fallsThisYear = await prisma.fall.count({
      where: {
        patientId: patient.id,
        fallDatetime: { gte: oneYearAgo }
      }
    });

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
