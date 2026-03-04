/**
 * Prisma Fall Repository Implementation
 */

import { IFallRepository } from '../base';
import { Device, FindOptions, Fall, Patient } from '../../types';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type PrismaFallWithRelations = Prisma.FallGetPayload<{
  include: { patient: true; device: true };
}>;

export class PrismaFallRepository implements IFallRepository {
  async create(data: {
    patientId?: string;
    deviceId?: string;
    fallDatetime: Date;
    confidenceScore?: number;
    confidenceLevel?: string;
    sosTriggered?: boolean;
    severity?: string;
    location?: string;
    wasInjured?: boolean;
    notes?: string;
    batteryLevel?: number;
  }): Promise<Fall> {
    const fall = await prisma.fall.create({
      data: {
        patientId: data.patientId,
        deviceId: data.deviceId,
        fallDatetime: data.fallDatetime,
        confidenceScore: data.confidenceScore,
        confidenceLevel: data.confidenceLevel,
        sosTriggered: data.sosTriggered ?? false,
        severity: data.severity,
        location: data.location,
        wasInjured: data.wasInjured,
        notes: data.notes,
        batteryLevel: data.batteryLevel,
      },
      include: { patient: true, device: true },
    });
    return this.mapToFall(fall);
  }

  async findById(id: string): Promise<Fall | null> {
    const fall = await prisma.fall.findUnique({
      where: { id },
      include: { patient: true, device: true },
    });
    return fall ? this.mapToFall(fall) : null;
  }

  async findMany(options?: FindOptions<Fall>): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: options?.where as Prisma.FallWhereInput | undefined,
      include: { patient: true, device: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy as Prisma.FallOrderByWithRelationInput | undefined,
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findByPatientId(patientId: string): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { patientId },
      include: { patient: true, device: true },
      orderBy: { fallDatetime: 'desc' },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findByDeviceId(deviceId: string): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { deviceId },
      include: { patient: true, device: true },
      orderBy: { fallDatetime: 'desc' },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findRecent(limit: number): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      orderBy: { fallDatetime: 'desc' },
      take: limit,
      include: { patient: true, device: true },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findUnresolved(): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { resolved: false },
      orderBy: { fallDatetime: 'desc' },
      include: { patient: true, device: true },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async update(id: string, data: Partial<Fall>): Promise<Fall> {
    const fall = await prisma.fall.update({
      where: { id },
      data: {
        severity: data.severity,
        location: data.location,
        wasInjured: data.wasInjured,
        notes: data.notes,
        resolved: data.resolved,
        resolvedAt: data.resolvedAt,
      },
      include: { patient: true, device: true },
    });
    return this.mapToFall(fall);
  }

  async count(): Promise<number> {
    return await prisma.fall.count();
  }

  private mapToFall(fall: PrismaFallWithRelations): Fall {
    return {
      id: fall.id,
      patientId: fall.patientId ?? undefined,
      deviceId: fall.deviceId ?? undefined,
      fallDatetime: fall.fallDatetime,
      confidenceScore: fall.confidenceScore ?? undefined,
      confidenceLevel: fall.confidenceLevel ?? undefined,
      sosTriggered: fall.sosTriggered,
      severity: fall.severity ?? undefined,
      location: fall.location ?? undefined,
      wasInjured: fall.wasInjured ?? undefined,
      notes: fall.notes ?? undefined,
      batteryLevel: fall.batteryLevel ?? undefined,
      resolved: fall.resolved,
      resolvedAt: fall.resolvedAt ?? undefined,
      createdAt: fall.createdAt,
      patient: (fall.patient ?? undefined) as unknown as Patient | undefined,
      device: (fall.device ?? undefined) as unknown as Device | undefined,
    };
  }
}
