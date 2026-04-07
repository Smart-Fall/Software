import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";

export async function POST(request: Request) {
  try {
    const expectedApiKey = process.env.DEVICE_INGEST_API_KEY;
    if (!expectedApiKey) {
      console.error("[API] DEVICE_INGEST_API_KEY is not configured");
      return NextResponse.json(
        { error: "Device ingestion is not configured" },
        { status: 500 },
      );
    }

    const providedApiKey = request.headers.get("x-device-api-key");
    if (!providedApiKey || providedApiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized device request" },
        { status: 401 },
      );
    }

    const data = await request.json();

    if (!data.device_id) {
      return NextResponse.json(
        { error: "device_id is required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();

    // Find or create device
    let device = await dbService.devices.findByDeviceId(data.device_id);

    if (!device) {
      console.log(`[API] Creating new device: ${data.device_id}`);
      device = await dbService.devices.create({
        deviceId: data.device_id,
        deviceName: `SmartFall Device ${data.device_id}`,
        isActive: true,
        batteryLevel: data.battery_level || null,
      });
    } else {
      await dbService.devices.updateByDeviceId(data.device_id, {
        lastSeen: new Date(),
        batteryLevel: data.battery_level || device.batteryLevel,
      });
    }

    // Hardware sends confidence_level as a string (e.g. "HIGH", "CONFIRMED")
    const VALID_CONFIDENCE_LEVELS = new Set([
      "NO_FALL",
      "SUSPICIOUS",
      "POTENTIAL",
      "HIGH",
      "CONFIRMED",
    ]);
    const confidenceLevel =
      typeof data.confidence_level === "string" &&
      VALID_CONFIDENCE_LEVELS.has(data.confidence_level)
        ? data.confidence_level
        : null;

    if (!confidenceLevel) {
      return NextResponse.json(
        { error: "Invalid confidence_level" },
        { status: 400 },
      );
    }

    // Create fall record
    const fall = await dbService.falls.create({
      deviceId: device.id,
      fallDatetime: new Date(),
      confidenceScore: data.confidence_score || null,
      confidenceLevel: confidenceLevel,
      sosTriggered: data.sos_triggered || false,
      batteryLevel: data.battery_level || null,
      severity:
        confidenceLevel === "HIGH" || confidenceLevel === "CONFIRMED"
          ? "high"
          : "medium",
    });

    // Store sensor snapshot if provided
    if (data.sensor_data) {
      await dbService.sensorData.create({
        deviceId: device.id,
        timestamp: new Date(),
        accelX: data.sensor_data.accel_x || 0,
        accelY: data.sensor_data.accel_y || 0,
        accelZ: data.sensor_data.accel_z || 0,
        gyroX: data.sensor_data.gyro_x || 0,
        gyroY: data.sensor_data.gyro_y || 0,
        gyroZ: data.sensor_data.gyro_z || 0,
        pressure: data.sensor_data.pressure || null,
      });
    }

    console.log(`[API] Fall recorded: ID ${fall.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Fall alert received",
        fall_id: fall.id,
        device_id: device.id,
        patient_id: device.patientId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API] Error processing fall alert:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    const dbService = await getDbServiceAsync();

    let falls;
    if (patientId) {
      falls = await dbService.falls.findByPatientId(patientId);
    } else {
      falls = await dbService.falls.findRecent(limit * 2);
    }

    falls = falls
      .sort(
        (a, b) =>
          (b.fallDatetime?.getTime() || 0) - (a.fallDatetime?.getTime() || 0),
      )
      .slice(0, limit);

    return NextResponse.json({ falls }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching falls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
