// import { NextResponse } from 'next/server';
// import pool from '@/lib/db';

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { patient_id, subject, message_text, is_urgent, caregiver_id } = body;

//     // Validate required fields
//     if (!patient_id || !message_text || !caregiver_id) {
//       return NextResponse.json(
//         { error: 'patient_id, message_text, and caregiver_id are required' },
//         { status: 400 }
//       );
//     }

//     // Verify that the patient is assigned to this caregiver
//     const relationshipCheck = await pool.query(
//       `SELECT id FROM caregiver_patients 
//        WHERE caregiver_id = $1 AND patient_id = $2 AND is_active = true`,
//       [caregiver_id, patient_id]
//     );

//     if (relationshipCheck.rows.length === 0) {
//       return NextResponse.json(
//         { error: 'You are not authorized to send messages to this patient' },
//         { status: 403 }
//       );
//     }

//     // Insert the message
//     const result = await pool.query(
//       `INSERT INTO messages (caregiver_id, patient_id, subject, message_text, is_urgent)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING *`,
//       [caregiver_id, patient_id, subject || '', message_text, is_urgent || false]
//     );

//     return NextResponse.json(result.rows[0], { status: 201 });
//   } catch (error) {
//     console.error('Error sending message:', error);
//     return NextResponse.json(
//       { error: 'Failed to send message' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
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
    
    const { patient_id, subject, message_text, is_urgent } = await req.json();
    
    const result = await pool.query(`
      INSERT INTO messages (caregiver_id, patient_id, subject, message_text, is_urgent, sent_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `, [caregiverId, patient_id, subject, message_text, is_urgent || false]);
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}