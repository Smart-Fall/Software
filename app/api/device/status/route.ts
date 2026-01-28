import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const deviceId = data.device_id || request.headers.get("x-device-id");

    if (!deviceId) {
      return NextResponse.json(
        { error: "device_id is required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();
    let device = await dbService.devices.findByDeviceId(deviceId);

    if (!device) {
      console.log(`[API] Auto-registering new device: ${deviceId}`);
      device = await dbService.devices.create({
        deviceId: deviceId,
        deviceName: `SmartFall Device ${deviceId}`,
        isActive: true,
        batteryLevel: data.battery_level || null,
      });
    }

    await dbService.devices.update(device.id, {
      lastSeen: new Date(),
      batteryLevel: data.battery_level || device.batteryLevel,
    });

    const status = await dbService.deviceStatus.create({
      deviceId: device.id,
      timestamp: new Date(),
      batteryPercentage: data.battery_level || 0,
      wifiConnected: data.wifi_connected ?? true,
      bluetoothConnected: data.bluetooth_connected ?? false,
      sensorsInitialized: data.sensors_initialized ?? true,
      uptimeMs: BigInt(data.uptime || 0),
      currentStatus: data.current_status || "active",
    });

    return NextResponse.json(
      { success: true, status_id: status.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API] Error processing status update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
