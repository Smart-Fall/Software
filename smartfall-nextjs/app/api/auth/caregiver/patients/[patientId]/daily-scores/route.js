import { NextResponse } from 'next/server';
import pool from '@/lib/db';
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
    
    // Verify caregiver has access to this patient
    const caregiverResult = await pool.query(
      'SELECT id FROM caregivers WHERE user_id = $1',
      [session.userId]
    );
    
    if (caregiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }
    
    const caregiverId = caregiverResult.rows[0].id;
    
    // Check if caregiver has access to patient
    const accessCheck = await pool.query(`
      SELECT 1 FROM caregiver_patients 
      WHERE caregiver_id = $1 AND patient_id = $2 AND is_active = true
    `, [caregiverId, patientId]);
    
    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Calculate daily scores for the last 7 days
    // Group by date and calculate average health score and count falls
    const result = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS date
      ),
      daily_falls AS (
        SELECT 
          DATE(fall_datetime) as fall_date,
          COUNT(*) as fall_count
        FROM falls
        WHERE patient_id = $1
          AND fall_datetime >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(fall_datetime)
      ),
      daily_health AS (
        SELECT 
          date,
          COALESCE(100 - p.risk_score, 0) as health_score
        FROM date_series
        CROSS JOIN patients p
        WHERE p.id = $1
      )
      SELECT 
        dh.date,
        dh.health_score as score,
        COALESCE(df.fall_count, 0) as falls,
        0 as alerts -- We'll add alert tracking later if you have an alerts table
      FROM daily_health dh
      LEFT JOIN daily_falls df ON dh.date = df.fall_date
      ORDER BY dh.date ASC
    `, [patientId]);
    
    // Format dates for display
    const formattedData = result.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: parseInt(row.score) || 0,
      falls: parseInt(row.falls) || 0,
      alerts: parseInt(row.alerts) || 0
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching daily scores:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}