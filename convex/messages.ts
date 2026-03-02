/**
 * Convex Message Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getById = query({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPatientId = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return messages.sort((a, b) => b.sentAt - a.sentAt);
  },
});

export const getByCaregiverAndPatient = query({
  args: {
    caregiverId: v.id('caregivers'),
    patientId: v.id('patients'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_caregiver_patient', (q) =>
        q.eq('caregiverId', args.caregiverId).eq('patientId', args.patientId)
      )
      .collect();

    return messages.sort((a, b) => b.sentAt - a.sentAt);
  },
});

export const getUnreadCountByPatient = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();

    return messages.filter((m) => !m.isRead).length;
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    caregiverId: v.id('caregivers'),
    patientId: v.id('patients'),
    subject: v.optional(v.string()),
    messageText: v.string(),
    isUrgent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      caregiverId: args.caregiverId,
      patientId: args.patientId,
      subject: args.subject,
      messageText: args.messageText,
      isRead: false,
      isUrgent: args.isUrgent ?? false,
      sentAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isRead: true,
      readAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});
