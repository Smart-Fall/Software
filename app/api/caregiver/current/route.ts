import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();
    const caregiver = await dbService.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      caregiverId: caregiver.id,
      firstName: caregiver.user?.firstName,
      lastName: caregiver.user?.lastName,
      specialization: caregiver.specialization,
      yearsOfExperience: caregiver.yearsOfExperience,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// import { NextResponse } from 'next/server';
// import pool from 'app/lib/db';
// import { getSession } from 'app/lib/auth';

// export async function GET() {
//   try {
//     console.log('🔍 Attempting to get session...');
//     const session = await getSession();
//     console.log('✅ Session retrieved:', session);

//     if (!session) {
//       console.log('❌ No session found');
//       return NextResponse.json(
//         { error: 'Not authenticated' },
//         { status: 401 }
//       );
//     }

//     console.log('🔍 Querying database for user_id:', session.userId);

//     // First, let's check if the user exists
//     const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [session.userId]);
//     console.log('👤 User record:', userCheck.rows[0]);

//     // Then check for caregiver record
//     const caregiverCheck = await pool.query('SELECT * FROM caregivers WHERE user_id = $1', [session.userId]);
//     console.log('👨‍⚕️ Caregiver record:', caregiverCheck.rows[0]);

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
//     `, [session.userId]);

//     console.log('✅ Final query result:', result.rows);

//     if (result.rows.length === 0) {
//       console.log('❌ No caregiver found for user_id:', session.userId);
//       return NextResponse.json(
//         { error: 'Caregiver not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(result.rows[0]);
//   } catch (error) {
//     console.error('❌ Error in /api/caregiver/current:', error);
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }
