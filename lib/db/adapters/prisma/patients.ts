/**
 * Prisma Patient Repository Implementation
 */

import { IPatientRepository } from '../base';
import { Patient } from '../../types';
import prisma from '@/lib/prisma';

export class PrismaPatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });
    return patient ? this.mapToPatient(patient) : null;
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    return patient ? this.mapToPatient(patient) : null;
  }

  async findMany(options?: any): Promise<Patient[]> {
    const patients = await prisma.patient.findMany({
      include: { user: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
    return patients.map((p) => this.mapToPatient(p));
  }

  async findByCaregiverId(caregiverId: string): Promise<Patient[]> {
    const assignments = await prisma.caregiverPatient.findMany({
      where: { caregiverId, isActive: true },
      include: {
        patient: { include: { user: true } },
      },
    });
    return assignments.map((a) => this.mapToPatient(a.patient));
  }

  async create(data: {
    userId: string;
    riskScore?: number;
    isHighRisk?: boolean;
    medicalConditions?: string;
  }): Promise<Patient> {
    const patient = await prisma.patient.create({
      data: {
        userId: data.userId,
        riskScore: data.riskScore ?? 0,
        isHighRisk: data.isHighRisk ?? false,
        medicalConditions: data.medicalConditions,
      },
      include: { user: true },
    });
    return this.mapToPatient(patient);
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        riskScore: data.riskScore,
        isHighRisk: data.isHighRisk,
        medicalConditions: data.medicalConditions,
      },
      include: { user: true },
    });
    return this.mapToPatient(patient);
  }

  async count(): Promise<number> {
    return await prisma.patient.count();
  }

  private mapToPatient(patient: any): Patient {
    return {
      id: patient.id,
      userId: patient.userId,
      riskScore: patient.riskScore,
      isHighRisk: patient.isHighRisk,
      medicalConditions: patient.medicalConditions,
      createdAt: patient.createdAt,
      user: patient.user,
    };
  }
}
