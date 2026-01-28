/**
 * Convex HealthLog Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('healthLogs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPatientId = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    const healthLogs = await ctx.db
      .query('healthLogs')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return healthLogs.sort((a, b) => (b.recordedAt || 0) - (a.recordedAt || 0));
  },
});

export const getRecent = query({
  args: {
    patientId: v.id('patients'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const healthLogs = await ctx.db
      .query('healthLogs')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return healthLogs
      .sort((a, b) => (b.recordedAt || 0) - (a.recordedAt || 0))
      .slice(0, args.limit);
  },
});

export const getBetween = query({
  args: {
    patientId: v.id('patients'),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const healthLogs = await ctx.db
      .query('healthLogs')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return healthLogs
      .filter((h) => h.recordedAt >= args.startTime && h.recordedAt <= args.endTime)
      .sort((a, b) => (a.recordedAt || 0) - (b.recordedAt || 0));
  },
});

export const list = query({
  args: {
    patientId: v.optional(v.id('patients')),
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let healthLogs = await ctx.db.query('healthLogs').collect();

    if (args.patientId) {
      healthLogs = healthLogs.filter((h) => h.patientId === args.patientId);
    }

    healthLogs = healthLogs.sort((a, b) => (b.recordedAt || 0) - (a.recordedAt || 0));

    const skip = args.skip ?? 0;
    const take = args.take ?? 20;
    return healthLogs.slice(skip, skip + take);
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    patientId: v.id('patients'),
    healthScore: v.number(),
    recordedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('healthLogs', {
      patientId: args.patientId,
      healthScore: args.healthScore,
      recordedAt: args.recordedAt,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('healthLogs'),
    healthScore: v.optional(v.number()),
    recordedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const updateData: any = {};

    if (data.healthScore !== undefined) {
      updateData.healthScore = data.healthScore;
    }
    if (data.recordedAt !== undefined) {
      updateData.recordedAt = data.recordedAt;
    }

    await ctx.db.patch(id, updateData);
    return await ctx.db.get(id);
  },
});

export const delete_ = mutation({
  args: { id: v.id('healthLogs') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
