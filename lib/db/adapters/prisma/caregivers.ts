/**
 * Prisma Caregiver Repository Implementation
 */

import { ICaregiverRepository } from "../base";
import { Caregiver, FindOptions, User } from "../../types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaCaregiverWithUser = Prisma.CaregiverGetPayload<{
  include: { user: true };
}>;

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

  async findMany(options?: FindOptions<Caregiver>): Promise<Caregiver[]> {
    const caregivers = await prisma.caregiver.findMany({
      where: options?.where,
      include: { user: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy as Prisma.CaregiverOrderByWithRelationInput | undefined,
    });
    return caregivers.map((c) => this.mapToCaregiver(c));
  }

  async count(): Promise<number> {
    return await prisma.caregiver.count();
  }

  private mapToCaregiver(caregiver: PrismaCaregiverWithUser): Caregiver {
    return {
      id: caregiver.id,
      userId: caregiver.userId,
      facilityName: caregiver.facilityName ?? undefined,
      specialization: caregiver.specialization ?? undefined,
      yearsOfExperience: caregiver.yearsOfExperience ?? undefined,
      createdAt: caregiver.createdAt,
      user: caregiver.user as unknown as User,
    };
  }
}
