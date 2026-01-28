/**
 * Convex Session Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getByToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('sessionToken', args.sessionToken))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    userId: v.id('users'),
    sessionToken: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await ctx.db.insert('sessions', {
      externalId: crypto.randomUUID(),
      userId: args.userId,
      externalUserId: user.externalId,
      sessionToken: args.sessionToken,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

export const deleteByToken = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('sessionToken', args.sessionToken))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const deleteByUserId = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  },
});

export const deleteExpired = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query('sessions').collect();

    let deletedCount = 0;
    for (const session of sessions) {
      if (session.expiresAt && session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }

    return deletedCount;
  },
});
