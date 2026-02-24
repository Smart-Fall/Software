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
