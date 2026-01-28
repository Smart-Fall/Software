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
    
    const patients = await prisma.patient.findMany({
      where: {
        caregiverPatients: {
          some: {
            caregiverId: caregiver.id,
            isActive: true,
          },
        },
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
        riskScore: true,
        isHighRisk: true,
        medicalConditions: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            dob: true,
          },
        },
        caregiverPatients: {
          where: {
            caregiverId: caregiver.id,
            isActive: true,
          },
          select: {
            assignedDate: true,
          },
        },
      },
      orderBy: {
        riskScore: 'desc',
      },
    });
    
    const formattedPatients = patients.map(p => ({
      patientId: p.id,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      dob: p.user.dob,
      riskScore: p.riskScore,
      isHighRisk: p.isHighRisk,
      medicalConditions: p.medicalConditions,
      assignedDate: p.caregiverPatients[0]?.assignedDate,
    }));
    
    return NextResponse.json(formattedPatients);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}