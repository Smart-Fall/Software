import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbService = await getDbServiceAsync();

    // Fetch all caregivers and patients to build assignment data
    const caregivers = await dbService.caregivers.findMany({ take: 200 });
    const assignments: Array<{
      id: string;
      caregiverId: string;
      patientId: string;
      assignedDate: Date;
      isActive: boolean;
      caregiverName: string;
      patientName: string;
      facilityName?: string;
    }> = [];

    for (const caregiver of caregivers) {
      const caregiverAssignments =
        await dbService.caregiverPatients.findByCaregiverId(caregiver.id);
      for (const assignment of caregiverAssignments) {
        const patient = await dbService.patients.findById(assignment.patientId);
        const patientUser = patient
          ? await dbService.users.findById(patient.userId)
          : null;
        const caregiverUser = await dbService.users.findById(caregiver.userId);

        assignments.push({
          id: assignment.id,
          caregiverId: assignment.caregiverId,
          patientId: assignment.patientId,
          assignedDate: assignment.assignedDate,
          isActive: assignment.isActive,
          caregiverName: caregiverUser
            ? `${caregiverUser.firstName || ""} ${caregiverUser.lastName || ""}`.trim()
            : "Unknown",
          patientName: patientUser
            ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim()
            : "Unknown",
          facilityName: caregiver.facilityName,
        });
      }
    }

    return NextResponse.json({ assignments });
  } catch (error: unknown) {
    console.error("Admin assignments list error:", error);
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

    const { caregiverId, patientId } = await request.json();

    if (!caregiverId || !patientId) {
      return NextResponse.json(
        { error: "Caregiver ID and Patient ID are required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();

    // Check if assignment already exists
    const existing = await dbService.caregiverPatients.findByIds(
      caregiverId,
      patientId,
    );
    if (existing) {
      return NextResponse.json(
        { error: "This assignment already exists" },
        { status: 409 },
      );
    }

    const assignment = await dbService.caregiverPatients.create({
      caregiverId,
      patientId,
      isActive: true,
    });

    return NextResponse.json(
      { message: "Assignment created", assignment },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Admin create assignment error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
