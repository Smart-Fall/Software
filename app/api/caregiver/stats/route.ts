import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();

    // Get caregiver_id from logged-in user
    const caregiver = await dbService.caregivers.findByUserId(session.userId);

    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver not found" },
        { status: 404 },
      );
    }

    const caregiverId = caregiver.id;

    // Get all assignments for this caregiver
    const assignments =
      await dbService.caregiverPatients.findByCaregiverId(caregiverId);
    const totalPatients = assignments.filter((a) => a.isActive).length;

    // Get patients to calculate risk scores
    const patients = await dbService.patients.findByCaregiverId(caregiverId);

    // Calculate high risk count
    const highRisk = patients.filter((p) => p.riskScore >= 75).length;

    // Calculate average health score
    const avgRiskScore =
      patients.length > 0
        ? patients.reduce((sum, p) => sum + p.riskScore, 0) / patients.length
        : 0;
    const avgHealthScore = Math.round(100 - avgRiskScore);

    // Recent falls (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allFalls = await Promise.all(
      patients.map((p) => dbService.falls.findByPatientId(p.id)),
    );
    const recentFalls = allFalls
      .flat()
      .filter((f) => f.fallDatetime >= sevenDaysAgo).length;

    return NextResponse.json({
      totalPatients,
      recentFalls,
      avgHealthScore,
      highRiskPatients: highRisk,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
