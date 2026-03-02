/**
 * Prisma Device Repository Implementation
 */

import { IDeviceRepository } from "../base";
import { Device, FindOptions } from "../../types";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type PrismaDeviceWithPatient = Prisma.DeviceGetPayload<{
  include: { patient: true };
}>;

export class PrismaDeviceRepository implements IDeviceRepository {
  async findById(id: string): Promise<Device | null> {
    const device = await prisma.device.findUnique({
      where: { id },
      include: { patient: true },
    });
    return device ? this.mapToDevice(device) : null;
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    const device = await prisma.device.findUnique({
      where: { deviceId },
      include: { patient: true },
    });
    return device ? this.mapToDevice(device) : null;
  }

  async findByPatientId(patientId: string): Promise<Device[]> {
    const devices = await prisma.device.findMany({
      where: { patientId },
      include: { patient: true },
    });
    return devices.map((d) => this.mapToDevice(d));
  }

  async findMany(options?: FindOptions<Device>): Promise<Device[]> {
    const devices = await prisma.device.findMany({
      where: options?.where,
      include: { patient: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
    return devices.map((d) => this.mapToDevice(d));
  }

  async create(data: {
    deviceId: string;
    patientId?: string;
    deviceName?: string;
    isActive?: boolean;
    batteryLevel?: number;
    firmwareVersion?: string;
  }): Promise<Device> {
    const device = await prisma.device.create({
      data: {
        deviceId: data.deviceId,
        patientId: data.patientId,
        deviceName: data.deviceName,
        isActive: data.isActive ?? true,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
      },
      include: { patient: true },
    });
    return this.mapToDevice(device);
  }

  async update(id: string, data: Partial<Device>): Promise<Device> {
    const device = await prisma.device.update({
      where: { id },
      data: {
        deviceId: data.deviceId,
        patientId: data.patientId,
        deviceName: data.deviceName,
        isActive: data.isActive,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        lastSeen: data.lastSeen,
      },
      include: { patient: true },
    });
    return this.mapToDevice(device);
  }

  async updateByDeviceId(
    deviceId: string,
    data: Partial<Device>,
  ): Promise<Device> {
    const device = await prisma.device.update({
      where: { deviceId },
      data: {
        patientId: data.patientId,
        deviceName: data.deviceName,
        isActive: data.isActive,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        lastSeen: data.lastSeen,
      },
      include: { patient: true },
    });
    return this.mapToDevice(device);
  }

  async count(): Promise<number> {
    return await prisma.device.count();
  }

  private mapToDevice(device: PrismaDeviceWithPatient): Device {
    return {
      id: device.id,
      deviceId: device.deviceId,
      patientId: device.patientId,
      deviceName: device.deviceName,
      isActive: device.isActive,
      lastSeen: device.lastSeen,
      batteryLevel: device.batteryLevel,
      firmwareVersion: device.firmwareVersion,
      createdAt: device.createdAt,
      patient: device.patient,
    };
  }
}
