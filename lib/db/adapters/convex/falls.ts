/**
 * Convex Fall Repository Implementation
 */

import { IFallRepository } from '../base';
import { Fall } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexFallRepository implements IFallRepository {
  private client = getConvexClient();

  async create(data: {
    patientId?: string;
    deviceId?: string;
    fallDatetime: Date;
    confidenceScore?: number;
    confidenceLevel?: string;
    sosTriggered?: boolean;
    severity?: string;
    location?: string;
    wasInjured?: boolean;
    notes?: string;
    batteryLevel?: number;
  }): Promise<Fall> {
    try {
      const fallId = await this.client.mutation(api.falls.create, {
        patientId: data.patientId as any,
        deviceId: data.deviceId as any,
        fallDatetime: data.fallDatetime.getTime(),
        confidenceScore: data.confidenceScore,
        confidenceLevel: data.confidenceLevel,
        sosTriggered: data.sosTriggered,
        severity: data.severity,
        location: data.location,
        wasInjured: data.wasInjured,
        notes: data.notes,
        batteryLevel: data.batteryLevel,
      });

      const fall = await this.client.query(api.falls.getById, { id: fallId as any });
      if (!fall) throw new Error('Failed to create fall');
      return this.mapToFall(fall);
    } catch (error) {
      console.error('Error creating fall:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Fall | null> {
    try {
      const fall = await this.client.query(api.falls.getById, { id: id as any });
      return fall ? this.mapToFall(fall) : null;
    } catch (error) {
      console.error('Error finding fall by id:', error);
      return null;
    }
  }

  async findMany(options?: any): Promise<Fall[]> {
    try {
      const falls = await this.client.query(api.falls.list, {
        patientId: options?.where?.patientId as any,
        skip: options?.skip,
        take: options?.take,
      });
      return falls.map((f: any) => this.mapToFall(f));
    } catch (error) {
      console.error('Error listing falls:', error);
      return [];
    }
  }

  async findByPatientId(patientId: string): Promise<Fall[]> {
    try {
      const falls = await this.client.query(api.falls.getByPatientId, { patientId: patientId as any });
      return falls.map((f: any) => this.mapToFall(f));
    } catch (error) {
      console.error('Error finding falls by patient id:', error);
      return [];
    }
  }

  async findByDeviceId(deviceId: string): Promise<Fall[]> {
    try {
      const falls = await this.client.query(api.falls.getByDeviceId, { deviceId: deviceId as any });
      return falls.map((f: any) => this.mapToFall(f));
    } catch (error) {
      console.error('Error finding falls by device id:', error);
      return [];
    }
  }

  async findRecent(limit: number): Promise<Fall[]> {
    try {
      const falls = await this.client.query(api.falls.getRecent, { limit });
      return falls.map((f: any) => this.mapToFall(f));
    } catch (error) {
      console.error('Error finding recent falls:', error);
      return [];
    }
  }

  async findUnresolved(): Promise<Fall[]> {
    try {
      const falls = await this.client.query(api.falls.getUnresolved, {});
      return falls.map((f: any) => this.mapToFall(f));
    } catch (error) {
      console.error('Error finding unresolved falls:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<Fall>): Promise<Fall> {
    try {
      await this.client.mutation(api.falls.update, {
        id: id as any,
        severity: data.severity,
        location: data.location,
        wasInjured: data.wasInjured,
        notes: data.notes,
        resolved: data.resolved,
        resolvedAt: data.resolvedAt ? data.resolvedAt.getTime() : undefined,
      });

      const fall = await this.client.query(api.falls.getById, { id: id as any });
      if (!fall) throw new Error('Fall not found after update');
      return this.mapToFall(fall);
    } catch (error) {
      console.error('Error updating fall:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.client.query(api.falls.count, {});
    } catch (error) {
      console.error('Error counting falls:', error);
      return 0;
    }
  }

  private mapToFall(fall: any): Fall {
    return {
      id: fall._id,
      patientId: fall.patientId,
      deviceId: fall.deviceId,
      fallDatetime: new Date(fall.fallDatetime),
      confidenceScore: fall.confidenceScore,
      confidenceLevel: fall.confidenceLevel,
      sosTriggered: fall.sosTriggered,
      severity: fall.severity,
      location: fall.location,
      wasInjured: fall.wasInjured,
      notes: fall.notes,
      batteryLevel: fall.batteryLevel,
      resolved: fall.resolved,
      resolvedAt: fall.resolvedAt ? new Date(fall.resolvedAt) : undefined,
      createdAt: new Date(fall.createdAt),
      patient: fall.patient,
      device: fall.device,
    };
  }
}
