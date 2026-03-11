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
      facilityName,
      specialization,
      yearsOfExperience,
      // Patient fields
      medicalConditions,
      initialHealthScore,
      deviceMacAddress,
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

    // Validate account-type specific required fields BEFORE any DB writes
    if (accountType === "caregiver") {
      if (!specialization) {
        return NextResponse.json(
          { error: "Specialization is required for caregivers" },
          { status: 400 },
        );
      }
    } else if (accountType === "user") {
      if (!deviceMacAddress) {
        return NextResponse.json(
          { error: "Device MAC address is required for patient accounts" },
          { status: 400 },
        );
      }
      const macRegex = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})$/;
      if (!macRegex.test(deviceMacAddress)) {
        return NextResponse.json(
          { error: "Invalid MAC address format" },
          { status: 400 },
        );
      }
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
      await dbService.caregivers.create({
        userId: newUser.id,
        facilityName,
        specialization,
        yearsOfExperience,
      });
    } else if (accountType === "user") {
      // Determine initial health score
      let initialScore = 75; // Default to 75 if not provided
      if (initialHealthScore) {
        const scoreNum = parseInt(initialHealthScore, 10);
        if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
          initialScore = scoreNum;
        }
      }

      // Calculate risk score as inverse of health score
      const initialRiskScore = 100 - initialScore;

      const patient = await dbService.patients.create({
        userId: newUser.id,
        riskScore: initialRiskScore,
        isHighRisk: initialRiskScore >= 75,
        medicalConditions,
      });

      // Normalize MAC to device ID format matching firmware: SF-AABBCCDDEEFF
      const normalizedMac = deviceMacAddress.replace(/:/g, '').toUpperCase();
      const deviceId = `SF-${normalizedMac}`;

      // Create device with normalized device ID
      await dbService.devices.create({
        deviceId,
        patientId: patient.id,
        isActive: true,
      });

      // Create initial health log for patient
      await dbService.healthLogs.create({
        patientId: patient.id,
        healthScore: initialScore,
        recordedAt: new Date(),
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
