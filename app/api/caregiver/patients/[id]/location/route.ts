import { NextResponse } from "next/server";

// No GPS/location data is stored in the schema.
// Return 404 so the dialog gracefully shows "Location Not Available".
export async function GET() {
  return NextResponse.json({ error: "Location data not available" }, { status: 404 });
}
