/**
 * Prisma CaregiverPatient Repository Implementation
 */

import { ICaregiverPatientRepository } from '../base';
import { CaregiverPatient } from '../../types';
import prisma from '@/lib/prisma';

export class PrismaCaregiverPatientRepository implements ICaregiverPatientRepository {
  async create(data: {
    caregiverId: string;
    patientId: string;
    isActive?: boolean;
  }): Promise<CaregiverPatient> {
    const assignment = await prisma.caregiverPatient.create({
      data: {
        caregiverId: data.caregiverId,
        patientId: data.patientId,
        isActive: data.isActive ?? true,
      },
    });
    return this.mapToCaregiverPatient(assignment);
  }

  async findByCaregiverId(caregiverId: string): Promise<CaregiverPatient[]> {
    const assignments = await prisma.caregiverPatient.findMany({
      where: { caregiverId },
      include: { caregiver: true, patient: true },
    });
    return assignments.map((a) => this.mapToCaregiverPatient(a));
  }

  async findByPatientId(patientId: string): Promise<CaregiverPatient[]> {
    const assignments = await prisma.caregiverPatient.findMany({
      where: { patientId },
      include: { caregiver: true, patient: true },
    });
    return assignments.map((a) => this.mapToCaregiverPatient(a));
  }

  async findByIds(caregiverId: string, patientId: string): Promise<CaregiverPatient | null> {
    const assignment = await prisma.caregiverPatient.findUnique({
      where: {
        caregiverId_patientId: {
          caregiverId,
          patientId,
        },
      },
    });
    return assignment ? this.mapToCaregiverPatient(assignment) : null;
  }

  async update(
    caregiverId: string,
    patientId: string,
    data: Partial<CaregiverPatient>
  ): Promise<CaregiverPatient> {
    const assignment = await prisma.caregiverPatient.update({
      where: {
        caregiverId_patientId: {
          caregiverId,
          patientId,
        },
      },
      data: {
        isActive: data.isActive,
        assignedDate: data.assignedDate,
      },
    });
    return this.mapToCaregiverPatient(assignment);
  }

  async delete(caregiverId: string, patientId: string): Promise<void> {
    await prisma.caregiverPatient.delete({
      where: {
        caregiverId_patientId: {
          caregiverId,
          patientId,
        },
      },
    });
  }

  private mapToCaregiverPatient(assignment: any): CaregiverPatient {
    return {
      id: assignment.id,
      caregiverId: assignment.caregiverId,
      patientId: assignment.patientId,
      assignedDate: assignment.assignedDate,
      isActive: assignment.isActive,
      caregiver: assignment.caregiver,
      patient: assignment.patient,
    };
  }
}
