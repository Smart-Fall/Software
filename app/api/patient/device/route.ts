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

    // Fetch devices for this patient
    const devices = await dbService.devices.findByPatientId(patient.id);

    // Get latest status for each device
    const devicesWithStatus = await Promise.all(
      devices.map(async (d) => {
        const latestStatus = await dbService.deviceStatus.findLatest(d.deviceId);
        return { ...d, latestStatus };
      }),
    );

    return NextResponse.json({
      devices: devicesWithStatus.sort((a, b) => {
        const aTime = a.lastSeen?.getTime() || 0;
        const bTime = b.lastSeen?.getTime() || 0;
        return bTime - aTime;
      }),
    });
  } catch (error) {
    console.error("[API] Error fetching patient devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
