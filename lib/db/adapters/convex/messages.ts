/**
 * Convex Message Repository Implementation
 */

import { IMessageRepository } from '../base';
import { Message } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type ConvexMessage = {
  _id: Id<'messages'>;
  caregiverId: string;
  patientId: string;
  subject?: string;
  messageText: string;
  isRead: boolean;
  isUrgent: boolean;
  sentAt: number | string | Date;
  readAt?: number | string | Date;
};

export class ConvexMessageRepository implements IMessageRepository {
  private client = getConvexClient();

  async create(data: {
    caregiverId: string;
    patientId: string;
    subject?: string;
    messageText: string;
    isUrgent?: boolean;
  }): Promise<Message> {
    try {
      const messageId = await this.client.mutation(api.messages.create, {
        caregiverId: data.caregiverId as unknown as Id<'caregivers'>,
        patientId: data.patientId as unknown as Id<'patients'>,
        subject: data.subject,
        messageText: data.messageText,
        isUrgent: data.isUrgent,
      });

      const message = await this.client.query(api.messages.getById, {
        id: messageId as Id<'messages'>,
      });
      if (!message) throw new Error('Failed to create message');
      return this.mapToMessage(message as ConvexMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async findByPatientId(patientId: string): Promise<Message[]> {
    try {
      const messages = await this.client.query(api.messages.getByPatientId, {
        patientId: patientId as unknown as Id<'patients'>,
      });
      return (messages as ConvexMessage[]).map((m) => this.mapToMessage(m));
    } catch (error) {
      console.error('Error finding messages by patient id:', error);
      return [];
    }
  }

  async findByCaregiverAndPatient(caregiverId: string, patientId: string): Promise<Message[]> {
    try {
      const messages = await this.client.query(api.messages.getByCaregiverAndPatient, {
        caregiverId: caregiverId as unknown as Id<'caregivers'>,
        patientId: patientId as unknown as Id<'patients'>,
      });
      return (messages as ConvexMessage[]).map((m) => this.mapToMessage(m));
    } catch (error) {
      console.error('Error finding messages by caregiver and patient:', error);
      return [];
    }
  }

  async getUnreadCount(patientId: string): Promise<number> {
    try {
      return await this.client.query(api.messages.getUnreadCountByPatient, {
        patientId: patientId as unknown as Id<'patients'>,
      });
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async markAsRead(messageId: string, patientId: string): Promise<Message> {
    try {
      // Verify the message belongs to this patient before marking as read
      const existing = await this.client.query(api.messages.getById, {
        id: messageId as Id<'messages'>,
      });
      if (!existing) throw new Error('Message not found');
      if (existing.patientId !== patientId) throw new Error('Access denied');

      await this.client.mutation(api.messages.markAsRead, {
        id: messageId as Id<'messages'>,
      });

      const updated = await this.client.query(api.messages.getById, {
        id: messageId as Id<'messages'>,
      });
      if (!updated) throw new Error('Message not found after update');
      return this.mapToMessage(updated as ConvexMessage);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  private mapToMessage(message: ConvexMessage): Message {
    return {
      id: message._id,
      caregiverId: message.caregiverId,
      patientId: message.patientId,
      subject: message.subject,
      messageText: message.messageText,
      isRead: message.isRead,
      isUrgent: message.isUrgent,
      sentAt: new Date(message.sentAt),
      readAt: message.readAt ? new Date(message.readAt) : undefined,
    };
  }
}
