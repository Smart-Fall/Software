import { NextResponse } from "next/server";
import { getDbServiceAsync } from "@/lib/db/service";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const dbService = await getDbServiceAsync();
    const caregiver = await dbService.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const access = await dbService.caregiverPatients.findByIds(caregiver.id, params.id);
    if (!access || !access.isActive) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const messages = await dbService.messages.findByCaregiverAndPatient(
      caregiver.id,
      params.id,
    );

    // Map to the snake_case shape the dialog expects
    const result = messages.map((m) => ({
      id: m.id,
      subject: m.subject || null,
      message_text: m.messageText,
      is_read: m.isRead,
      is_urgent: m.isUrgent,
      sent_at: m.sentAt.toISOString(),
      read_at: m.readAt ? m.readAt.toISOString() : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error fetching patient messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
