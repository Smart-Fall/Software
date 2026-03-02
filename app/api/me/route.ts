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
    const user = await dbService.users.findById(session.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact an administrator.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      accountType: user.accountType,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
