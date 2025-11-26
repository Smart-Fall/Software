import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from 'app/lib/db';

export async function POST(request: Request) {
  const client = await pool.connect();
  
  try {
    const { 
      firstName, 
      lastName, 
      dob, 
      email, 
      password, 
      phone,
      accountType,
      // Caregiver fields
      facilityName,
      licenseNumber,
      specialization,
      // Patient fields
      emergencyContactName,
      emergencyContactPhone,
      medicalConditions
    } = await request.json();

    // Validate input
    if (!firstName || !lastName || !dob || !email || !password || !accountType || !phone) {
      return NextResponse.json(
        { error: 'All basic fields are required' },
        { status: 400 }
      );
    }

    // Validate account type
    if (!['caregiver', 'user'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Begin transaction
    await client.query('BEGIN');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (first_name, last_name, dob, email, password, account_type, phone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, first_name, last_name, email, account_type, created_at`,
      [firstName, lastName, dob, email, hashedPassword, accountType, phone]
    );

    const user = userResult.rows[0];

    // Insert account-specific data
    if (accountType === 'caregiver') {
      if (!facilityName || !specialization) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Facility name and specialization are required for caregivers' },
          { status: 400 }
        );
      }

      await client.query(
        `INSERT INTO caregivers (user_id, facility_name, license_number, specialization)
         VALUES ($1, $2, $3, $4)`,
        [user.id, facilityName, licenseNumber || null, specialization]
      );
    } else if (accountType === 'user') {
      if (!emergencyContactName || !emergencyContactPhone) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Emergency contact information is required for patients' },
          { status: 400 }
        );
      }

      await client.query(
        `INSERT INTO patients (user_id, emergency_contact_name, emergency_contact_phone, medical_conditions)
         VALUES ($1, $2, $3, $4)`,
        [user.id, emergencyContactName, emergencyContactPhone, medicalConditions || null]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: user 
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}