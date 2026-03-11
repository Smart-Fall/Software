import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDbServiceAsync } from "@/lib/db/service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skip     = parseInt(searchParams.get("skip")  || "0",   10);
    const take     = Math.min(parseInt(searchParams.get("take") || "100", 10), 200);
    const deviceId = searchParams.get("device_id") || undefined;
    const level    = searchParams.get("level")     || undefined;
    const category = searchParams.get("category")  || undefined;

    const dbService = await getDbServiceAsync();
    const { logs, total } = await dbService.deviceLogs.findAll({
      skip,
      take,
      deviceId,
      level,
      category,
    });

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("[API] Error fetching admin logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
