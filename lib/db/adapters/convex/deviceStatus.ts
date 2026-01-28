/**
 * Convex DeviceStatus Repository Implementation
 */

import { IDeviceStatusRepository } from '../base';
import { DeviceStatus } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexDeviceStatusRepository implements IDeviceStatusRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<DeviceStatus | null> {
    try {
      const status = await this.client.query(api.deviceStatus.getById, { id: id as any });
      return status ? this.mapToDeviceStatus(status) : null;
    } catch (error) {
      console.error('Error finding device status by id:', error);
      return null;
    }
  }

  async findByDeviceId(deviceId: string, options?: any): Promise<DeviceStatus[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const statuses = await this.client.query(api.deviceStatus.getByDeviceId, {
        deviceId: deviceId as any,
        skip,
        take,
      });
      return statuses.map((s: any) => this.mapToDeviceStatus(s));
    } catch (error) {
      console.error('Error finding device status by device id:', error);
      return [];
    }
  }

  async findRecent(deviceId: string, limit: number): Promise<DeviceStatus[]> {
    try {
      const statuses = await this.client.query(api.deviceStatus.getRecent, {
        deviceId: deviceId as any,
        limit,
      });
      return statuses.map((s: any) => this.mapToDeviceStatus(s));
    } catch (error) {
      console.error('Error finding recent device status:', error);
      return [];
    }
  }

  async findLatest(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const status = await this.client.query(api.deviceStatus.getLatest, {
        deviceId: deviceId as any,
      });
      return status ? this.mapToDeviceStatus(status) : null;
    } catch (error) {
      console.error('Error finding latest device status:', error);
      return null;
    }
  }

  async create(data: {
    deviceId: string;
    timestamp: Date;
    batteryPercentage: number;
    wifiConnected: boolean;
    bluetoothConnected: boolean;
    sensorsInitialized: boolean;
    uptimeMs: bigint;
    currentStatus?: string;
  }): Promise<DeviceStatus> {
    try {
      const statusId = await this.client.mutation(api.deviceStatus.create, {
        deviceId: data.deviceId as any,
        timestamp: data.timestamp.getTime(),
        batteryPercentage: data.batteryPercentage,
        wifiConnected: data.wifiConnected,
        bluetoothConnected: data.bluetoothConnected,
        sensorsInitialized: data.sensorsInitialized,
        uptimeMs: Number(data.uptimeMs),
        currentStatus: data.currentStatus,
      });

      const status = await this.client.query(api.deviceStatus.getById, { id: statusId as any });
      if (!status) throw new Error('Failed to create device status');
      return this.mapToDeviceStatus(status);
    } catch (error) {
      console.error('Error creating device status:', error);
      throw error;
    }
  }

  private mapToDeviceStatus(status: any): DeviceStatus {
    return {
      id: status._id,
      deviceId: status.deviceId,
      timestamp: new Date(status.timestamp),
      batteryPercentage: status.batteryPercentage,
      wifiConnected: status.wifiConnected,
      bluetoothConnected: status.bluetoothConnected,
      sensorsInitialized: status.sensorsInitialized,
      uptimeMs: BigInt(status.uptimeMs),
      currentStatus: status.currentStatus,
      device: status.device,
    };
  }
}
