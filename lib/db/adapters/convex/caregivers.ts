/**
 * Convex Caregiver Repository Implementation
 */

import { ICaregiverRepository } from '../base';
import { Caregiver } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexCaregiverRepository implements ICaregiverRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<Caregiver | null> {
    try {
      const caregiver = await this.client.query(api.caregivers.getById, { id: id as any });
      return caregiver ? this.mapToCaregiver(caregiver) : null;
    } catch (error) {
      console.error('Error finding caregiver by id:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Caregiver | null> {
    try {
      const caregiver = await this.client.query(api.caregivers.getByUserId, {
        userId: userId as any,
      });
      return caregiver ? this.mapToCaregiver(caregiver) : null;
    } catch (error) {
      console.error('Error finding caregiver by user id:', error);
      return null;
    }
  }

  async create(data: {
    userId: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  }): Promise<Caregiver> {
    try {
      const caregiverId = await this.client.mutation(api.caregivers.create, {
        userId: data.userId as any,
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      });

      const caregiver = await this.client.query(api.caregivers.getById, {
        id: caregiverId as any,
      });
      if (!caregiver) throw new Error('Failed to create caregiver');
      return this.mapToCaregiver(caregiver);
    } catch (error) {
      console.error('Error creating caregiver:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Caregiver>): Promise<Caregiver> {
    try {
      await this.client.mutation(api.caregivers.update, {
        id: id as any,
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      });

      const caregiver = await this.client.query(api.caregivers.getById, { id: id as any });
      if (!caregiver) throw new Error('Caregiver not found after update');
      return this.mapToCaregiver(caregiver);
    } catch (error) {
      console.error('Error updating caregiver:', error);
      throw error;
    }
  }

  private mapToCaregiver(caregiver: any): Caregiver {
    return {
      id: caregiver._id,
      userId: caregiver.userId,
      facilityName: caregiver.facilityName,
      specialization: caregiver.specialization,
      yearsOfExperience: caregiver.yearsOfExperience,
      createdAt: new Date(caregiver.createdAt),
      user: caregiver.user,
    };
  }
}
