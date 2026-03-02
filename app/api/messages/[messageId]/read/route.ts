import { NextResponse } from 'next/server';
import { getDbServiceAsync } from '@/lib/db/service';
import { getSession } from '@/lib/auth';

export async function PUT(
  _req: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDbServiceAsync();

    const patient = await db.patients.findByUserId(session.userId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const params = await context.params;
    const { messageId } = params;

    const message = await db.messages.markAsRead(messageId, patient.id);

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
