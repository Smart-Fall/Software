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

    const caregiverPatient = await prisma.caregiverPatient.findFirst({
      where: { patientId: patient.id, isActive: true },
      include: {
        caregiver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!caregiverPatient) {
      return NextResponse.json(
        { error: 'No caregiver assigned' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      first_name: caregiverPatient.caregiver.user.firstName,
      last_name: caregiverPatient.caregiver.user.lastName,
      facility_name: caregiverPatient.caregiver.facilityName,
      specialization: caregiverPatient.caregiver.specialization
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
