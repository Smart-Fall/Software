import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        specialization: true,
        yearsOfExperience: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      caregiverId: caregiver.id,
      firstName: caregiver.user.firstName,
      lastName: caregiver.user.lastName,
      specialization: caregiver.specialization,
      yearsOfExperience: caregiver.yearsOfExperience,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}