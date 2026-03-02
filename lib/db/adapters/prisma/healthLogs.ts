/**
 * Prisma HealthLog Repository Implementation
 */

import { IHealthLogRepository } from '../base';
import { FindOptions, HealthLog } from '../../types';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type PrismaHealthLogWithPatient = Prisma.HealthLogGetPayload<{
  include: { patient: true };
}>;

export class PrismaHealthLogRepository implements IHealthLogRepository {
  async create(data: {
    patientId: string;
    healthScore: number;
    recordedAt?: Date;
  }): Promise<HealthLog> {
    const healthLog = await prisma.healthLog.create({
      data: {
        patientId: data.patientId,
        healthScore: data.healthScore,
        recordedAt: data.recordedAt,
      },
      include: { patient: true },
    });
    return this.mapToHealthLog(healthLog);
  }

  async findById(id: string): Promise<HealthLog | null> {
    const healthLog = await prisma.healthLog.findUnique({
      where: { id },
      include: { patient: true },
    });
    return healthLog ? this.mapToHealthLog(healthLog) : null;
  }

  async findByPatientId(
    patientId: string,
    options?: FindOptions<HealthLog>,
  ): Promise<HealthLog[]> {
    const healthLogs = await prisma.healthLog.findMany({
      where: { patientId, ...options?.where },
      include: { patient: true },
      orderBy: { recordedAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
    return healthLogs.map((h) => this.mapToHealthLog(h));
  }

  async findRecent(patientId: string, limit: number): Promise<HealthLog[]> {
    const healthLogs = await prisma.healthLog.findMany({
      where: { patientId },
      include: { patient: true },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return healthLogs.map((h) => this.mapToHealthLog(h));
  }

  async findBetween(patientId: string, startDate: Date, endDate: Date): Promise<HealthLog[]> {
    const healthLogs = await prisma.healthLog.findMany({
      where: {
        patientId,
        recordedAt: { gte: startDate, lte: endDate },
      },
      include: { patient: true },
      orderBy: { recordedAt: 'asc' },
    });
    return healthLogs.map((h) => this.mapToHealthLog(h));
  }

  async update(id: string, data: Partial<HealthLog>): Promise<HealthLog> {
    const healthLog = await prisma.healthLog.update({
      where: { id },
      data: {
        healthScore: data.healthScore,
        recordedAt: data.recordedAt,
      },
      include: { patient: true },
    });
    return this.mapToHealthLog(healthLog);
  }

  private mapToHealthLog(data: PrismaHealthLogWithPatient): HealthLog {
    return {
      id: data.id,
      patientId: data.patientId,
      healthScore: data.healthScore,
      recordedAt: data.recordedAt,
      patient: data.patient,
    };
  }
}
