import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.accountType !== "caregiver") {
      return NextResponse.json(
        { error: "Only caregivers can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { facilityName, specialization, yearsOfExperience } = body;

    // Validation
    if (facilityName !== undefined) {
      if (typeof facilityName !== "string") {
        return NextResponse.json(
          { error: "facilityName must be a string" },
          { status: 400 }
        );
      }
      if (facilityName.length > 200) {
        return NextResponse.json(
          { error: "facilityName cannot exceed 200 characters" },
          { status: 400 }
        );
      }
    }

    if (specialization !== undefined) {
      if (typeof specialization !== "string") {
        return NextResponse.json(
          { error: "specialization must be a string" },
          { status: 400 }
        );
      }
      if (specialization.length > 100) {
        return NextResponse.json(
          { error: "specialization cannot exceed 100 characters" },
          { status: 400 }
        );
      }
    }

    if (yearsOfExperience !== undefined) {
      const years = Number(yearsOfExperience);
      if (isNaN(years) || years < 0 || years > 70) {
        return NextResponse.json(
          { error: "yearsOfExperience must be a number between 0 and 70" },
          { status: 400 }
        );
      }
    }

    const dbService = await getDbServiceAsync();

    // Find caregiver
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json(
        { error: "Caregiver record not found" },
        { status: 404 }
      );
    }

    // Update caregiver
    const updateData: any = {};
    if (facilityName !== undefined) {
      updateData.facilityName = facilityName.trim();
    }
    if (specialization !== undefined) {
      updateData.specialization = specialization.trim();
    }
    if (yearsOfExperience !== undefined) {
      updateData.yearsOfExperience = Number(yearsOfExperience);
    }

    const updatedCaregiver = await dbService.caregivers.update(
      caregiver.id,
      updateData
    );

    return NextResponse.json({
      caregiver: {
        id: updatedCaregiver.id,
        facilityName: updatedCaregiver.facilityName,
        specialization: updatedCaregiver.specialization,
        yearsOfExperience: updatedCaregiver.yearsOfExperience,
      },
    });
  } catch (error) {
    console.error("[API] Error updating caregiver profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
