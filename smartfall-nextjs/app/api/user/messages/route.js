import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');
    
    console.log('=== Fetching messages for patient_id:', patientId);
    
    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(`
      SELECT 
        m.id,
        m.subject,
        m.message_text,
        m.is_read,
        m.is_urgent,
        m.sent_at,
        m.read_at,
        u.first_name as caregiver_first_name,
        u.last_name as caregiver_last_name,
        m.caregiver_id
      FROM messages m
      JOIN caregivers c ON m.caregiver_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE m.patient_id = $1
      ORDER BY m.sent_at DESC
    `, [patientId]);
    
    console.log('Found messages:', result.rows.length);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}