import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    
    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }
    
    const caregiverId = caregiver.id;
    
    const totalPatients = await prisma.caregiverPatient.count({
      where: {
        caregiverId,
        isActive: true,
      },
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentFalls = await prisma.fall.count({
      where: {
        patient: {
          caregiverPatients: {
            some: {
              caregiverId,
              isActive: true,
            },
          },
        },
        fallDatetime: {
          gte: sevenDaysAgo,
        },
      },
    });
    
    const highRisk = await prisma.patient.count({
      where: {
        caregiverPatients: {
          some: {
            caregiverId,
            isActive: true,
          },
        },
        riskScore: {
          gte: 75,
        },
      },
    });
    
    const patients = await prisma.patient.findMany({
      where: {
        caregiverPatients: {
          some: {
            caregiverId,
            isActive: true,
          },
        },
      },
      select: {
        riskScore: true,
      },
    });
    
    const avgRiskScore = patients.length > 0
      ? patients.reduce((sum, p) => sum + p.riskScore, 0) / patients.length
      : 0;
    const avgHealthScore = Math.round(100 - avgRiskScore);
    
    return NextResponse.json({
      totalPatients,
      recentFalls,
      avgHealthScore,
      highRiskPatients: highRisk,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}