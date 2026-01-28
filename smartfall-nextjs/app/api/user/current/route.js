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
      where: { userId: session.userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            dob: true,
            isActive: true
          }
        }
      }
    });

    if (!patient || !patient.user?.isActive) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      patient_id: patient.id,
      first_name: patient.user.firstName,
      last_name: patient.user.lastName,
      dob: patient.user.dob,
      risk_score: patient.riskScore,
      is_high_risk: patient.isHighRisk,
      medical_conditions: patient.medicalConditions
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
