/**
 * Convex User Repository Implementation
 */

import { IUserRepository } from '../base';
import { User } from '../../types';
import { getConvexClient } from './client';
import { api } from '@/convex/_generated/api';

export class ConvexUserRepository implements IUserRepository {
  private client = getConvexClient();

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.client.query(api.users.getByEmail, { email });
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.client.query(api.users.getById, { id: id as any });
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async create(data: {
    email: string;
    passwordHash: string;
    accountType: 'user' | 'caregiver';
    firstName?: string;
    lastName?: string;
    dob?: Date;
  }): Promise<User> {
    try {
      const userId = await this.client.mutation(api.users.create, {
        email: data.email,
        passwordHash: data.passwordHash,
        accountType: data.accountType,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob ? data.dob.getTime() : undefined,
      });

      const user = await this.client.query(api.users.getById, { id: userId as any });
      if (!user) throw new Error('Failed to create user');
      return this.mapToUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      await this.client.mutation(api.users.update, {
        id: id as any,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob ? data.dob.getTime() : undefined,
        isActive: data.isActive,
      });

      const user = await this.client.query(api.users.getById, { id: id as any });
      if (!user) throw new Error('User not found after update');
      return this.mapToUser(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async findAll(options?: any): Promise<User[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const users = await this.client.query(api.users.list, { skip, take });
      return users.map((u: any) => this.mapToUser(u));
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }

  private mapToUser(user: any): User {
    return {
      id: user._id,
      email: user.email,
      passwordHash: user.passwordHash,
      accountType: user.accountType as 'user' | 'caregiver',
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob ? new Date(user.dob) : undefined,
      isActive: user.isActive,
      createdAt: new Date(user.createdAt),
    };
  }
}
