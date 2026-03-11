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

    const messages = await db.messages.findByPatientId(patient.id);

    // Enrich messages with caregiver info
    const enriched = await Promise.all(
      messages.map(async (message) => {
        try {
          const caregiver = await db.caregivers.findById(message.caregiverId);
          const caregiverUser = caregiver ? await db.users.findById(caregiver.userId) : null;
          return {
            ...message,
            sentAt: message.sentAt.toISOString(),
            readAt: message.readAt?.toISOString(),
            caregiverFirstName: caregiverUser?.firstName ?? '',
            caregiverLastName: caregiverUser?.lastName ?? '',
          };
        } catch {
          return {
            ...message,
            sentAt: message.sentAt.toISOString(),
            readAt: message.readAt?.toISOString(),
            caregiverFirstName: '',
            caregiverLastName: '',
          };
        }
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
