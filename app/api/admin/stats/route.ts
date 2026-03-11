import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbService = await getDbServiceAsync();

    const [
      totalUsers,
      totalPatients,
      totalCaregivers,
      totalFalls,
      totalDevices,
      unresolvedFalls,
    ] = await Promise.all([
      dbService.users.count(),
      dbService.patients.count(),
      dbService.caregivers.count(),
      dbService.falls.count(),
      dbService.devices.count(),
      dbService.falls.findUnresolved(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPatients,
      totalCaregivers,
      totalFalls,
      totalDevices,
      unresolvedFalls: unresolvedFalls.length,
    });
  } catch (error: unknown) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
