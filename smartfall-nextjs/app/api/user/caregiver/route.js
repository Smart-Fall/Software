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
    
    // Get the patient's ID first
    const patientResult = await pool.query(`
      SELECT id FROM patients WHERE user_id = $1
    `, [session.userId]);
    
    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    const patientId = patientResult.rows[0].id;
    
    // Get the caregiver assigned to this patient
    const result = await pool.query(`
      SELECT 
        u.first_name,
        u.last_name,
        c.facility_name,
        c.specialization
      FROM caregiver_patients cp
      JOIN caregivers c ON cp.caregiver_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cp.patient_id = $1
      LIMIT 1
    `, [patientId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No caregiver assigned' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
