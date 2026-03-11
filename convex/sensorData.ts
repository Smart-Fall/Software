/**
 * Convex SensorData Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('sensorData') },
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
    let data = await ctx.db
      .query('sensorData')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    data = data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const skip = args.skip ?? 0;
    const take = args.take ?? 20;
    return data.slice(skip, skip + take);
  },
});

export const getRecent = query({
  args: {
    deviceId: v.id('devices'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sensorData')
      .withIndex('by_device_timestamp', (q) => q.eq('deviceId', args.deviceId))
      .order('desc')
      .take(args.limit);
  },
});

export const getBetween = query({
  args: {
    deviceId: v.id('devices'),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    let data = await ctx.db
      .query('sensorData')
      .withIndex('by_device_id', (q) => q.eq('deviceId', args.deviceId))
      .collect();

    data = data.filter((d) => d.timestamp >= args.startTime && d.timestamp <= args.endTime);
    return data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    deviceId: v.id('devices'),
    timestamp: v.number(),
    accelX: v.number(),
    accelY: v.number(),
    accelZ: v.number(),
    gyroX: v.number(),
    gyroY: v.number(),
    gyroZ: v.number(),
    pressure: v.optional(v.number()),
    fsr: v.optional(v.number()),
    heartRate: v.optional(v.number()),
    spo2: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    return await ctx.db.insert('sensorData', {
      externalId: crypto.randomUUID(),
      deviceId: args.deviceId,
      externalDeviceId: device.externalId,
      timestamp: args.timestamp,
      accelX: args.accelX,
      accelY: args.accelY,
      accelZ: args.accelZ,
      gyroX: args.gyroX,
      gyroY: args.gyroY,
      gyroZ: args.gyroZ,
      pressure: args.pressure,
      fsr: args.fsr,
      heartRate: args.heartRate,
      spo2: args.spo2,
    });
  },
});

export const bulkCreate = mutation({
  args: {
    deviceId: v.id('devices'),
    records: v.array(
      v.object({
        timestamp: v.number(),
        accelX: v.number(),
        accelY: v.number(),
        accelZ: v.number(),
        gyroX: v.number(),
        gyroY: v.number(),
        gyroZ: v.number(),
        pressure: v.optional(v.number()),
        fsr: v.optional(v.number()),
        heartRate: v.optional(v.number()),
        spo2: v.optional(v.number()),
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
      const id = await ctx.db.insert('sensorData', {
        externalId: crypto.randomUUID(),
        deviceId: args.deviceId,
        externalDeviceId: device.externalId,
        timestamp: record.timestamp,
        accelX: record.accelX,
        accelY: record.accelY,
        accelZ: record.accelZ,
        gyroX: record.gyroX,
        gyroY: record.gyroY,
        gyroZ: record.gyroZ,
        pressure: record.pressure,
        fsr: record.fsr,
        heartRate: record.heartRate,
        spo2: record.spo2,
      });
      ids.push(id);
    }

    return ids;
  },
});
