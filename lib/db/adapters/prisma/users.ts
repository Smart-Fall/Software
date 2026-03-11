/**
 * Prisma User Repository Implementation
 */

import { IUserRepository } from "../base";
import { FindOptions, User } from "../../types";
import prisma from "@/lib/prisma";
import type { Prisma, User as PrismaUser } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapToUser(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapToUser(user) : null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    accountType: "user" | "caregiver" | "admin";
    firstName?: string;
    lastName?: string;
    dob?: Date;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        accountType: data.accountType,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
      },
    });
    return this.mapToUser(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        accountType: data.accountType,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
        isActive: data.isActive,
      },
    });
    return this.mapToUser(user);
  }

  async findAll(options?: FindOptions<User>): Promise<User[]> {
    const users = await prisma.user.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy as Prisma.UserOrderByWithRelationInput | undefined,
    });
    return users.map((u) => this.mapToUser(u));
  }

  async count(): Promise<number> {
    return await prisma.user.count();
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  private mapToUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      accountType: user.accountType as "user" | "caregiver" | "admin",
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      dob: user.dob ?? undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
