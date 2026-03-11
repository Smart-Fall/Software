/**
 * Convex Patient Repository Implementation
 */

import { IPatientRepository } from '../base';
import { FindOptions, Patient } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type ConvexPatient = {
  _id: Id<'patients'>;
  userId: string;
  riskScore: number;
  isHighRisk: boolean;
  medicalConditions?: string;
  createdAt: number | string | Date;
  user?: Patient['user'];
};

type ConvexCaregiverPatient = {
  patientId: Id<'patients'>;
};

export class ConvexPatientRepository implements IPatientRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<Patient | null> {
    try {
      const patient = await this.client.query(api.patients.getById, {
        id: id as unknown as Id<'patients'>,
      });
      return patient ? this.mapToPatient(patient as unknown as ConvexPatient) : null;
    } catch (error) {
      console.error('Error finding patient by id:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    try {
      const patient = await this.client.query(api.patients.getByUserId, { userId: userId as unknown as Id<'users'> });
      return patient ? this.mapToPatient(patient as unknown as ConvexPatient) : null;
    } catch (error) {
      console.error('Error finding patient by user id:', error);
      return null;
    }
  }

  async findMany(options?: FindOptions<Patient>): Promise<Patient[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const patients = await this.client.query(api.patients.list, { skip, take });
      return (patients as unknown as ConvexPatient[]).map((p) => this.mapToPatient(p));
    } catch (error) {
      console.error('Error listing patients:', error);
      return [];
    }
  }

  async findByCaregiverId(caregiverId: string): Promise<Patient[]> {
    try {
      // Get assignments for this caregiver
      const assignments = await this.client.query(api.caregiverPatients.getByCaregiverId, {
        caregiverId: caregiverId as Id<'caregivers'>,
      });

      // Get patient details for each assignment
      const patients = await Promise.all(
        (assignments as unknown as ConvexCaregiverPatient[]).map(async (a) => {
          const patient = await this.client.query(api.patients.getById, {
            id: a.patientId,
          });
          return patient ? this.mapToPatient(patient as unknown as ConvexPatient) : null;
        }),
      );

      return patients.filter((p): p is Patient => p !== null);
    } catch (error) {
      console.error('Error finding patients by caregiver id:', error);
      return [];
    }
  }

  async create(data: {
    userId: string;
    riskScore?: number;
    isHighRisk?: boolean;
    medicalConditions?: string;
  }): Promise<Patient> {
    try {
      const patientId = await this.client.mutation(api.patients.create, {
        userId: data.userId as unknown as Id<'users'>,
        riskScore: data.riskScore,
        isHighRisk: data.isHighRisk,
        medicalConditions: data.medicalConditions,
      });

      const patient = await this.client.query(api.patients.getById, {
        id: patientId as unknown as Id<'patients'>,
      });
      if (!patient) throw new Error('Failed to create patient');
      return this.mapToPatient(patient as unknown as ConvexPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    try {
      await this.client.mutation(api.patients.update, {
        id: id as unknown as Id<'patients'>,
        riskScore: data.riskScore,
        isHighRisk: data.isHighRisk,
        medicalConditions: data.medicalConditions,
      });

      const patient = await this.client.query(api.patients.getById, {
        id: id as unknown as Id<'patients'>,
      });
      if (!patient) throw new Error('Patient not found after update');
      return this.mapToPatient(patient as unknown as ConvexPatient);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.client.query(api.patients.count, {});
    } catch (error) {
      console.error('Error counting patients:', error);
      return 0;
    }
  }

  private mapToPatient(patient: ConvexPatient): Patient {
    return {
      id: patient._id,
      userId: patient.userId,
      riskScore: patient.riskScore,
      isHighRisk: patient.isHighRisk,
      medicalConditions: patient.medicalConditions,
      createdAt: new Date(patient.createdAt),
      user: patient.user,
    };
  }
}
