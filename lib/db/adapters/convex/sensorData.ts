/**
 * Convex SensorData Repository Implementation
 */

import { ISensorDataRepository } from "../base";
import { FindOptions, SensorData } from "../../types";
import { getConvexClient } from "./client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ConvexSensorData = {
  _id: Id<"sensorData">;
  deviceId: string;
  timestamp: number | string | Date;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure?: number;
  fsr?: number;
  device?: SensorData["device"];
};

export class ConvexSensorDataRepository implements ISensorDataRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<SensorData | null> {
    try {
      const data = await this.client.query(api.sensorData.getById, {
        id: id as Id<"sensorData">,
      });
      return data ? this.mapToSensorData(data as ConvexSensorData) : null;
    } catch (error) {
      console.error("Error finding sensor data by id:", error);
      return null;
    }
  }

  async findByDeviceId(
    deviceId: string,
    options?: FindOptions<SensorData>,
  ): Promise<SensorData[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const data = await this.client.query(api.sensorData.getByDeviceId, {
        deviceId: deviceId as Id<"devices">,
        skip,
        take,
      });
      return (data as ConvexSensorData[]).map((d) => this.mapToSensorData(d));
    } catch (error) {
      console.error("Error finding sensor data by device id:", error);
      return [];
    }
  }

  async findRecent(deviceId: string, limit: number): Promise<SensorData[]> {
    try {
      const data = await this.client.query(api.sensorData.getRecent, {
        deviceId: deviceId as Id<"devices">,
        limit,
      });
      return (data as ConvexSensorData[]).map((d) => this.mapToSensorData(d));
    } catch (error) {
      console.error("Error finding recent sensor data:", error);
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
      const mutationData = {
        deviceId: data.deviceId as Id<"devices">,
        timestamp: data.timestamp.getTime(),
        accelX: data.accelX,
        accelY: data.accelY,
        accelZ: data.accelZ,
        gyroX: data.gyroX,
        gyroY: data.gyroY,
        gyroZ: data.gyroZ,
        pressure: data.pressure,
        fsr: data.fsr,
      };

      const sensorDataId = await this.client.mutation(
        api.sensorData.create,
        mutationData,
      );

      const sensorData = await this.client.query(api.sensorData.getById, {
        id: sensorDataId as Id<"sensorData">,
      });
      if (!sensorData) throw new Error("Failed to create sensor data");
      return this.mapToSensorData(sensorData as ConvexSensorData);
    } catch (error) {
      console.error("Error creating sensor data:", error);
      throw error;
    }
  }

  async findBetween(
    deviceId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<SensorData[]> {
    try {
      const data = await this.client.query(api.sensorData.getBetween, {
        deviceId: deviceId as Id<"devices">,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
      });
      return (data as ConvexSensorData[]).map((d) => this.mapToSensorData(d));
    } catch (error) {
      console.error("Error finding sensor data between times:", error);
      return [];
    }
  }

  private mapToSensorData(data: ConvexSensorData): SensorData {
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
