import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const patient_id = body?.patient_id;

    if (
      patient_id == null ||
      (typeof patient_id !== "string" && typeof patient_id !== "number")
    ) {
      return NextResponse.json(
        { error: "Invalid or missing patient_id" },
        { status: 400 },
      );
    }

    const patientId = String(patient_id);

    const dbService = await getDbServiceAsync();

    // Get caregiver_id from logged-in user
    const caregiver = await dbService.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    const existing = await dbService.caregiverPatients.findByIds(
      caregiver.id,
      patientId,
    );

    if (existing?.isActive) {
      return NextResponse.json(
        { error: "Patient is already assigned to you" },
        { status: 409 },
      );
    }

    if (existing && !existing.isActive) {
      const reactivated = await dbService.caregiverPatients.update(
        caregiver.id,
        patientId,
        { isActive: true },
      );
      return NextResponse.json(reactivated);
    }

    const assignment = await dbService.caregiverPatients.create({
      caregiverId: caregiver.id,
      patientId,
      isActive: true,
    });

    return NextResponse.json(assignment);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
