/**
 * Convex DeviceLogs Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    deviceId: v.id('devices'),
    level: v.string(),
    category: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error('Device not found');

    return await ctx.db.insert('deviceLogs', {
      externalId: crypto.randomUUID(),
      deviceId: args.deviceId,
      externalDeviceId: device.externalId,
      level: args.level,
      category: args.category,
      message: args.message,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// ============================================================================
// Queries
// ============================================================================

export const getByDeviceId = query({
  args: {
    deviceId: v.id('devices'),
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const skip = args.skip ?? 0;
    const take = args.take ?? 50;

    const all = await ctx.db
      .query('deviceLogs')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .order('desc')
      .collect();

    return all.slice(skip, skip + take);
  },
});

export const getRecent = query({
  args: {
    deviceId: v.id('devices'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('deviceLogs')
      .withIndex('by_device_timestamp', (q) => q.eq('deviceId', args.deviceId))
      .order('desc')
      .take(args.limit);
  },
});

export const getAll = query({
  args: {
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
    deviceId: v.optional(v.string()),
    level: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const skip = args.skip ?? 0;
    const take = args.take ?? 100;

    let rows = await ctx.db
      .query('deviceLogs')
      .withIndex('by_created_at')
      .order('desc')
      .collect();

    // Apply filters
    if (args.deviceId) {
      rows = rows.filter((r) => r.deviceId === args.deviceId);
    }
    if (args.level) {
      rows = rows.filter((r) => r.level === args.level);
    }
    if (args.category) {
      rows = rows.filter((r) => r.category === args.category);
    }

    const total = rows.length;
    return { logs: rows.slice(skip, skip + take), total };
  },
});

export const countByDeviceId = query({
  args: { deviceId: v.id('devices') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('deviceLogs')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();
    return rows.length;
  },
});
