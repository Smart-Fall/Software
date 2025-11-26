import { NextResponse } from 'next/server';
import pool from 'app/lib/db';
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
    
    // Get caregiver_id from the logged-in user
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
    
    const result = await pool.query(`
      SELECT 
        p.id as patient_id,
        u.first_name,
        u.last_name,
        u.dob,
        p.risk_score,
        p.is_high_risk,
        p.medical_conditions,
        cp.assigned_date
      FROM patients p
      JOIN users u ON p.user_id = u.id
      JOIN caregiver_patients cp ON p.id = cp.patient_id
      WHERE cp.caregiver_id = $1 
      AND cp.is_active = true
      AND u.is_active = true
      ORDER BY p.risk_score DESC
    `, [caregiverId]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}