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
    
    // Fetch all falls for this patient (using falls as alerts)
    const result = await pool.query(`
      SELECT 
        id,
        'Fall Detected' as type,
        COALESCE(severity, 'moderate') as severity,
        fall_datetime as timestamp,
        CASE 
          WHEN location_description IS NOT NULL THEN 
            CONCAT('Fall at ', location_description, 
              CASE WHEN was_injury THEN ' - Injury reported' ELSE '' END)
          ELSE 
            CONCAT('Fall detected',
              CASE WHEN was_injury THEN ' - Injury reported' ELSE '' END)
        END as details
      FROM falls
      WHERE patient_id = $1
      ORDER BY fall_datetime DESC
      LIMIT 50
    `, [patientId]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}