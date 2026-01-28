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
    const device = await dbService.devices.findByDeviceId(deviceId);

    if (!device) {
      console.log(
        `[API] Sensor data from unregistered device: ${deviceId} (sensor data will not be stored)`
      );
      return NextResponse.json(
        { success: true, message: "Device not registered" },
        { status: 200 },
      );
    }

    // Rate limiting: only store 1 per second
    const oneSecondAgo = new Date(Date.now() - 1000);
    const recentData = await dbService.sensorData
      .findByDeviceId(device.id, { take: 1 })
      .then((data) => data.find((d) => d.timestamp >= oneSecondAgo));

    if (!recentData) {
      await dbService.sensorData.create({
        deviceId: device.id,
        timestamp: new Date(),
        accelX: data.accel_x || 0,
        accelY: data.accel_y || 0,
        accelZ: data.accel_z || 0,
        gyroX: data.gyro_x || 0,
        gyroY: data.gyro_y || 0,
        gyroZ: data.gyro_z || 0,
        pressure: data.pressure || null,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] Error processing sensor data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
