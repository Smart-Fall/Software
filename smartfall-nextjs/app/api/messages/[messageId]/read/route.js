import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req, context) {
  try {
    // In Next.js 13+, params might need to be awaited
    const params = await context.params;
    const messageId = params.messageId;
    const body = await req.json();
    const { patient_id } = body;
    
    console.log('=== MARK AS READ API ===');
    console.log('Message ID from params:', messageId);
    console.log('Patient ID from body:', patient_id);
    console.log('Full params object:', params);
    console.log('Full body:', body);
    
    if (!messageId || !patient_id) {
      console.error('Missing required fields:', { messageId, patient_id });
      return NextResponse.json(
        { error: 'Message ID and patient ID are required' },
        { status: 400 }
      );
    }
    
    // Update the message to mark as read
    const result = await pool.query(`
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND patient_id = $2
      RETURNING *
    `, [messageId, patient_id]);
    
    if (result.rows.length === 0) {
      console.log('No message found with id:', messageId, 'for patient:', patient_id);
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Message marked as read successfully');
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}