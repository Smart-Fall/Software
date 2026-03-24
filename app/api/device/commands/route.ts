import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");

    if (!deviceId) {
      return NextResponse.json(
        { error: "device_id is required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();
    const device = await dbService.devices.findByDeviceId(deviceId);

    if (!device) {
      return NextResponse.json({ mute: false }, { status: 200 });
    }

    return NextResponse.json({ mute: device.isMuted }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching device commands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
