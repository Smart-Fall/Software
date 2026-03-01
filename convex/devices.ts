/**
 * Convex Device Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('devices') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDeviceId = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('devices')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .unique();
  },
});

export const getByPatientId = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('devices')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();
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

    const devices = await ctx.db.query('devices').collect();
    return devices.slice(skip, skip + take);
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    deviceId: v.string(),
    patientId: v.optional(v.id('patients')),
    deviceName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    batteryLevel: v.optional(v.number()),
    firmwareVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Upsert: return existing device rather than throwing on duplicate
    const existing = await ctx.db
      .query('devices')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const externalPatientId = args.patientId
      ? (await ctx.db.get(args.patientId))?.externalId
      : undefined;

    return await ctx.db.insert('devices', {
      externalId: crypto.randomUUID(),
      deviceId: args.deviceId,
      patientId: args.patientId,
      externalPatientId,
      deviceName: args.deviceName,
      isActive: args.isActive ?? true,
      batteryLevel: args.batteryLevel,
      firmwareVersion: args.firmwareVersion,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('devices'),
    patientId: v.optional(v.id('patients')),
    deviceName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    batteryLevel: v.optional(v.number()),
    firmwareVersion: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const updateByDeviceId = mutation({
  args: {
    deviceId: v.string(),
    patientId: v.optional(v.id('patients')),
    deviceName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    batteryLevel: v.optional(v.number()),
    firmwareVersion: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query('devices')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .unique();

    if (!device) {
      throw new Error(`Device with ID ${args.deviceId} not found`);
    }

    const { deviceId, ...updates } = args;
    await ctx.db.patch(device._id, updates);
    return await ctx.db.get(device._id);
  },
});
