/**
 * Convex HealthLog Repository Implementation
 */

import { IHealthLogRepository } from '../base';
import { HealthLog } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexHealthLogRepository implements IHealthLogRepository {
  private client = getConvexClient();

  async create(data: {
    patientId: string;
    healthScore: number;
    recordedAt?: Date;
  }): Promise<HealthLog> {
    try {
      const healthLogId = await this.client.mutation(api.healthLogs.create, {
        patientId: data.patientId as any,
        healthScore: data.healthScore,
        recordedAt: data.recordedAt?.getTime() || Date.now(),
      });

      const healthLog = await this.client.query(api.healthLogs.getById, {
        id: healthLogId as any,
      });
      if (!healthLog) throw new Error('Failed to create health log');
      return this.mapToHealthLog(healthLog);
    } catch (error) {
      console.error('Error creating health log:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<HealthLog | null> {
    try {
      const healthLog = await this.client.query(api.healthLogs.getById, {
        id: id as any,
      });
      return healthLog ? this.mapToHealthLog(healthLog) : null;
    } catch (error) {
      console.error('Error finding health log by id:', error);
      return null;
    }
  }

  async findByPatientId(patientId: string, options?: any): Promise<HealthLog[]> {
    try {
      const healthLogs = await this.client.query(api.healthLogs.getByPatientId, {
        patientId: patientId as any,
      });
      return healthLogs.map((h) => this.mapToHealthLog(h));
    } catch (error) {
      console.error('Error finding health logs by patient id:', error);
      return [];
    }
  }

  async findRecent(patientId: string, limit: number): Promise<HealthLog[]> {
    try {
      const healthLogs = await this.client.query(api.healthLogs.getRecent, {
        patientId: patientId as any,
        limit,
      });
      return healthLogs.map((h) => this.mapToHealthLog(h));
    } catch (error) {
      console.error('Error finding recent health logs:', error);
      return [];
    }
  }

  async findBetween(patientId: string, startDate: Date, endDate: Date): Promise<HealthLog[]> {
    try {
      const healthLogs = await this.client.query(api.healthLogs.getBetween, {
        patientId: patientId as any,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
      });
      return healthLogs.map((h) => this.mapToHealthLog(h));
    } catch (error) {
      console.error('Error finding health logs between dates:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<HealthLog>): Promise<HealthLog> {
    try {
      const healthLog = await this.client.mutation(api.healthLogs.update, {
        id: id as any,
        healthScore: data.healthScore,
        recordedAt: data.recordedAt?.getTime(),
      });
      return this.mapToHealthLog(healthLog);
    } catch (error) {
      console.error('Error updating health log:', error);
      throw error;
    }
  }

  private mapToHealthLog(data: any): HealthLog {
    return {
      id: data._id,
      patientId: data.patientId,
      healthScore: data.healthScore,
      recordedAt: new Date(data.recordedAt),
    };
  }
}
