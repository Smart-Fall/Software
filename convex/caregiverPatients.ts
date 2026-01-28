/**
 * Convex CaregiverPatient Queries and Mutations
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// ============================================================================
// Queries
// ============================================================================

export const getByCaregiverId = query({
  args: { caregiverId: v.id('caregivers') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('caregiverPatients')
      .withIndex('by_caregiver_id', (q) => q.eq('caregiverId', args.caregiverId))
      .collect();
  },
});

export const getByPatientId = query({
  args: { patientId: v.id('patients') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('caregiverPatients')
      .withIndex('by_patient_id', (q) => q.eq('patientId', args.patientId))
      .collect();
  },
});

export const getByExternalCaregiverId = query({
  args: { externalCaregiverId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('caregiverPatients')
      .withIndex('by_external_caregiver_id', (q) => q.eq('externalCaregiverId', args.externalCaregiverId))
      .collect();
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    caregiverId: v.id('caregivers'),
    patientId: v.id('patients'),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const caregiver = await ctx.db.get(args.caregiverId);
    const patient = await ctx.db.get(args.patientId);

    if (!caregiver) {
      throw new Error('Caregiver not found');
    }
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Check for duplicate assignment
    const existing = await ctx.db
      .query('caregiverPatients')
      .withIndex('by_caregiver_id', (q) => q.eq('caregiverId', args.caregiverId))
      .collect();

    const duplicate = existing.find((a) => a.patientId === args.patientId);
    if (duplicate) {
      throw new Error('This caregiver is already assigned to this patient');
    }

    return await ctx.db.insert('caregiverPatients', {
      externalId: crypto.randomUUID(),
      caregiverId: args.caregiverId,
      patientId: args.patientId,
      externalCaregiverId: caregiver.externalId,
      externalPatientId: patient.externalId,
      assignedDate: Date.now(),
      isActive: args.isActive ?? true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('caregiverPatients'),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const delete_ = mutation({
  args: { id: v.id('caregiverPatients') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
