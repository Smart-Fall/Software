import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
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
    const dbService = await getDbServiceAsync();
    const user = await dbService.users.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;

    // Fetch associated patient or caregiver data
    let patient = null;
    let caregiver = null;

    if (user.accountType === "user") {
      patient = await dbService.patients.findByUserId(user.id);
    } else if (user.accountType === "caregiver") {
      caregiver = await dbService.caregivers.findByUserId(user.id);
    }

    return NextResponse.json({ user: safeUser, patient, caregiver });
  } catch (error: unknown) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

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
    const { firstName, lastName, email, isActive, dob } = body;

    const dbService = await getDbServiceAsync();

    const existingUser = await dbService.users.findById(id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;

    const updatedUser = await dbService.users.update(id, updateData);
    const { passwordHash: _passwordHash, ...safeUser } = updatedUser;
    void _passwordHash;

    return NextResponse.json({ user: safeUser });
  } catch (error: unknown) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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
    const dbService = await getDbServiceAsync();

    const user = await dbService.users.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (user.id === session.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    await dbService.users.delete(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
