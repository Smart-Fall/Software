// import { NextResponse } from 'next/server';
// import pool from '@/lib/db';
// import { getSession } from '@/lib/auth';

// export async function GET(req, context) {
//   try {
//     const session = await getSession();
    
//     if (!session || !session.userId) {
//       return NextResponse.json(
//         { error: 'Not authenticated' },
//         { status: 401 }
//       );
//     }
    
//     const params = await context.params;
//     const patientId = params.patientId;
    
//     // Get caregiver_id from session
//     const caregiverResult = await pool.query(
//       'SELECT id FROM caregivers WHERE user_id = $1',
//       [session.userId]
//     );
    
//     if (caregiverResult.rows.length === 0) {
//       return NextResponse.json(
//         { error: 'Caregiver not found' },
//         { status: 404 }
//       );
//     }
    
//     const caregiverId = caregiverResult.rows[0].id;
    
//     // Check if caregiver has access to patient
//     const accessCheck = await pool.query(`
//       SELECT 1 FROM caregiver_patients 
//       WHERE caregiver_id = $1 AND patient_id = $2 AND is_active = true
//     `, [caregiverId, patientId]);
    
//     if (accessCheck.rows.length === 0) {
//       return NextResponse.json(
//         { error: 'Access denied' },
//         { status: 403 }
//       );
//     }
    
//     // Get patient statistics
//     const statsQuery = `
//       SELECT 
//         -- Total alerts (using falls as alerts)
//         (SELECT COUNT(*) FROM falls WHERE patient_id = $1) as total_alerts,
        
//         -- Total messages from this caregiver
//         (SELECT COUNT(*) FROM messages WHERE patient_id = $1 AND caregiver_id = $2) as total_messages,
        
//         -- Unread messages from this caregiver
//         (SELECT COUNT(*) FROM messages WHERE patient_id = $1 AND caregiver_id = $2 AND is_read = false) as unread_messages,
        
//         -- Current health score (based on risk score)
//         (SELECT COALESCE(100 - risk_score, 0) FROM patients WHERE id = $1) as current_health_score,
        
//         -- Falls this week
//         (SELECT COUNT(*) FROM falls WHERE patient_id = $1 AND fall_datetime >= CURRENT_DATE - INTERVAL '7 days') as falls_this_week,
        
//         -- Falls this month
//         (SELECT COUNT(*) FROM falls WHERE patient_id = $1 AND fall_datetime >= CURRENT_DATE - INTERVAL '30 days') as falls_this_month
//     `;
    
//     const result = await pool.query(statsQuery, [patientId, caregiverId]);
    
//     const stats = {
//       totalAlerts: parseInt(result.rows[0].total_alerts) || 0,
//       totalMessages: parseInt(result.rows[0].total_messages) || 0,
//       unreadMessages: parseInt(result.rows[0].unread_messages) || 0,
//       currentHealthScore: parseInt(result.rows[0].current_health_score) || 0,
//       fallsThisWeek: parseInt(result.rows[0].falls_this_week) || 0,
//       fallsThisMonth: parseInt(result.rows[0].falls_this_month) || 0
//     };
    
//     return NextResponse.json(stats);
//   } catch (error) {
//     console.error('Error fetching patient stats:', error);
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }

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
    
    // Get patient statistics
    const statsQuery = `
      SELECT 
        -- Total alerts (using falls as alerts)
        (SELECT COUNT(*) FROM falls WHERE patient_id = $1) as total_alerts,
        
        -- Total messages from this caregiver to this patient
        (SELECT COUNT(*) FROM messages WHERE patient_id = $1 AND caregiver_id = $2) as total_messages,
        
        -- Unread messages (messages the PATIENT hasn't read yet)
        (SELECT COUNT(*) FROM messages 
         WHERE patient_id = $1 
         AND caregiver_id = $2 
         AND is_read = false) as unread_messages,
        
        -- Current health score (based on risk score)
        (SELECT COALESCE(100 - risk_score, 0) FROM patients WHERE id = $1) as current_health_score,
        
        -- Falls this week
        (SELECT COUNT(*) FROM falls 
         WHERE patient_id = $1 
         AND fall_datetime >= NOW() - INTERVAL '7 days') as falls_this_week,
        
        -- Falls this month
        (SELECT COUNT(*) FROM falls 
         WHERE patient_id = $1 
         AND fall_datetime >= NOW() - INTERVAL '30 days') as falls_this_month
    `;
    
    const result = await pool.query(statsQuery, [patientId, caregiverId]);
    
    console.log('Stats query result:', result.rows[0]); // Debug log
    
    const stats = {
      totalAlerts: parseInt(result.rows[0].total_alerts) || 0,
      totalMessages: parseInt(result.rows[0].total_messages) || 0,
      unreadMessages: parseInt(result.rows[0].unread_messages) || 0,
      currentHealthScore: parseInt(result.rows[0].current_health_score) || 0,
      fallsThisWeek: parseInt(result.rows[0].falls_this_week) || 0,
      fallsThisMonth: parseInt(result.rows[0].falls_this_month) || 0
    };
    
    console.log('Formatted stats:', stats); // Debug log
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}