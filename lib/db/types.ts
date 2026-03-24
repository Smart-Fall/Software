/**
 * Shared Type Definitions
 * Database-agnostic interfaces used by both Prisma and Convex adapters
 */

// ============================================================================
// User Models
// ============================================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  accountType: "user" | "caregiver" | "admin";
  firstName?: string;
  lastName?: string;
  dob?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId?: string;
  sessionToken: string;
  createdAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// Patient & Caregiver Models
// ============================================================================

export interface Patient {
  id: string;
  userId: string;
  riskScore: number;
  isHighRisk: boolean;
  medicalConditions?: string;
  createdAt: Date;
  user?: User;
  caregiverPatients?: CaregiverPatient[];
}

export interface Caregiver {
  id: string;
  userId: string;
  facilityName?: string;
  specialization?: string;
  yearsOfExperience?: number;
  createdAt: Date;
  user?: User;
}

export interface CaregiverPatient {
  id: string;
  caregiverId: string;
  patientId: string;
  assignedDate: Date;
  isActive: boolean;
  caregiver?: Caregiver;
  patient?: Patient;
}

// ============================================================================
// Health Data Models
// ============================================================================

export interface Fall {
  id: string;
  patientId?: string;
  deviceId?: string;
  fallDatetime: Date;
  confidenceScore?: number;
  confidenceLevel?: string;
  sosTriggered: boolean;
  severity?: string;
  location?: string;
  wasInjured?: boolean;
  notes?: string;
  batteryLevel?: number;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  patient?: Patient;
  device?: Device;
}

export interface HealthLog {
  id: string;
  patientId: string;
  healthScore: number;
  recordedAt: Date;
  patient?: Patient;
}

export interface Device {
  id: string;
  deviceId: string; // hardware identifier (e.g., ESP32 MAC address)
  patientId?: string;
  deviceName?: string;
  isActive: boolean;
  isMuted: boolean;
  lastSeen?: Date;
  batteryLevel?: number;
  firmwareVersion?: string;
  createdAt: Date;
  patient?: Patient;
}

export interface SensorData {
  id: string;
  deviceId: string;
  timestamp: Date;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure?: number;
  fsr?: number;
  device?: Device;
}

export interface DeviceStatus {
  id: string;
  deviceId: string;
  timestamp: Date;
  batteryPercentage: number;
  wifiConnected: boolean;
  bluetoothConnected: boolean;
  sensorsInitialized: boolean;
  uptimeMs: bigint;
  currentStatus?: string;
  device?: Device;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  device?: Device;
}

export interface Message {
  id: string;
  caregiverId: string;
  patientId: string;
  subject?: string;
  messageText: string;
  isRead: boolean;
  isUrgent: boolean;
  sentAt: Date;
  readAt?: Date;
  caregiver?: Caregiver;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

// ============================================================================
// Query Options
// ============================================================================

export interface FindOptions<TModel = Record<string, unknown>> {
  where?: Partial<TModel> | Record<string, unknown>;
  include?: Record<string, boolean>;
  select?:
    | Partial<Record<Extract<keyof TModel, string>, boolean>>
    | Record<string, boolean>;
  orderBy?:
    | Partial<Record<Extract<keyof TModel, string>, "asc" | "desc">>
    | Record<string, "asc" | "desc">;
  skip?: number;
  take?: number;
}

export interface CreateOptions {
  data: Record<string, JsonValue>;
}

export interface UpdateOptions {
  where: Record<string, JsonValue>;
  data: Record<string, JsonValue>;
}
