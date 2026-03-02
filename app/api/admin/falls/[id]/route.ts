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
    const body = await request.json();
    const { resolved, notes, severity } = body;

    const dbService = await getDbServiceAsync();

    const fall = await dbService.falls.findById(id);
    if (!fall) {
      return NextResponse.json({ error: "Fall not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (resolved !== undefined) {
      updateData.resolved = resolved;
      updateData.resolvedAt = resolved ? new Date() : null;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (severity !== undefined) updateData.severity = severity;

    const updatedFall = await dbService.falls.update(id, updateData);

    return NextResponse.json({ fall: updatedFall });
  } catch (error: unknown) {
    console.error("Admin update fall error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
