import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

// MAC address regex: accepts both formats (XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX)
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})$/;

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceMacAddress } = body;

    if (!deviceMacAddress || typeof deviceMacAddress !== "string") {
      return NextResponse.json(
        { error: "Device MAC address is required" },
        { status: 400 }
      );
    }

    // Validate MAC address format
    if (!MAC_REGEX.test(deviceMacAddress)) {
      return NextResponse.json(
        {
          error:
            "Invalid MAC address format. Use XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX",
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "No device found for this patient" },
        { status: 404 }
      );
    }

    // Get first device (patients typically have one)
    const existingDevice = devices[0];

    // Check if new MAC is already bound to another patient
    const conflictingDevice = await dbService.devices.findByDeviceId(
      deviceMacAddress
    );

    if (conflictingDevice && conflictingDevice.id !== existingDevice.id) {
      return NextResponse.json(
        {
          error:
            "This device MAC address is already registered to another patient",
        },
        { status: 409 }
      );
    }

    // Update device with new MAC address
    const updatedDevice = await dbService.devices.update(existingDevice.id, {
      deviceId: deviceMacAddress,
    });

    return NextResponse.json({ device: updatedDevice });
  } catch (error) {
    console.error("[API] Error updating device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
