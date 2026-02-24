import { NextResponse } from 'next/server';
import { getDbServiceAsync } from '@/lib/db/service';
import { getSession } from '@/lib/auth';

export async function GET(req, context) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const patientId = params.patientId;

    const db = await getDbServiceAsync();

    // Verify caregiver exists
    const caregiver = await db.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }

    // Check if caregiver has access to patient
    const access = await db.caregiverPatients.findByCaregiverAndPatient(
      caregiver.id,
      patientId
    );

    if (!access || !access.isActive) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch all falls for this patient (using falls as alerts)
    const falls = await db.falls.findByPatientId(patientId);

    // Transform falls to alert format
    const alerts = falls.map((fall) => ({
      id: fall.id,
      type: 'Fall Detected',
      severity: fall.severity || 'moderate',
      timestamp: fall.fallDatetime,
      details: fall.wasInjured
        ? `Fall detected at ${fall.location || 'unknown location'} - Injury reported`
        : `Fall detected at ${fall.location || 'unknown location'}`,
    }));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}