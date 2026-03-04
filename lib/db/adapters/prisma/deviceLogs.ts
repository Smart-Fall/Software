/**
 * Prisma DeviceLog Repository Implementation
 */

import { IDeviceLogRepository } from '../base';
import { DeviceLog, Device } from '../../types';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class PrismaDeviceLogRepository implements IDeviceLogRepository {
  async create(data: {
    deviceId: string;
    level: string;
    category: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<DeviceLog> {
    const row = await prisma.deviceLog.create({
      data: {
        deviceId: data.deviceId,
        level: data.level,
        category: data.category,
        message: data.message,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      include: { device: true },
    });
    return this.map(row as unknown as RawDeviceLog);
  }

  async findByDeviceId(
    deviceId: string,
    options?: { take?: number; skip?: number },
  ): Promise<DeviceLog[]> {
    const rows = await prisma.deviceLog.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take: options?.take,
      skip: options?.skip,
      include: { device: true },
    });
    return (rows as unknown as RawDeviceLog[]).map((r) => this.map(r));
  }

  async findAll(options?: {
    take?: number;
    skip?: number;
    deviceId?: string;
    level?: string;
    category?: string;
  }): Promise<{ logs: DeviceLog[]; total: number }> {
    const where: Prisma.DeviceLogWhereInput = {};
    if (options?.deviceId) where.deviceId = options.deviceId;
    if (options?.level)    where.level    = options.level;
    if (options?.category) where.category = options.category;

    const [rows, total] = await Promise.all([
      prisma.deviceLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.take ?? 100,
        skip: options?.skip ?? 0,
        include: { device: true },
      }),
      prisma.deviceLog.count({ where }),
    ]);

    return { logs: (rows as unknown as RawDeviceLog[]).map((r) => this.map(r)), total };
  }

  async countByDeviceId(deviceId: string): Promise<number> {
    return prisma.deviceLog.count({ where: { deviceId } });
  }

  private map(row: RawDeviceLog): DeviceLog {
    return {
      id:        row.id,
      deviceId:  row.deviceId,
      level:     row.level,
      category:  row.category,
      message:   row.message,
      metadata:  row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
      device:    row.device as Device | undefined,
    };
  }
}

// Internal shape returned by Prisma queries with device included
type RawDeviceLog = {
  id: string;
  deviceId: string;
  level: string;
  category: string;
  message: string;
  metadata: unknown;
  createdAt: Date;
  device?: unknown;
};
