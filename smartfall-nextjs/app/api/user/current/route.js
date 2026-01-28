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

    return NextResponse.json({
      patient_id: patient.id,
      first_name: patient.user?.firstName,
      last_name: patient.user?.lastName,
      dob: patient.user?.dob,
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
