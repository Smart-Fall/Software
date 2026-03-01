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
      console.log(`[API] Auto-registering new device from sensor stream: ${deviceId}`);
      device = await dbService.devices.create({
        deviceId: deviceId,
        deviceName: `SmartFall Device ${deviceId}`,
        isActive: true,
      });
    }

    // Rate limiting: only store 1 per second
    const oneSecondAgo = new Date(Date.now() - 1000);
    const recentData = await dbService.sensorData
      .findByDeviceId(device.id, { take: 1 })
      .then((data) => data.find((d) => d.timestamp >= oneSecondAgo));

    if (!recentData) {
      await dbService.sensorData.create({
        deviceId: device.id, // Use database ID (foreign key to Device)
        timestamp: new Date(),
        accelX: data.accel_x || 0,
        accelY: data.accel_y || 0,
        accelZ: data.accel_z || 0,
        gyroX: data.gyro_x || 0,
        gyroY: data.gyro_y || 0,
        gyroZ: data.gyro_z || 0,
        pressure: data.pressure || null,
        fsr: data.fsr || null,
      });
    }

    // Update device battery level if provided
    if (data.battery_level !== undefined) {
      console.log(`[API] Updating device ${device.id} battery to ${data.battery_level}%`);
      await dbService.devices.update(device.id, {
        batteryLevel: data.battery_level,
        lastSeen: new Date(),
      });
    }

    // Store device status if provided
    if (
      data.battery_level !== undefined ||
      data.wifi_connected !== undefined ||
      data.uptime_ms !== undefined
    ) {
      await dbService.deviceStatus.create({
        deviceId: device.id,
        timestamp: new Date(),
        batteryPercentage: data.battery_level || 0,
        wifiConnected: data.wifi_connected !== false,
        bluetoothConnected: data.bluetooth_connected !== false,
        sensorsInitialized: data.sensors_initialized !== false,
        uptimeMs: BigInt(data.uptime_ms || 0),
        currentStatus: data.status || 'active',
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
