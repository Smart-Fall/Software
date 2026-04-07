/**
 * Prisma Fall Repository Implementation
 */

import { IFallRepository } from "../base";
import { FindOptions, Fall } from "../../types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaFallWithRelations = Prisma.FallGetPayload<{
  include: { patient: { include: { user: true } }; device: true };
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
    let patientId = data.patientId;
    if (!patientId && data.deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: data.deviceId },
        select: { patientId: true },
      });
      patientId = device?.patientId ?? undefined;
    }

    const fall = await prisma.fall.create({
      data: {
        patientId,
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
      include: { patient: { include: { user: true } }, device: true },
    });
    return this.mapToFall(fall);
  }

  async findById(id: string): Promise<Fall | null> {
    const fall = await prisma.fall.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, device: true },
    });
    return fall ? this.mapToFall(fall) : null;
  }

  async findMany(options?: FindOptions<Fall>): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: options?.where as Prisma.FallWhereInput | undefined,
      include: { patient: { include: { user: true } }, device: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy as
        | Prisma.FallOrderByWithRelationInput
        | Prisma.FallOrderByWithRelationInput[]
        | undefined,
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findByPatientId(patientId: string): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { patientId },
      include: { patient: { include: { user: true } }, device: true },
      orderBy: { fallDatetime: "desc" },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findByDeviceId(deviceId: string): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { deviceId },
      include: { patient: { include: { user: true } }, device: true },
      orderBy: { fallDatetime: "desc" },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findRecent(limit: number): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      orderBy: { fallDatetime: "desc" },
      take: limit,
      include: { patient: { include: { user: true } }, device: true },
    });
    return falls.map((f) => this.mapToFall(f));
  }

  async findUnresolved(): Promise<Fall[]> {
    const falls = await prisma.fall.findMany({
      where: { resolved: false },
      orderBy: { fallDatetime: "desc" },
      include: { patient: { include: { user: true } }, device: true },
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
      include: { patient: { include: { user: true } }, device: true },
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
      patient: fall.patient
        ? {
            id: fall.patient.id,
            userId: fall.patient.userId,
            riskScore: fall.patient.riskScore,
            isHighRisk: fall.patient.isHighRisk,
            medicalConditions: fall.patient.medicalConditions ?? undefined,
            createdAt: fall.patient.createdAt,
            user: fall.patient.user
              ? {
                  id: fall.patient.user.id,
                  email: fall.patient.user.email,
                  passwordHash: fall.patient.user.passwordHash,
                  accountType: fall.patient.user.accountType as "user" | "caregiver" | "admin",
                  firstName: fall.patient.user.firstName ?? undefined,
                  lastName: fall.patient.user.lastName ?? undefined,
                  dob: fall.patient.user.dob ?? undefined,
                  isActive: fall.patient.user.isActive,
                  createdAt: fall.patient.user.createdAt,
                }
              : undefined,
          }
        : undefined,
      device: fall.device
        ? {
            id: fall.device.id,
            deviceId: fall.device.deviceId,
            patientId: fall.device.patientId ?? undefined,
            deviceName: fall.device.deviceName ?? undefined,
            isActive: fall.device.isActive,
            isMuted: fall.device.isMuted,
            lastSeen: fall.device.lastSeen ?? undefined,
            batteryLevel: fall.device.batteryLevel ?? undefined,
            firmwareVersion: fall.device.firmwareVersion ?? undefined,
            createdAt: fall.device.createdAt,
          }
        : undefined,
    };
  }
}
