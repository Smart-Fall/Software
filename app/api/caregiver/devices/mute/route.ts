import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.accountType !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { deviceId, muted } = body;

    if (!deviceId || typeof muted !== "boolean") {
      return NextResponse.json(
        { error: "deviceId and muted (boolean) are required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();

    // Verify caregiver exists
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    // Verify device exists and belongs to one of this caregiver's patients
    const device = await dbService.devices.findByDeviceId(deviceId);
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.patientId) {
      const assignment = await dbService.caregiverPatients.findByIds(
        caregiver.id,
        device.patientId,
      );
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await dbService.devices.updateByDeviceId(deviceId, {
      isMuted: muted,
    });

    return NextResponse.json(
      { device: updated, muted: updated.isMuted },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API] Error updating device mute state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
