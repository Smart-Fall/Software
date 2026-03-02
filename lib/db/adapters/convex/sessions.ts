/**
 * Convex Session Repository Implementation
 */

import { ISessionRepository } from '../base';
import { Session } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type ConvexSession = {
  _id: Id<'sessions'>;
  userId?: string;
  sessionToken: string;
  createdAt: number | string | Date;
  expiresAt?: number | string | Date;
};

export class ConvexSessionRepository implements ISessionRepository {
  private client = getConvexClient();

  async create(data: {
    userId: string;
    sessionToken: string;
    expiresAt?: Date;
  }): Promise<Session> {
    try {
      const sessionId = await this.client.mutation(api.sessions.create, {
        userId: data.userId,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt ? data.expiresAt.getTime() : undefined,
      });

      const session = await this.client.query(api.sessions.getById, {
        id: sessionId as Id<'sessions'>,
      });
      if (!session) throw new Error('Failed to create session');
      return this.mapToSession(session as ConvexSession);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async findByToken(sessionToken: string): Promise<Session | null> {
    try {
      const session = await this.client.query(api.sessions.getByToken, { sessionToken });
      return session ? this.mapToSession(session as ConvexSession) : null;
    } catch (error) {
      console.error('Error finding session by token:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Session[]> {
    try {
      const sessions = await this.client.query(api.sessions.getByUserId, {
        userId,
      });
      return (sessions as ConvexSession[]).map((s) => this.mapToSession(s));
    } catch (error) {
      console.error('Error finding sessions by user id:', error);
      return [];
    }
  }

  async deleteByToken(sessionToken: string): Promise<void> {
    try {
      await this.client.mutation(api.sessions.deleteByToken, { sessionToken });
    } catch (error) {
      console.error('Error deleting session by token:', error);
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.client.mutation(api.sessions.deleteByUserId, {
        userId,
      });
    } catch (error) {
      console.error('Error deleting sessions by user id:', error);
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const count = await this.client.mutation(api.sessions.deleteExpired, {});
      return count;
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      return 0;
    }
  }

  private mapToSession(session: ConvexSession): Session {
    return {
      id: session._id,
      userId: session.userId,
      sessionToken: session.sessionToken,
      createdAt: new Date(session.createdAt),
      expiresAt: session.expiresAt ? new Date(session.expiresAt) : undefined,
    };
  }
}
