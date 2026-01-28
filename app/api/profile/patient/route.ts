import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.accountType !== "user") {
      return NextResponse.json(
        { error: "Only patients can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { medicalConditions } = body;

    // Validation
    if (medicalConditions !== undefined) {
      if (typeof medicalConditions !== "string") {
        return NextResponse.json(
          { error: "medicalConditions must be a string" },
          { status: 400 }
        );
      }
      if (medicalConditions.length > 1000) {
        return NextResponse.json(
          { error: "medicalConditions cannot exceed 1000 characters" },
          { status: 400 }
        );
      }
    }

    const dbService = await getDbServiceAsync();

    // Find patient
    const patient = await dbService.patients.findByUserId(session.userId);
    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 }
      );
    }

    // Update patient
    const updateData: any = {};
    if (medicalConditions !== undefined) {
      updateData.medicalConditions = medicalConditions.trim();
    }

    const updatedPatient = await dbService.patients.update(
      patient.id,
      updateData
    );

    return NextResponse.json({
      patient: {
        id: updatedPatient.id,
        medicalConditions: updatedPatient.medicalConditions,
        riskScore: updatedPatient.riskScore,
        isHighRisk: updatedPatient.isHighRisk,
      },
    });
  } catch (error) {
    console.error("[API] Error updating patient profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
