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

    // Get patient, falls, and messages data
    const patient = await db.patients.findById(patientId);
    const allFalls = await db.falls.findByPatientId(patientId);
    const allMessages = await db.messages.findByCaregiverAndPatient(caregiver.id, patientId);

    // Calculate statistics
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fallsThisWeek = allFalls.filter(
      (f) => new Date(f.fallDatetime) >= sevenDaysAgo
    ).length;
    const fallsThisMonth = allFalls.filter(
      (f) => new Date(f.fallDatetime) >= thirtyDaysAgo
    ).length;

    const stats = {
      totalAlerts: allFalls.length,
      totalMessages: allMessages.length,
      unreadMessages: allMessages.filter((m) => !m.isRead).length,
      currentHealthScore: patient ? Math.max(0, 100 - (patient.riskScore || 0)) : 0,
      fallsThisWeek,
      fallsThisMonth,
    };

    console.log('Formatted stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}