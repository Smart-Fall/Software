import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDbServiceAsync } from "@/lib/db/service";

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      dob,
      email,
      password,
      accountType,
      // Caregiver fields
      specialization,
      yearsOfExperience,
      // Patient fields
      medicalConditions,
    } = await request.json();

    // Validate input
    if (
      !firstName ||
      !lastName ||
      !dob ||
      !email ||
      !password ||
      !accountType
    ) {
      return NextResponse.json(
        { error: "All basic fields are required" },
        { status: 400 },
      );
    }

    // Validate account type
    if (!["caregiver", "user"].includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const dbService = await getDbServiceAsync();
    const existingUser = await dbService.users.findByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await dbService.users.create({
      email,
      passwordHash: hashedPassword,
      accountType,
      firstName,
      lastName,
      dob: new Date(dob),
    });

    // Create account-specific data
    if (accountType === "caregiver") {
      if (!specialization) {
        return NextResponse.json(
          { error: "Specialization is required for caregivers" },
          { status: 400 },
        );
      }

      await dbService.caregivers.create({
        userId: newUser.id,
        specialization,
        yearsOfExperience,
      });
    } else if (accountType === "user") {
      await dbService.patients.create({
        userId: newUser.id,
        medicalConditions,
      });
    }

    // Format response
    const user = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      accountType: newUser.accountType,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
