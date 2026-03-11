/**
 * Convex DeviceLog Repository Implementation
 */

import { IDeviceLogRepository } from '../base';
import { DeviceLog } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type ConvexDeviceLog = {
  _id: Id<'deviceLogs'>;
  deviceId: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
};

export class ConvexDeviceLogRepository implements IDeviceLogRepository {
  private client = getConvexClient();

  async create(data: {
    deviceId: string;
    level: string;
    category: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<DeviceLog> {
    const id = await this.client.mutation(api.deviceLogs.create, {
      deviceId: data.deviceId as unknown as Id<'devices'>,
      level: data.level,
      category: data.category,
      message: data.message,
      metadata: data.metadata,
    });

    // Fetch the created row to return canonical shape
    const rows = await this.client.query(api.deviceLogs.getByDeviceId, {
      deviceId: data.deviceId as unknown as Id<'devices'>,
      take: 1,
    });
    const row = (rows as ConvexDeviceLog[]).find((r) => r._id === id);
    if (!row) throw new Error('Failed to create device log');
    return this.map(row);
  }

  async findByDeviceId(
    deviceId: string,
    options?: { take?: number; skip?: number },
  ): Promise<DeviceLog[]> {
    try {
      const rows = await this.client.query(api.deviceLogs.getByDeviceId, {
        deviceId: deviceId as unknown as Id<'devices'>,
        skip: options?.skip ?? 0,
        take: options?.take ?? 50,
      });
      return (rows as ConvexDeviceLog[]).map((r) => this.map(r));
    } catch (error) {
      console.error('Error finding device logs by deviceId:', error);
      return [];
    }
  }

  async findAll(options?: {
    take?: number;
    skip?: number;
    deviceId?: string;
    level?: string;
    category?: string;
  }): Promise<{ logs: DeviceLog[]; total: number }> {
    try {
      const result = await this.client.query(api.deviceLogs.getAll, {
        skip: options?.skip ?? 0,
        take: options?.take ?? 100,
        deviceId: options?.deviceId,
        level: options?.level,
        category: options?.category,
      });
      const { logs, total } = result as { logs: ConvexDeviceLog[]; total: number };
      return { logs: logs.map((r) => this.map(r)), total };
    } catch (error) {
      console.error('Error fetching all device logs:', error);
      return { logs: [], total: 0 };
    }
  }

  async countByDeviceId(deviceId: string): Promise<number> {
    try {
      return await this.client.query(api.deviceLogs.countByDeviceId, {
        deviceId: deviceId as unknown as Id<'devices'>,
      });
    } catch (error) {
      console.error('Error counting device logs:', error);
      return 0;
    }
  }

  private map(row: ConvexDeviceLog): DeviceLog {
    return {
      id:        row._id,
      deviceId:  row.deviceId,
      level:     row.level,
      category:  row.category,
      message:   row.message,
      metadata:  row.metadata ?? null,
      createdAt: new Date(row.createdAt),
    };
  }
}
