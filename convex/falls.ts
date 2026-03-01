/**
 * Convex Fall Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('falls') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPatientId = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    const falls = await ctx.db
      .query('falls')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return falls.sort((a, b) => (b.fallDatetime || 0) - (a.fallDatetime || 0));
  },
});

export const getByDeviceId = query({
  args: { deviceId: v.id('devices') },
  handler: async (ctx, args) => {
    const falls = await ctx.db
      .query('falls')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    return falls.sort((a, b) => (b.fallDatetime || 0) - (a.fallDatetime || 0));
  },
});

export const getRecent = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('falls')
      .withIndex('by_created_at')
      .order('desc')
      .take(args.limit);
  },
});

export const getUnresolved = query({
  handler: async (ctx) => {
    const falls = await ctx.db
      .query('falls')
      .withIndex('by_resolved', (q) => q.eq('resolved', false))
      .collect();

    return falls.sort((a, b) => (b.fallDatetime || 0) - (a.fallDatetime || 0));
  },
});

export const list = query({
  args: {
    patientId: v.optional(v.id('patients')),
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let falls = await ctx.db.query('falls').collect();

    if (args.patientId) {
      falls = falls.filter((f) => f.patientId === args.patientId);
    }

    falls = falls.sort((a, b) => (b.fallDatetime || 0) - (a.fallDatetime || 0));

    const skip = args.skip ?? 0;
    const take = args.take ?? 20;
    return falls.slice(skip, skip + take);
  },
});

export const count = query({
  handler: async (ctx) => {
    // Convex has no native COUNT — use a bounded collect on an indexed field
    const falls = await ctx.db
      .query('falls')
      .withIndex('by_created_at')
      .collect();
    return falls.length;
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    patientId: v.optional(v.id('patients')),
    deviceId: v.optional(v.id('devices')),
    fallDatetime: v.number(),
    confidenceScore: v.optional(v.number()),
    confidenceLevel: v.optional(v.string()),
    sosTriggered: v.optional(v.boolean()),
    severity: v.optional(v.string()),
    location: v.optional(v.string()),
    wasInjured: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    batteryLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const externalPatientId = args.patientId
      ? (await ctx.db.get(args.patientId))?.externalId
      : undefined;

    const externalDeviceId = args.deviceId
      ? (await ctx.db.get(args.deviceId))?.externalId
      : undefined;

    return await ctx.db.insert('falls', {
      externalId: crypto.randomUUID(),
      patientId: args.patientId,
      deviceId: args.deviceId,
      externalPatientId,
      externalDeviceId,
      fallDatetime: args.fallDatetime,
      confidenceScore: args.confidenceScore,
      confidenceLevel: args.confidenceLevel,
      sosTriggered: args.sosTriggered ?? false,
      severity: args.severity,
      location: args.location,
      wasInjured: args.wasInjured,
      notes: args.notes,
      batteryLevel: args.batteryLevel,
      resolved: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('falls'),
    severity: v.optional(v.string()),
    location: v.optional(v.string()),
    wasInjured: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});
