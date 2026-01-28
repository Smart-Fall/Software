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

    // Get patient record for the logged-in user
    const patient = await dbService.patients.findByUserId(session.userId);

    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 },
      );
    }

    // Get all falls for this patient
    const allFalls = await dbService.falls.findByPatientId(patient.id);

    // Count falls in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalFalls = allFalls.length;
    const recentFalls = allFalls.filter(
      (f) => f.fallDatetime >= thirtyDaysAgo,
    ).length;
    const unresolvedFalls = allFalls.filter((f) => !f.resolved).length;

    // Get device count
    const devices = await dbService.devices.findByPatientId(patient.id);
    const deviceCount = devices.filter((d) => d.isActive).length;

    return NextResponse.json({
      patient: {
        firstName: patient.user?.firstName,
        lastName: patient.user?.lastName,
        dob: patient.user?.dob,
        riskScore: patient.riskScore,
        isHighRisk: patient.isHighRisk,
        medicalConditions: patient.medicalConditions,
      },
      stats: {
        totalFalls,
        recentFalls,
        unresolvedFalls,
        deviceCount,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching patient stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
