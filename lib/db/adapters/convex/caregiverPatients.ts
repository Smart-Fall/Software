/**
 * Convex CaregiverPatient Repository Implementation
 */

import { ICaregiverPatientRepository } from '../base';
import { CaregiverPatient } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexCaregiverPatientRepository implements ICaregiverPatientRepository {
  private client = getConvexClient();

  async create(data: {
    caregiverId: string;
    patientId: string;
    isActive?: boolean;
  }): Promise<CaregiverPatient> {
    try {
      const assignmentId = await this.client.mutation(api.caregiverPatients.create, {
        caregiverId: data.caregiverId as any,
        patientId: data.patientId as any,
        isActive: data.isActive,
      });

      const assignment = await this.client.query(api.caregiverPatients.getByCaregiverId, {
        caregiverId: data.caregiverId as any,
      });

      const found = assignment.find((a: any) => a._id === assignmentId);
      if (!found) throw new Error('Failed to create assignment');
      return this.mapToCaregiverPatient(found);
    } catch (error) {
      console.error('Error creating caregiver-patient assignment:', error);
      throw error;
    }
  }

  async findByCaregiverId(caregiverId: string): Promise<CaregiverPatient[]> {
    try {
      const assignments = await this.client.query(api.caregiverPatients.getByCaregiverId, {
        caregiverId: caregiverId as any,
      });
      return assignments.map((a: any) => this.mapToCaregiverPatient(a));
    } catch (error) {
      console.error('Error finding assignments by caregiver id:', error);
      return [];
    }
  }

  async findByPatientId(patientId: string): Promise<CaregiverPatient[]> {
    try {
      const assignments = await this.client.query(api.caregiverPatients.getByPatientId, {
        patientId: patientId as any,
      });
      return assignments.map((a: any) => this.mapToCaregiverPatient(a));
    } catch (error) {
      console.error('Error finding assignments by patient id:', error);
      return [];
    }
  }

  async findByIds(caregiverId: string, patientId: string): Promise<CaregiverPatient | null> {
    try {
      const assignments = await this.client.query(api.caregiverPatients.getByCaregiverId, {
        caregiverId: caregiverId as any,
      });
      const found = assignments.find((a: any) => a.patientId === patientId);
      return found ? this.mapToCaregiverPatient(found) : null;
    } catch (error) {
      console.error('Error finding assignment by ids:', error);
      return null;
    }
  }

  async update(
    caregiverId: string,
    patientId: string,
    data: Partial<CaregiverPatient>
  ): Promise<CaregiverPatient> {
    try {
      const assignment = await this.findByIds(caregiverId, patientId);
      if (!assignment) throw new Error('Assignment not found');

      await this.client.mutation(api.caregiverPatients.update, {
        id: assignment.id as any,
        isActive: data.isActive,
      });

      const updated = await this.findByIds(caregiverId, patientId);
      if (!updated) throw new Error('Assignment not found after update');
      return updated;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  async delete(caregiverId: string, patientId: string): Promise<void> {
    try {
      const assignment = await this.findByIds(caregiverId, patientId);
      if (!assignment) throw new Error('Assignment not found');

      await this.client.mutation(api.caregiverPatients.delete_, {
        id: assignment.id as any,
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  }

  private mapToCaregiverPatient(assignment: any): CaregiverPatient {
    return {
      id: assignment._id,
      caregiverId: assignment.caregiverId,
      patientId: assignment.patientId,
      assignedDate: new Date(assignment.assignedDate),
      isActive: assignment.isActive,
      caregiver: assignment.caregiver,
      patient: assignment.patient,
    };
  }
}
