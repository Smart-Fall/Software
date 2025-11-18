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
    
    const result = await pool.query(
      'SELECT id, email, account_type, first_name, last_name FROM users WHERE id = $1',
      [session.userId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}