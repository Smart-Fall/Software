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
    
    // Get caregiver_id from session
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
    
    // Fetch all messages sent to this patient by this caregiver
    const result = await pool.query(`
      SELECT 
        id,
        subject,
        message_text,
        is_read,
        is_urgent,
        sent_at,
        read_at
      FROM messages
      WHERE patient_id = $1 AND caregiver_id = $2
      ORDER BY sent_at DESC
    `, [patientId, caregiverId]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}