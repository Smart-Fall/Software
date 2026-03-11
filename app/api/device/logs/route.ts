import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";

const VALID_LEVELS = new Set(["DEBUG", "INFO", "WARN", "ERROR"]);
const VALID_CATEGORIES = new Set([
  "SYSTEM",
  "FALL_DETECTION",
  "SENSOR",
  "WIFI",
  "EMERGENCY",
]);

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

    const logs: Array<{
      level?: string;
      category?: string;
      message?: string;
      value?: number;
      threshold?: number;
    }> = Array.isArray(data.logs) ? data.logs : [];

    if (logs.length === 0) {
      return NextResponse.json({ success: true, stored: 0 });
    }

    const dbService = await getDbServiceAsync();

    // Auto-register device if not known
    let device = await dbService.devices.findByDeviceId(deviceId);
    if (!device) {
      console.log(`[API] Auto-registering new device from log upload: ${deviceId}`);
      device = await dbService.devices.create({
        deviceId,
        deviceName: `SmartFall Device ${deviceId}`,
        isActive: true,
      });
    }

    // Update device lastSeen
    await dbService.devices.update(device.id, { lastSeen: new Date() });

    // Store each log entry
    let stored = 0;
    for (const entry of logs) {
      const level    = VALID_LEVELS.has(String(entry.level ?? "").toUpperCase())
        ? String(entry.level).toUpperCase()
        : "INFO";
      const category = VALID_CATEGORIES.has(String(entry.category ?? "").toUpperCase())
        ? String(entry.category).toUpperCase()
        : "SYSTEM";
      const message  = String(entry.message ?? "").slice(0, 500);

      const metadata: Record<string, unknown> | undefined =
        entry.value !== undefined || entry.threshold !== undefined
          ? { value: entry.value, threshold: entry.threshold }
          : undefined;

      await dbService.deviceLogs.create({
        deviceId: device.id,
        level,
        category,
        message,
        metadata,
      });
      stored++;
    }

    return NextResponse.json({ success: true, stored });
  } catch (error) {
    console.error("[API] Error storing device logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
