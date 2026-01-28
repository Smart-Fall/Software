import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(_request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();

    // Get caregiver
    const caregiver = await dbService.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    // Get all patients assigned to this caregiver
    const patients = await dbService.patients.findByCaregiverId(caregiver.id);

    // Get all devices for those patients
    const devicesList = await Promise.all(
      patients.map((p) => dbService.devices.findByPatientId(p.id)),
    );

    const devices = devicesList.flat().sort((a, b) => {
      const aTime = a.lastSeen?.getTime() || 0;
      const bTime = b.lastSeen?.getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ devices }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching caregiver devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
