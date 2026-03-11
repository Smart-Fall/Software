/**
 * Prisma Message Repository Stub
 * Messages are Convex-only; this stub satisfies the IDatabaseAdapter interface
 * when running with the Prisma provider.
 */

import { IMessageRepository } from '../base';
import { Message } from '../../types';

export class PrismaMessageRepository implements IMessageRepository {
  async create(_data: {
    caregiverId: string;
    patientId: string;
    subject?: string;
    messageText: string;
    isUrgent?: boolean;
  }): Promise<Message> {
    void _data;
    throw new Error('Messages are not supported by the Prisma adapter');
  }

  async findByPatientId(_patientId: string): Promise<Message[]> {
    void _patientId;
    return [];
  }

  async findByCaregiverAndPatient(_caregiverId: string, _patientId: string): Promise<Message[]> {
    void _caregiverId;
    void _patientId;
    return [];
  }

  async getUnreadCount(_patientId: string): Promise<number> {
    void _patientId;
    return 0;
  }

  async markAsRead(_messageId: string, _patientId: string): Promise<Message> {
    void _messageId;
    void _patientId;
    throw new Error('Messages are not supported by the Prisma adapter');
  }
}
