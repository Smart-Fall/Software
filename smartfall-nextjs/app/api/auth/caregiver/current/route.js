// 

// import { NextResponse } from 'next/server';
// import pool from '@/lib/db';
// import { getSession } from '@/lib/auth';

// export async function GET() {
//   try {
//     const session = await getSession();
    
//     if (!session) {
//       return NextResponse.json(
//         { error: 'Not authenticated' },
//         { status: 401 }
//       );
//     }
    
//     // session.userId is automatically available from the logged-in user!
//     const result = await pool.query(`
//       SELECT 
//         c.id as caregiver_id,
//         u.first_name,
//         u.last_name,
//         c.facility_name,
//         c.specialization
//       FROM caregivers c
//       JOIN users u ON c.user_id = u.id
//       WHERE c.user_id = $1
//     `, [session.userId]); // <-- Automatically filled from session
    
//     if (result.rows.length === 0) {
//       return NextResponse.json(
//         { error: 'Caregiver not found' },
//         { status: 404 }
//       );
//     }
    
//     return NextResponse.json(result.rows[0]);
//   } catch (error) {
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    console.log('=== Caregiver Current API Called ===');
    const session = await getSession();
    
    console.log('Session:', session);
    
    if (!session || !session.userId) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('Querying database for userId:', session.userId);
    
    const result = await pool.query(`
      SELECT 
        c.id as caregiver_id,
        u.first_name,
        u.last_name,
        c.facility_name,
        c.specialization
      FROM caregivers c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
    `, [session.userId]);
    
    console.log('Query result rows:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No caregiver found for this user');
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error in caregiver/current API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}