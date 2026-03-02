/**
 * Convex Database Schema
 * Defines all tables and indexes for the SmartFall application
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // Users Table
  // ============================================================================
  users: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    email: v.string(),
    passwordHash: v.string(),
    accountType: v.union(
      v.literal("user"),
      v.literal("caregiver"),
      v.literal("admin"),
    ),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dob: v.optional(v.number()), // Unix timestamp
    isActive: v.boolean(),
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_email", ["email"])
    .index("by_external_id", ["externalId"]),

  // ============================================================================
  // Sessions Table
  // ============================================================================
  sessions: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    userId: v.optional(v.string()), // Convex ID reference
    externalUserId: v.optional(v.string()), // Original Prisma UUID for migration
    sessionToken: v.string(),
    createdAt: v.number(), // Unix timestamp
    expiresAt: v.optional(v.number()), // Unix timestamp
  })
    .index("by_token", ["sessionToken"])
    .index("by_user_id", ["userId"])
    .index("by_external_user_id", ["externalUserId"]),

  // ============================================================================
  // Patients Table
  // ============================================================================
  patients: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    userId: v.string(), // Convex ID reference
    externalUserId: v.string(), // Original Prisma UUID for migration
    riskScore: v.number(),
    isHighRisk: v.boolean(),
    medicalConditions: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_user_id", ["userId"])
    .index("by_external_user_id", ["externalUserId"]),

  // ============================================================================
  // Caregivers Table
  // ============================================================================
  caregivers: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    userId: v.string(), // Convex ID reference
    externalUserId: v.string(), // Original Prisma UUID for migration
    facilityName: v.optional(v.string()),
    specialization: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_user_id", ["userId"])
    .index("by_external_user_id", ["externalUserId"]),

  // ============================================================================
  // CaregiverPatient Assignments
  // ============================================================================
  caregiverPatients: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    caregiverId: v.string(), // Convex ID reference
    patientId: v.string(), // Convex ID reference
    externalCaregiverId: v.string(), // Original Prisma UUID for migration
    externalPatientId: v.string(), // Original Prisma UUID for migration
    assignedDate: v.number(), // Unix timestamp
    isActive: v.boolean(),
  })
    .index("by_caregiver_id", ["caregiverId"])
    .index("by_patient_id", ["patientId"])
    .index("by_external_caregiver_id", ["externalCaregiverId"])
    .index("by_external_patient_id", ["externalPatientId"]),

  // ============================================================================
  // Falls Table
  // ============================================================================
  falls: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    patientId: v.optional(v.string()), // Convex ID reference
    deviceId: v.optional(v.string()), // Convex ID reference
    externalPatientId: v.optional(v.string()), // Original Prisma UUID for migration
    externalDeviceId: v.optional(v.string()), // Original Prisma UUID for migration
    fallDatetime: v.number(), // Unix timestamp
    confidenceScore: v.optional(v.number()),
    confidenceLevel: v.optional(v.string()),
    sosTriggered: v.boolean(),
    severity: v.optional(v.string()),
    location: v.optional(v.string()),
    wasInjured: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    batteryLevel: v.optional(v.number()),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()), // Unix timestamp
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_patient_id", ["patientId"])
    .index("by_device_id", ["deviceId"])
    .index("by_external_patient_id", ["externalPatientId"])
    .index("by_external_device_id", ["externalDeviceId"])
    .index("by_created_at", ["createdAt"])
    .index("by_resolved", ["resolved"]),

  // ============================================================================
  // Devices Table
  // ============================================================================
  devices: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    deviceId: v.string(), // Hardware identifier (unique, e.g., MAC address)
    patientId: v.optional(v.string()), // Convex ID reference
    externalPatientId: v.optional(v.string()), // Original Prisma UUID for migration
    deviceName: v.optional(v.string()),
    isActive: v.boolean(),
    lastSeen: v.optional(v.number()), // Unix timestamp
    batteryLevel: v.optional(v.number()),
    firmwareVersion: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_device_id", ["deviceId"])
    .index("by_patient_id", ["patientId"])
    .index("by_external_patient_id", ["externalPatientId"]),

  // ============================================================================
  // Sensor Data (Time Series)
  // ============================================================================
  sensorData: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    deviceId: v.string(), // Convex ID reference
    externalDeviceId: v.string(), // Original Prisma UUID for migration
    timestamp: v.number(), // Unix timestamp
    accelX: v.number(),
    accelY: v.number(),
    accelZ: v.number(),
    gyroX: v.number(),
    gyroY: v.number(),
    gyroZ: v.number(),
    pressure: v.optional(v.number()),
    fsr: v.optional(v.number()),
  })
    .index("by_device_id", ["deviceId"])
    .index("by_external_device_id", ["externalDeviceId"])
    .index("by_device_timestamp", ["deviceId", "timestamp"]),

  // ============================================================================
  // Device Status (Time Series)
  // ============================================================================
  deviceStatus: defineTable({
    externalId: v.string(), // Original Prisma UUID for migration
    deviceId: v.string(), // Convex ID reference
    externalDeviceId: v.string(), // Original Prisma UUID for migration
    timestamp: v.number(), // Unix timestamp
    batteryPercentage: v.number(),
    wifiConnected: v.boolean(),
    bluetoothConnected: v.boolean(),
    sensorsInitialized: v.boolean(),
    uptimeMs: v.number(),
    currentStatus: v.optional(v.string()),
  })
    .index("by_device_id", ["deviceId"])
    .index("by_external_device_id", ["externalDeviceId"])
    .index("by_device_timestamp", ["deviceId", "timestamp"]),

  // ============================================================================
  // Health Logs (Time Series)
  // ============================================================================
  healthLogs: defineTable({
    externalId: v.optional(v.string()), // Original Prisma UUID for migration
    patientId: v.string(), // Convex ID reference
    externalPatientId: v.optional(v.string()), // Original Prisma UUID for migration
    healthScore: v.number(),
    recordedAt: v.number(), // Unix timestamp
  })
    .index("by_patient_id", ["patientId"])
    .index("by_external_patient_id", ["externalPatientId"])
    .index("by_patient_recorded_at", ["patientId", "recordedAt"]),

  // ============================================================================
  // Messages (Caregiver → Patient)
  // ============================================================================
  messages: defineTable({
    caregiverId: v.string(), // Convex ID reference
    patientId: v.string(), // Convex ID reference
    subject: v.optional(v.string()),
    messageText: v.string(),
    isRead: v.boolean(),
    isUrgent: v.boolean(),
    sentAt: v.number(), // Unix timestamp
    readAt: v.optional(v.number()), // Unix timestamp, set on read
  })
    .index("by_patient_id", ["patientId"])
    .index("by_caregiver_id", ["caregiverId"])
    .index("by_caregiver_patient", ["caregiverId", "patientId"]),
});
