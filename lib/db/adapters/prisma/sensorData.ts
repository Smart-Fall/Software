/**
 * Prisma SensorData Repository Implementation
 */

import { ISensorDataRepository } from '../base';
import { Device, FindOptions, SensorData } from '../../types';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type PrismaSensorDataWithDevice = Prisma.SensorDataGetPayload<{
  include: { device: true };
}>;

export class PrismaSensorDataRepository implements ISensorDataRepository {
  async findById(id: string): Promise<SensorData | null> {
    const data = await prisma.sensorData.findUnique({
      where: { id },
      include: { device: true },
    });
    return data ? this.mapToSensorData(data) : null;
  }

  async findByDeviceId(
    deviceId: string,
    options?: FindOptions<SensorData>,
  ): Promise<SensorData[]> {
    const data = await prisma.sensorData.findMany({
      where: { deviceId },
      include: { device: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: (options?.orderBy || { timestamp: 'desc' }) as Prisma.SensorDataOrderByWithRelationInput,
    });
    return data.map((d) => this.mapToSensorData(d));
  }

  async findRecent(deviceId: string, limit: number): Promise<SensorData[]> {
    const data = await prisma.sensorData.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { device: true },
    });
    return data.map((d) => this.mapToSensorData(d));
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
    heartRate?: number;
    spo2?: number;
  }): Promise<SensorData> {
    const createData: Prisma.SensorDataCreateInput = {
      device: { connect: { id: data.deviceId } },
      timestamp: data.timestamp,
      accelX: data.accelX,
      accelY: data.accelY,
      accelZ: data.accelZ,
      gyroX: data.gyroX,
      gyroY: data.gyroY,
      gyroZ: data.gyroZ,
      pressure: data.pressure,
      fsr: data.fsr,
      heartRate: data.heartRate,
      spo2: data.spo2,
    };

    const sensorData = await prisma.sensorData.create({
      data: createData,
      include: { device: true },
    });
    return this.mapToSensorData(sensorData);
  }

  async findBetween(deviceId: string, startTime: Date, endTime: Date): Promise<SensorData[]> {
    const data = await prisma.sensorData.findMany({
      where: {
        deviceId,
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: { device: true },
      orderBy: { timestamp: 'asc' },
    });
    return data.map((d) => this.mapToSensorData(d));
  }

  private mapToSensorData(data: PrismaSensorDataWithDevice): SensorData {
    // Cast to access heartRate/spo2 which are in the schema but require `prisma generate` to appear in the generated types
    const d = data as typeof data & { heartRate?: number | null; spo2?: number | null };
    return {
      id: data.id,
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      accelX: data.accelX,
      accelY: data.accelY,
      accelZ: data.accelZ,
      gyroX: data.gyroX,
      gyroY: data.gyroY,
      gyroZ: data.gyroZ,
      pressure: data.pressure ?? undefined,
      fsr: data.fsr ?? undefined,
      heartRate: d.heartRate ?? undefined,
      spo2: d.spo2 ?? undefined,
      device: data.device as unknown as Device | undefined,
    };
  }
}
