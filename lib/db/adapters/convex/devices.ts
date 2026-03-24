/**
 * Convex Device Repository Implementation
 */

import { IDeviceRepository } from "../base";
import { Device, FindOptions } from "../../types";
import { getConvexClient } from "./client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ConvexDevice = {
  _id: Id<"devices">;
  deviceId: string;
  patientId?: string;
  deviceName?: string;
  isActive: boolean;
  isMuted?: boolean;
  lastSeen?: number | string | Date;
  batteryLevel?: number;
  firmwareVersion?: string;
  createdAt: number | string | Date;
  patient?: Device["patient"];
};

export class ConvexDeviceRepository implements IDeviceRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<Device | null> {
    try {
      const device = await this.client.query(api.devices.getById, {
        id: id as Id<"devices">,
      });
      return device ? this.mapToDevice(device as unknown as ConvexDevice) : null;
    } catch (error) {
      console.error("Error finding device by id:", error);
      return null;
    }
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    try {
      const device = await this.client.query(api.devices.getByDeviceId, {
        deviceId,
      });
      return device ? this.mapToDevice(device as unknown as ConvexDevice) : null;
    } catch (error) {
      console.error("Error finding device by device id:", error);
      return null;
    }
  }

  async findByPatientId(patientId: string): Promise<Device[]> {
    try {
      const devices = await this.client.query(api.devices.getByPatientId, {
        patientId: patientId as Id<"patients">,
      });
      return (devices as unknown as ConvexDevice[]).map((d) => this.mapToDevice(d));
    } catch (error) {
      console.error("Error finding devices by patient id:", error);
      return [];
    }
  }

  async findMany(options?: FindOptions<Device>): Promise<Device[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const devices = await this.client.query(api.devices.list, { skip, take });
      return (devices as unknown as ConvexDevice[]).map((d) => this.mapToDevice(d));
    } catch (error) {
      console.error("Error listing devices:", error);
      return [];
    }
  }

  async create(data: {
    deviceId: string;
    patientId?: string;
    deviceName?: string;
    isActive?: boolean;
    batteryLevel?: number;
    firmwareVersion?: string;
  }): Promise<Device> {
    try {
      const newDeviceId = await this.client.mutation(api.devices.create, {
        deviceId: data.deviceId,
        patientId: data.patientId ? (data.patientId as Id<"patients">) : undefined,
        deviceName: data.deviceName,
        isActive: data.isActive,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
      });

      const device = await this.client.query(api.devices.getById, {
        id: newDeviceId as Id<"devices">,
      });
      if (!device) throw new Error("Failed to create device");
      return this.mapToDevice(device as unknown as ConvexDevice);
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Device>): Promise<Device> {
    try {
      const mutationData: Record<string, unknown> = {
        id: id as Id<"devices">,
        patientId: data.patientId,
        deviceName: data.deviceName,
        isActive: data.isActive,
        isMuted: data.isMuted,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        lastSeen: data.lastSeen ? data.lastSeen.getTime() : undefined,
      };

      await this.client.mutation(api.devices.update, mutationData as unknown as any);

      const device = await this.client.query(api.devices.getById, {
        id: id as Id<"devices">,
      });
      if (!device) throw new Error("Device not found after update");
      return this.mapToDevice(device as unknown as ConvexDevice);
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  }

  async updateByDeviceId(
    deviceId: string,
    data: Partial<Device>,
  ): Promise<Device> {
    try {
      await (this.client.mutation as (fn: unknown, args: unknown) => Promise<unknown>)(
        api.devices.updateByDeviceId,
        {
          deviceId,
          patientId: data.patientId ? (data.patientId as Id<"patients">) : undefined,
          deviceName: data.deviceName,
          isActive: data.isActive,
          isMuted: data.isMuted,
          batteryLevel: data.batteryLevel,
          firmwareVersion: data.firmwareVersion,
          lastSeen: data.lastSeen ? data.lastSeen.getTime() : undefined,
        },
      );

      const device = await this.client.query(api.devices.getByDeviceId, {
        deviceId,
      });
      if (!device) throw new Error("Device not found after update");
      return this.mapToDevice(device as unknown as ConvexDevice);
    } catch (error) {
      console.error("Error updating device by device id:", error);
      throw error;
    }
  }

  private mapToDevice(device: ConvexDevice): Device {
    return {
      id: device._id,
      deviceId: device.deviceId,
      patientId: device.patientId,
      deviceName: device.deviceName,
      isActive: device.isActive,
      isMuted: device.isMuted ?? false,
      lastSeen: device.lastSeen ? new Date(device.lastSeen) : undefined,
      batteryLevel: device.batteryLevel,
      firmwareVersion: device.firmwareVersion,
      createdAt: new Date(device.createdAt),
      patient: device.patient,
    };
  }

  async count(): Promise<number> {
    try {
      return await this.client.query(api.devices.count, {});
    } catch (error) {
      console.error("Error counting devices:", error);
      return 0;
    }
  }
}
