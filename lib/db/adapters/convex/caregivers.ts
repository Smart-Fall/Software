/**
 * Convex Caregiver Repository Implementation
 */

import { ICaregiverRepository } from "../base";
import { Caregiver, FindOptions } from "../../types";
import { getConvexClient } from "./client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ConvexCaregiver = {
  _id: Id<"caregivers">;
  userId: string;
  facilityName?: string;
  specialization?: string;
  yearsOfExperience?: number;
  createdAt: number | string | Date;
  user?: Caregiver["user"];
};

export class ConvexCaregiverRepository implements ICaregiverRepository {
  private client = getConvexClient();

  async findById(id: string): Promise<Caregiver | null> {
    try {
      const caregiver = await this.client.query(api.caregivers.getById, {
        id: id as Id<"caregivers">,
      });
      return caregiver ? this.mapToCaregiver(caregiver as ConvexCaregiver) : null;
    } catch (error) {
      console.error("Error finding caregiver by id:", error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Caregiver | null> {
    try {
      const caregiver = await this.client.query(api.caregivers.getByUserId, {
        userId,
      });
      return caregiver ? this.mapToCaregiver(caregiver as ConvexCaregiver) : null;
    } catch (error) {
      console.error("Error finding caregiver by user id:", error);
      return null;
    }
  }

  async create(data: {
    userId: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  }): Promise<Caregiver> {
    try {
      const caregiverId = await this.client.mutation(api.caregivers.create, {
        userId: data.userId,
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      });

      const caregiver = await this.client.query(api.caregivers.getById, {
        id: caregiverId as Id<"caregivers">,
      });
      if (!caregiver) throw new Error("Failed to create caregiver");
      return this.mapToCaregiver(caregiver as ConvexCaregiver);
    } catch (error) {
      console.error("Error creating caregiver:", error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Caregiver>): Promise<Caregiver> {
    try {
      await this.client.mutation(api.caregivers.update, {
        id: id as Id<"caregivers">,
        facilityName: data.facilityName,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
      });

      const caregiver = await this.client.query(api.caregivers.getById, {
        id: id as Id<"caregivers">,
      });
      if (!caregiver) throw new Error("Caregiver not found after update");
      return this.mapToCaregiver(caregiver as ConvexCaregiver);
    } catch (error) {
      console.error("Error updating caregiver:", error);
      throw error;
    }
  }

  async findMany(options?: FindOptions<Caregiver>): Promise<Caregiver[]> {
    try {
      const skip = options?.skip ?? 0;
      const take = options?.take ?? 20;

      const caregivers = await this.client.query(api.caregivers.list, {
        skip,
        take,
      });
      return (caregivers as ConvexCaregiver[]).map((c) =>
        this.mapToCaregiver(c),
      );
    } catch (error) {
      console.error("Error listing caregivers:", error);
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await this.client.query(api.caregivers.count, {});
    } catch (error) {
      console.error("Error counting caregivers:", error);
      return 0;
    }
  }

  private mapToCaregiver(caregiver: ConvexCaregiver): Caregiver {
    return {
      id: caregiver._id,
      userId: caregiver.userId,
      facilityName: caregiver.facilityName,
      specialization: caregiver.specialization,
      yearsOfExperience: caregiver.yearsOfExperience,
      createdAt: new Date(caregiver.createdAt),
      user: caregiver.user,
    };
  }
}
