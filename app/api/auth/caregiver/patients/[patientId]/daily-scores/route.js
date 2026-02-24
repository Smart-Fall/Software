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

    // Get last 7 days of data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    // Fetch health logs and falls for the period
    const healthLogs = await db.healthLogs.findBetween(
      patientId,
      startDate,
      endDate
    );
    const falls = await db.falls.findByPatientId(patientId);

    // Group health logs by date
    const healthByDate = {};
    healthLogs.forEach((log) => {
      const date = new Date(log.recordedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!healthByDate[date]) {
        healthByDate[date] = [];
      }
      healthByDate[date].push(log.healthScore);
    });

    // Group falls by date
    const fallsByDate = {};
    falls.forEach((fall) => {
      const date = new Date(fall.fallDatetime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!fallsByDate[date]) {
        fallsByDate[date] = 0;
      }
      fallsByDate[date]++;
    });

    // Generate daily scores for the last 7 days
    const dailyScores = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const scores = healthByDate[dateStr] || [];
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      dailyScores.push({
        date: dateStr,
        score: avgScore,
        falls: fallsByDate[dateStr] || 0,
        alerts: 0,
      });
    }

    return NextResponse.json(dailyScores);
  } catch (error) {
    console.error('Error fetching daily scores:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}