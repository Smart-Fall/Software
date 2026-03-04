/**
 * Prisma Session Repository Implementation
 */

import { ISessionRepository } from '../base';
import { Session } from '../../types';
import prisma from '@/lib/prisma';
import type { Session as PrismaSession } from '@prisma/client';

export class PrismaSessionRepository implements ISessionRepository {
  async create(data: {
    userId: string;
    sessionToken: string;
    expiresAt?: Date;
  }): Promise<Session> {
    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
      },
    });
    return this.mapToSession(session);
  }

  async findByToken(sessionToken: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });
    return session ? this.mapToSession(session) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: { userId },
    });
    return sessions.map((s) => this.mapToSession(s));
  }

  async deleteByToken(sessionToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  private mapToSession(session: PrismaSession): Session {
    return {
      id: session.id,
      userId: session.userId ?? undefined,
      sessionToken: session.sessionToken,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt ?? undefined,
    };
  }
}
