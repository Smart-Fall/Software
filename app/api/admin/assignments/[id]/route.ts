import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    void id;
    const body = await request.json();
    const { isActive, caregiverId, patientId } = body;

    if (!caregiverId || !patientId) {
      return NextResponse.json(
        { error: "caregiverId and patientId are required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await dbService.caregiverPatients.update(
      caregiverId,
      patientId,
      updateData,
    );

    return NextResponse.json({ assignment: updated });
  } catch (error: unknown) {
    console.error("Admin update assignment error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    void id;

    // The id contains caregiverId and patientId separated by underscore
    const { searchParams } = new URL(request.url);
    const caregiverId = searchParams.get("caregiverId");
    const patientId = searchParams.get("patientId");

    if (!caregiverId || !patientId) {
      return NextResponse.json(
        { error: "caregiverId and patientId query params are required" },
        { status: 400 },
      );
    }

    const dbService = await getDbServiceAsync();
    await dbService.caregiverPatients.delete(caregiverId, patientId);

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error: unknown) {
    console.error("Admin delete assignment error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
