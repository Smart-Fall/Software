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

    // Get patient record for the logged-in user
    const patient = await dbService.patients.findByUserId(session.userId);

    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 },
      );
    }

    // Get caregiver assignment for this patient
    const caregiverAssignment = await dbService.caregiverPatients.findByPatientId(
      patient.id,
    );

    if (!caregiverAssignment || caregiverAssignment.length === 0) {
      return NextResponse.json(
        { message: "No caregiver assigned" },
        { status: 200 },
      );
    }

    // Get the caregiver details (use the first assignment)
    const assignment = caregiverAssignment[0];
    const caregiver = await dbService.caregivers.findById(assignment.caregiverId);

    if (!caregiver || !caregiver.user) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      firstName: caregiver.user.firstName,
      lastName: caregiver.user.lastName,
      facilityName: caregiver.facilityName,
      specialization: caregiver.specialization,
    });
  } catch (error) {
    console.error("[API] Error fetching patient caregiver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
