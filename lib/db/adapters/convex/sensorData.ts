/**
 * Convex SensorData Repository Implementation
 */

import { ISensorDataRepository } from '../base';
import { SensorData } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexSensorDataRepository implements ISensorDataRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<SensorData | null> {
    try {
      const data = await this.client.query(api.sensorData.getById, { id: id as any });
      return data ? this.mapToSensorData(data) : null;
    } catch (error) {
      console.error('Error finding sensor data by id:', error);
      return null;
    }
  }

  async findByDeviceId(deviceId: string, options?: any): Promise<SensorData[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const data = await this.client.query(api.sensorData.getByDeviceId, {
        deviceId: deviceId as any,
        skip,
        take,
      });
      return data.map((d: any) => this.mapToSensorData(d));
    } catch (error) {
      console.error('Error finding sensor data by device id:', error);
      return [];
    }
  }

  async findRecent(deviceId: string, limit: number): Promise<SensorData[]> {
    try {
      const data = await this.client.query(api.sensorData.getRecent, {
        deviceId: deviceId as any,
        limit,
      });
      return data.map((d: any) => this.mapToSensorData(d));
    } catch (error) {
      console.error('Error finding recent sensor data:', error);
      return [];
    }
  }

  async create(data: {
    deviceId: string;
    timestamp: Date;
    accelX: number;
    accelY: number;
    accelZ: number;
    gyroX: number;
    gyroY: number;
    gyroZ: number;
    pressure?: number;
    fsr?: number;
  }): Promise<SensorData> {
    try {
      const mutationData: any = {
        deviceId: data.deviceId as any,
        timestamp: data.timestamp.getTime(),
        accelX: data.accelX,
        accelY: data.accelY,
        accelZ: data.accelZ,
        gyroX: data.gyroX,
        gyroY: data.gyroY,
        gyroZ: data.gyroZ,
        pressure: data.pressure,
      };

      // Note: FSR support requires Convex backend mutation updates
      if (data.fsr !== undefined) {
        mutationData.fsr = data.fsr;
      }

      const sensorDataId = await this.client.mutation(api.sensorData.create, mutationData);

      const sensorData = await this.client.query(api.sensorData.getById, {
        id: sensorDataId as any,
      });
      if (!sensorData) throw new Error('Failed to create sensor data');
      return this.mapToSensorData(sensorData);
    } catch (error) {
      console.error('Error creating sensor data:', error);
      throw error;
    }
  }

  async findBetween(deviceId: string, startTime: Date, endTime: Date): Promise<SensorData[]> {
    try {
      const data = await this.client.query(api.sensorData.getBetween, {
        deviceId: deviceId as any,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
      });
      return data.map((d: any) => this.mapToSensorData(d));
    } catch (error) {
      console.error('Error finding sensor data between times:', error);
      return [];
    }
  }

  private mapToSensorData(data: any): SensorData {
    return {
      id: data._id,
      deviceId: data.deviceId,
      timestamp: new Date(data.timestamp),
      accelX: data.accelX,
      accelY: data.accelY,
      accelZ: data.accelZ,
      gyroX: data.gyroX,
      gyroY: data.gyroY,
      gyroZ: data.gyroZ,
      pressure: data.pressure,
      fsr: data.fsr,
      device: data.device,
    };
  }
}
