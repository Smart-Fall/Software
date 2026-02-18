import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDbServiceAsync } from "@/lib/db/service";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user by email
    const dbService = await getDbServiceAsync();
    const user = await dbService.users.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create session
    await createSession(user.id, user.accountType);

    // Don't send password back to client
    const { passwordHash: _, ...userWithoutPassword } = user;

    // Add patient_id or caregiver_id
    if (user.account_type === 'caregiver') {
      const caregiverResult = await pool.query(
        'SELECT id FROM caregivers WHERE user_id = $1',
        [user.id]
      );
      if (caregiverResult.rows.length > 0) {
        userWithoutPassword.caregiver_id = caregiverResult.rows[0].id;
      }
    } else if (user.account_type === 'user') {
      const patientResult = await pool.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [user.id]
      );
      if (patientResult.rows.length > 0) {
        userWithoutPassword.patient_id = patientResult.rows[0].id;
      }
    }

    console.log('Login response:', userWithoutPassword);

    return NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
