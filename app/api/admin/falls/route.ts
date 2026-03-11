import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.accountType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");
    const resolved = searchParams.get("resolved"); // "true", "false", or null for all

    const dbService = await getDbServiceAsync();

    let falls;
    if (resolved === "false") {
      falls = await dbService.falls.findUnresolved();
    } else {
      const where: Record<string, unknown> = {};
      if (resolved === "true") where.resolved = true;
      falls = await dbService.falls.findMany({ where, skip, take });
    }

    const totalFalls = await dbService.falls.count();

    return NextResponse.json({ falls, total: totalFalls });
  } catch (error: unknown) {
    console.error("Admin falls list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
