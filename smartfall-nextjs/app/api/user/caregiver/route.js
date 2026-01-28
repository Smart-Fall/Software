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

    const caregiverPatients = await dbService.caregiverPatients.findByPatientId(patient.id);

    if (!caregiverPatients || caregiverPatients.length === 0) {
      return NextResponse.json(
        { error: 'No caregiver assigned' },
        { status: 404 }
      );
    }

    const caregiverPatient = caregiverPatients[0];
    const caregiver = await dbService.caregivers.findById(caregiverPatient.caregiverId);

    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      first_name: caregiver.user?.firstName,
      last_name: caregiver.user?.lastName,
      facility_name: caregiver.facilityName,
      specialization: caregiver.specialization
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
