/**
 * Prisma Caregiver Repository Implementation
 */

import { ICaregiverRepository } from '../base';
import { Caregiver } from '../../types';
import prisma from '@/lib/prisma';

export class PrismaCaregiverRepository implements ICaregiverRepository {
  async findById(id: string): Promise<Caregiver | null> {
    const caregiver = await prisma.caregiver.findUnique({
      where: { id },
      include: { user: true },
    });
    return caregiver ? this.mapToCaregiver(caregiver) : null;
  }

  async findByUserId(userId: string): Promise<Caregiver | null> {
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId },
      include: { user: true },
    });
    return caregiver ? this.mapToCaregiver(caregiver) : null;
  }

  async create(data: {
    userId: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  }): Promise<Caregiver> {
    const caregiver = await prisma.caregiver.create({
      data: {
        userId: data.userId,
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      },
      include: { user: true },
    });
    return this.mapToCaregiver(caregiver);
  }

  async update(id: string, data: Partial<Caregiver>): Promise<Caregiver> {
    const caregiver = await prisma.caregiver.update({
      where: { id },
      data: {
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      },
      include: { user: true },
    });
    return this.mapToCaregiver(caregiver);
  }

  private mapToCaregiver(caregiver: any): Caregiver {
    return {
      id: caregiver.id,
      userId: caregiver.userId,
      facilityName: caregiver.facilityName,
      specialization: caregiver.specialization,
      yearsOfExperience: caregiver.yearsOfExperience,
      createdAt: caregiver.createdAt,
      user: caregiver.user,
    };
  }
}
