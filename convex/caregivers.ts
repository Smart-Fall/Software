/**
 * Convex Caregiver Queries and Mutations
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id("caregivers") },
  handler: async (ctx, args) => {
    const caregiver = await ctx.db.get(args.id);
    if (!caregiver) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) =>
        q.eq("externalId", caregiver.externalUserId),
      )
      .unique();

    return { ...caregiver, user };
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caregivers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getByExternalUserId = query({
  args: { externalUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caregivers")
      .withIndex("by_external_user_id", (q) =>
        q.eq("externalUserId", args.externalUserId),
      )
      .unique();
  },
});

export const list = query({
  args: {
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const skip = args.skip ?? 0;
    const take = args.take ?? 20;

    const caregivers = await ctx.db.query("caregivers").collect();
    const sliced = caregivers.slice(skip, skip + take);

    // Attach user data
    const results = await Promise.all(
      sliced.map(async (c) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_external_id", (q) =>
            q.eq("externalId", c.externalUserId),
          )
          .unique();
        return { ...c, user };
      }),
    );
    return results;
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const caregivers = await ctx.db.query("caregivers").collect();
    return caregivers.length;
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    userId: v.id("users"),
    facilityName: v.optional(v.string()),
    specialization: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("caregivers", {
      externalId: crypto.randomUUID(),
      userId: args.userId,
      externalUserId: user.externalId,
      facilityName: args.facilityName,
      specialization: args.specialization,
      yearsOfExperience: args.yearsOfExperience,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("caregivers"),
    facilityName: v.optional(v.string()),
    specialization: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});
