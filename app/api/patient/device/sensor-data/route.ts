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
        { status: 404 }
      );
    }

    // Fetch devices for this patient
    const devices = await dbService.devices.findByPatientId(patient.id);

    if (devices.length === 0) {
      return NextResponse.json({
        sensorData: [],
        device: null,
      });
    }

    // Get first device (patients typically have one)
    const device = devices[0];

    // Fetch last 20 sensor readings (use device.id which is the database ID/foreign key)
    const sensorData = await dbService.sensorData.findRecent(device.id, 20);

    return NextResponse.json({
      sensorData,
      device,
    });
  } catch (error) {
    console.error("[API] Error fetching sensor data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
