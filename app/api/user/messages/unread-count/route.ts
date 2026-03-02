import { NextResponse } from 'next/server';
import { getDbServiceAsync } from '@/lib/db/service';
import { getSession } from '@/lib/auth';

export async function GET() {
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

    const unreadCount = await db.messages.getUnreadCount(patient.id);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
