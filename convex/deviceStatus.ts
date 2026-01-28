/**
 * Convex DeviceStatus Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('deviceStatus') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDeviceId = query({
  args: {
    deviceId: v.id('devices'),
    skip: v.optional(v.number()),
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let statuses = await ctx.db
      .query('deviceStatus')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    statuses = statuses.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const skip = args.skip ?? 0;
    const take = args.take ?? 20;
    return statuses.slice(skip, skip + take);
  },
});

export const getRecent = query({
  args: {
    deviceId: v.id('devices'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const statuses = await ctx.db
      .query('deviceStatus')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    return statuses
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, args.limit);
  },
});

export const getLatest = query({
  args: { deviceId: v.id('devices') },
  handler: async (ctx, args) => {
    const statuses = await ctx.db
      .query('deviceStatus')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    if (statuses.length === 0) return null;

    return statuses.reduce((latest, current) => {
      return (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest;
    });
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    deviceId: v.id('devices'),
    timestamp: v.number(),
    batteryPercentage: v.number(),
    wifiConnected: v.boolean(),
    bluetoothConnected: v.boolean(),
    sensorsInitialized: v.boolean(),
    uptimeMs: v.number(),
    currentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    return await ctx.db.insert('deviceStatus', {
      externalId: crypto.randomUUID(),
      deviceId: args.deviceId,
      externalDeviceId: device.externalId,
      timestamp: args.timestamp,
      batteryPercentage: args.batteryPercentage,
      wifiConnected: args.wifiConnected,
      bluetoothConnected: args.bluetoothConnected,
      sensorsInitialized: args.sensorsInitialized,
      uptimeMs: args.uptimeMs,
      currentStatus: args.currentStatus,
    });
  },
});

export const bulkCreate = mutation({
  args: {
    deviceId: v.id('devices'),
    records: v.array(
      v.object({
        timestamp: v.number(),
        batteryPercentage: v.number(),
        wifiConnected: v.boolean(),
        bluetoothConnected: v.boolean(),
        sensorsInitialized: v.boolean(),
        uptimeMs: v.number(),
        currentStatus: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const ids: string[] = [];
    for (const record of args.records) {
      const id = await ctx.db.insert('deviceStatus', {
        externalId: crypto.randomUUID(),
        deviceId: args.deviceId,
        externalDeviceId: device.externalId,
        timestamp: record.timestamp,
        batteryPercentage: record.batteryPercentage,
        wifiConnected: record.wifiConnected,
        bluetoothConnected: record.bluetoothConnected,
        sensorsInitialized: record.sensorsInitialized,
        uptimeMs: record.uptimeMs,
        currentStatus: record.currentStatus,
      });
      ids.push(id);
    }

    return ids;
  },
});
