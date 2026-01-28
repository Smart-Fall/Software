/**
 * Convex User Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', args.externalId))
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

    const users = await ctx.db.query('users').collect();
    return users.slice(skip, skip + take);
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    accountType: v.union(v.literal('user'), v.literal('caregiver')),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dob: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (existing) {
      throw new Error(`User with email ${args.email} already exists`);
    }

    return await ctx.db.insert('users', {
      externalId: crypto.randomUUID(),
      email: args.email,
      passwordHash: args.passwordHash,
      accountType: args.accountType,
      firstName: args.firstName,
      lastName: args.lastName,
      dob: args.dob,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('users'),
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dob: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});
