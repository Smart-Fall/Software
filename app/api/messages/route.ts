import { NextResponse } from 'next/server';
import { getDbServiceAsync } from '@/lib/db/service';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await getDbServiceAsync();

    const caregiver = await db.caregivers.findByUserId(session.userId);
    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    const { patientId, subject, messageText, isUrgent } = await req.json();

    if (!patientId || !messageText) {
      return NextResponse.json(
        { error: 'patientId and messageText are required' },
        { status: 400 }
      );
    }

    // Verify active caregiver-patient relationship
    const access = await db.caregiverPatients.findByIds(caregiver.id, patientId);
    if (!access || !access.isActive) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const message = await db.messages.create({
      caregiverId: caregiver.id,
      patientId,
      subject,
      messageText,
      isUrgent,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
