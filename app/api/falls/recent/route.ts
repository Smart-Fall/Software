import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const caregiverId = searchParams.get("caregiver_id");

    const dbService = await getDbServiceAsync();

    // Get all unresolved falls
    let falls = await dbService.falls.findUnresolved();

    // Filter by since if provided
    if (since) {
      const sinceDate = new Date(since);
      falls = falls.filter((f) => f.createdAt >= sinceDate);
    }

    // Filter by caregiver if provided
    if (caregiverId) {
      falls = falls.filter((f) => {
        // Check if fall's patient is assigned to this caregiver
        return f.patient?.caregiverPatients?.some(
          (cp) => cp.caregiverId === caregiverId && cp.isActive,
        );
      });
    }

    // Sort and limit
    falls = falls
      .sort(
        (a, b) =>
          (b.fallDatetime?.getTime() || 0) - (a.fallDatetime?.getTime() || 0),
      )
      .slice(0, 20);

    return NextResponse.json(
      {
        falls,
        count: falls.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API] Error fetching recent falls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
