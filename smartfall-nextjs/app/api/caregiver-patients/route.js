import { NextResponse } from 'next/server';
import pool from 'app/lib/db';
import { getSession } from 'app/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { patient_id } = await request.json();
    
    // Get caregiver_id from logged-in user
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
      INSERT INTO caregiver_patients (caregiver_id, patient_id, assigned_date, is_active)
      VALUES ($1, $2, CURRENT_TIMESTAMP, true)
      RETURNING *
    `, [caregiverId, patient_id]);
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}