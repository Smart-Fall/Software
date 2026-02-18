import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const result = await pool.query(`
      SELECT 
        p.id as patient_id,
        u.first_name,
        u.last_name,
        u.dob,
        p.risk_score,
        p.is_high_risk,
        p.medical_conditions
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 AND u.is_active = true
    `, [session.userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
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
