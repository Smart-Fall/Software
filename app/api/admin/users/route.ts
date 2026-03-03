import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const dbService = await getDbServiceAsync();
    const [users, totalUsers] = await Promise.all([
      dbService.users.findAll({ skip, take }),
      dbService.users.count(),
    ]);

    // Remove passwordHash from response
    const safeUsers = users.map(({ passwordHash: _passwordHash, ...rest }) => {
      void _passwordHash;
      return rest;
    });

    return NextResponse.json({ users: safeUsers, total: totalUsers });
  } catch (error: unknown) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      accountType,
      firstName,
      lastName,
      dob,
      // Patient-specific fields
      medicalConditions,
      // Caregiver-specific fields
      facilityName,
      specialization,
      yearsOfExperience,
    } = body;

    if (!email || !password || !accountType) {
      return NextResponse.json(
        { error: "Email, password, and account type are required" },
        { status: 400 },
      );
    }

    if (!["user", "caregiver"].includes(accountType)) {
      return NextResponse.json(
        { error: "Account type must be 'user' or 'caregiver'" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();

    // Check if email exists
    const existing = await dbService.users.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await dbService.users.create({
      email,
      passwordHash,
      accountType,
      firstName,
      lastName,
      dob: dob ? new Date(dob) : undefined,
    });

    // Create associated Patient or Caregiver record
    if (accountType === "user") {
      await dbService.patients.create({
        userId: user.id,
        riskScore: 0,
        isHighRisk: false,
        medicalConditions,
      });
    } else if (accountType === "caregiver") {
      let parsedYears: number | undefined = undefined;
      if (yearsOfExperience) {
        const parsed = parseInt(yearsOfExperience, 10);
        parsedYears = Number.isNaN(parsed) ? undefined : parsed;
      }
      await dbService.caregivers.create({
        userId: user.id,
        facilityName,
        specialization,
        yearsOfExperience: parsedYears,
      });
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return NextResponse.json(
      { message: "User created successfully", user: safeUser },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
