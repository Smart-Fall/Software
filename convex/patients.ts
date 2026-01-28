/**
 * Convex Patient Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('patients') },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.id);
    if (!patient) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', patient.externalUserId))
      .unique();

    return { ...patient, user };
  },
});

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('patients')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .unique();
  },
});

export const getByExternalUserId = query({
  args: { externalUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('patients')
      .withIndex('by_external_user_id', (q) => q.eq('externalUserId', args.externalUserId))
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

    const patients = await ctx.db.query('patients').collect();
    const patientsWithUsers = await Promise.all(
      patients.slice(skip, skip + take).map(async (patient) => {
        const user = await ctx.db
          .query('users')
          .withIndex('by_external_id', (q) => q.eq('externalId', patient.externalUserId))
          .unique();
        return { ...patient, user };
      })
    );
    return patientsWithUsers;
  },
});

export const count = query({
  handler: async (ctx) => {
    const patients = await ctx.db.query('patients').collect();
    return patients.length;
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    userId: v.id('users'),
    riskScore: v.optional(v.number()),
    isHighRisk: v.optional(v.boolean()),
    medicalConditions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await ctx.db.insert('patients', {
      externalId: crypto.randomUUID(),
      userId: args.userId,
      externalUserId: user.externalId,
      riskScore: args.riskScore ?? 0,
      isHighRisk: args.isHighRisk ?? false,
      medicalConditions: args.medicalConditions,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('patients'),
    riskScore: v.optional(v.number()),
    isHighRisk: v.optional(v.boolean()),
    medicalConditions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});
