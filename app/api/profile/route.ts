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

    // Fetch user
    const user = await dbService.users.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch role-specific data
    if (session.accountType === "user") {
      const patient = await dbService.patients.findByUserId(session.userId);
      if (!patient) {
        return NextResponse.json(
          { error: "Patient record not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dob: user.dob,
        },
        patient: {
          id: patient.id,
          medicalConditions: patient.medicalConditions,
          riskScore: patient.riskScore,
          isHighRisk: patient.isHighRisk,
        },
      });
    } else if (session.accountType === "caregiver") {
      const caregiver = await dbService.caregivers.findByUserId(
        session.userId
      );
      if (!caregiver) {
        return NextResponse.json(
          { error: "Caregiver record not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        caregiver: {
          id: caregiver.id,
          facilityName: caregiver.facilityName,
          specialization: caregiver.specialization,
          yearsOfExperience: caregiver.yearsOfExperience,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid account type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
