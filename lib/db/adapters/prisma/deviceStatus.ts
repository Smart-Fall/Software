/**
 * Prisma DeviceStatus Repository Implementation
 */

import { IDeviceStatusRepository } from "../base";
import { DeviceStatus, FindOptions } from "../../types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaDeviceStatusWithDevice = Prisma.DeviceStatusGetPayload<{
  include: { device: true };
}>;

export class PrismaDeviceStatusRepository implements IDeviceStatusRepository {
  async findById(id: string): Promise<DeviceStatus | null> {
    const status = await prisma.deviceStatus.findUnique({
      where: { id },
      include: { device: true },
    });
    return status ? this.mapToDeviceStatus(status) : null;
  }

  async findByDeviceId(
    deviceId: string,
    options?: FindOptions<DeviceStatus>,
  ): Promise<DeviceStatus[]> {
    const statuses = await prisma.deviceStatus.findMany({
      where: { deviceId },
      include: { device: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: (options?.orderBy as
        | Prisma.DeviceStatusOrderByWithRelationInput
        | Prisma.DeviceStatusOrderByWithRelationInput[]
        | undefined) || { timestamp: "desc" },
    });
    return statuses.map((s) => this.mapToDeviceStatus(s));
  }

  async findRecent(deviceId: string, limit: number): Promise<DeviceStatus[]> {
    const statuses = await prisma.deviceStatus.findMany({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { device: true },
    });
    return statuses.map((s) => this.mapToDeviceStatus(s));
  }

  async findLatest(deviceId: string): Promise<DeviceStatus | null> {
    const status = await prisma.deviceStatus.findFirst({
      where: { deviceId },
      orderBy: { timestamp: "desc" },
      include: { device: true },
    });
    return status ? this.mapToDeviceStatus(status) : null;
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
    const status = await prisma.deviceStatus.create({
      data: {
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        batteryPercentage: data.batteryPercentage,
        wifiConnected: data.wifiConnected,
        bluetoothConnected: data.bluetoothConnected,
        sensorsInitialized: data.sensorsInitialized,
        uptimeMs: data.uptimeMs,
        currentStatus: data.currentStatus,
      },
      include: { device: true },
    });
    return this.mapToDeviceStatus(status);
  }

  private mapToDeviceStatus(
    status: PrismaDeviceStatusWithDevice,
  ): DeviceStatus {
    return {
      id: status.id,
      deviceId: status.deviceId,
      timestamp: status.timestamp,
      batteryPercentage: status.batteryPercentage,
      wifiConnected: status.wifiConnected,
      bluetoothConnected: status.bluetoothConnected,
      sensorsInitialized: status.sensorsInitialized,
      uptimeMs: status.uptimeMs,
      currentStatus: status.currentStatus ?? undefined,
      device: status.device
        ? {
            id: status.device.id,
            deviceId: status.device.deviceId,
            patientId: status.device.patientId ?? undefined,
            deviceName: status.device.deviceName ?? undefined,
            isActive: status.device.isActive,
            isMuted: status.device.isMuted,
            lastSeen: status.device.lastSeen ?? undefined,
            batteryLevel: status.device.batteryLevel ?? undefined,
            firmwareVersion: status.device.firmwareVersion ?? undefined,
            createdAt: status.device.createdAt,
          }
        : undefined,
    };
  }
}
