import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { patientId, deviceName, isActive } = body;

    const dbService = await getDbServiceAsync();

    const device = await dbService.devices.findById(id);
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (patientId !== undefined) updateData.patientId = patientId || null;
    if (deviceName !== undefined) updateData.deviceName = deviceName;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDevice = await dbService.devices.update(id, updateData);

    return NextResponse.json({ device: updatedDevice });
  } catch (error: unknown) {
    console.error("Admin update device error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
