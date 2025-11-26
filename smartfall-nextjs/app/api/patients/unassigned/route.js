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
    
    const result = await pool.query(`
      SELECT 
        p.id as patient_id,
        u.first_name,
        u.last_name,
        u.dob,
        p.risk_score,
        p.is_high_risk
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id NOT IN (
        SELECT patient_id 
        FROM caregiver_patients 
        WHERE is_active = true
      )
      AND u.is_active = true
      ORDER BY p.risk_score DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// import { NextResponse } from 'next/server';
// import pool from 'app/lib/db';
// import { getSession } from 'app/lib/auth';

// export async function GET() {
//   try {
//     console.log('🔍 Fetching unassigned patients...');
    
//     const session = await getSession();
//     console.log('✅ Session:', session);
    
//     if (!session) {
//       console.log('❌ No session found');
//       return NextResponse.json(
//         { error: 'Not authenticated' },
//         { status: 401 }
//       );
//     }
    
//     console.log('🔍 Running query for unassigned patients...');
    
//     const result = await pool.query(`
//       SELECT 
//         p.id as patient_id,
//         u.first_name,
//         u.last_name,
//         u.dob,
//         p.risk_score,
//         p.is_high_risk,
//         p.medical_conditions
//       FROM patients p
//       JOIN users u ON p.user_id = u.id
//       WHERE p.id NOT IN (
//         SELECT patient_id 
//         FROM caregiver_patients 
//         WHERE is_active = true
//       )
//       AND u.is_active = true
//       ORDER BY p.risk_score DESC
//     `);
    
//     console.log('✅ Query successful, rows:', result.rows.length);
//     console.log('📊 Data:', result.rows);
    
//     return NextResponse.json(result.rows);
//   } catch (error) {
//     console.error('❌ Error in /api/patients/unassigned:', error);
//     console.error('Error details:', error.message);
//     console.error('Error stack:', error.stack);
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }