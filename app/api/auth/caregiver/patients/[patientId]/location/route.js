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

    // Try to get location from falls table
    const falls = await db.falls.findByPatientId(patientId);

    // Find the most recent fall with location data
    for (const fall of falls) {
      if (fall.location) {
        return NextResponse.json({
          latitude: fall.latitude,
          longitude: fall.longitude,
          address: fall.location,
          lastUpdated: fall.fallDatetime,
        });
      }
    }

    // No location data available
    return NextResponse.json(
      { error: 'No location data available' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching patient location:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}