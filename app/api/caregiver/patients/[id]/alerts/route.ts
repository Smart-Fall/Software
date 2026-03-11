import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const access = await dbService.caregiverPatients.findByIds(caregiver.id, id);
    if (!access || !access.isActive) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const falls = await dbService.falls.findByPatientId(id);

    const alerts = falls.map((fall) => ({
      id: fall.id,
      type: fall.sosTriggered ? "SOS Fall Alert" : "Fall Detected",
      severity: fall.severity || "medium",
      timestamp: fall.fallDatetime.toISOString(),
      details: [
        fall.confidenceLevel ? `Confidence: ${fall.confidenceLevel}` : null,
        fall.confidenceScore != null ? `Score: ${fall.confidenceScore}/100` : null,
        fall.resolved ? "Resolved" : "Unresolved",
      ]
        .filter(Boolean)
        .join(" · "),
    }));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("[API] Error fetching patient alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
