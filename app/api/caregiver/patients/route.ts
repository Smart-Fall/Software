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

    // Get caregiver from the logged-in user
    const caregiver = await dbService.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    // Get patients assigned to this caregiver
    const patients = await dbService.patients.findByCaregiverId(caregiver.id);

    // Get assignments for dates
    const assignments = await dbService.caregiverPatients.findByCaregiverId(
      caregiver.id,
    );

    const formattedPatients = patients.map((p) => {
      const assignment = assignments.find((a) => a.patientId === p.id);
      return {
        patientId: p.id,
        firstName: p.user?.firstName,
        lastName: p.user?.lastName,
        dob: p.user?.dob,
        riskScore: p.riskScore,
        isHighRisk: p.isHighRisk,
        medicalConditions: p.medicalConditions,
        assignedDate: assignment?.assignedDate,
      };
    });

    return NextResponse.json(formattedPatients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
