import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count 
       FROM messages 
       WHERE patient_id = $1 AND is_read = false`,
      [patient_id]
    );

    return NextResponse.json(
      { unread_count: parseInt(result.rows[0].unread_count) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}