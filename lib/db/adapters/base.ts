/**
 * Base Repository Interfaces
 * Define the contract that both Prisma and Convex adapters must implement
 */

import {
  User,
  Session,
  Patient,
  Caregiver,
  CaregiverPatient,
  Fall,
  HealthLog,
  Device,
  SensorData,
  DeviceStatus,
  Message,
  FindOptions,
} from "../types";

// ============================================================================
// User Repository
// ============================================================================

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: {
    email: string;
    passwordHash: string;
    accountType: "user" | "caregiver" | "admin";
    firstName?: string;
    lastName?: string;
    dob?: Date;
  }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  findAll(options?: FindOptions<User>): Promise<User[]>;
  count(): Promise<number>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// Session Repository
// ============================================================================

export interface ISessionRepository {
  create(data: {
    userId: string;
    sessionToken: string;
    expiresAt?: Date;
  }): Promise<Session>;
  findByToken(sessionToken: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  deleteByToken(sessionToken: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>; // Returns count of deleted records
}

// ============================================================================
// Patient Repository
// ============================================================================

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findMany(options?: FindOptions<Patient>): Promise<Patient[]>;
  findByCaregiverId(caregiverId: string): Promise<Patient[]>;
  create(data: {
    userId: string;
    riskScore?: number;
    isHighRisk?: boolean;
    medicalConditions?: string;
  }): Promise<Patient>;
  update(id: string, data: Partial<Patient>): Promise<Patient>;
  count(): Promise<number>;
}

// ============================================================================
// Caregiver Repository
// ============================================================================

export interface ICaregiverRepository {
  findById(id: string): Promise<Caregiver | null>;
  findByUserId(userId: string): Promise<Caregiver | null>;
  create(data: {
    userId: string;
    facilityName?: string;
    specialization?: string;
    yearsOfExperience?: number;
  }): Promise<Caregiver>;
  update(id: string, data: Partial<Caregiver>): Promise<Caregiver>;
  findMany(options?: FindOptions<Caregiver>): Promise<Caregiver[]>;
  count(): Promise<number>;
}

// ============================================================================
// CaregiverPatient Repository
// ============================================================================

export interface ICaregiverPatientRepository {
  create(data: {
    caregiverId: string;
    patientId: string;
    isActive?: boolean;
  }): Promise<CaregiverPatient>;
  findByCaregiverId(caregiverId: string): Promise<CaregiverPatient[]>;
  findByPatientId(patientId: string): Promise<CaregiverPatient[]>;
  findByIds(
    caregiverId: string,
    patientId: string,
  ): Promise<CaregiverPatient | null>;
  update(
    caregiverId: string,
    patientId: string,
    data: Partial<CaregiverPatient>,
  ): Promise<CaregiverPatient>;
  delete(caregiverId: string, patientId: string): Promise<void>;
}

// ============================================================================
// Fall Repository
// ============================================================================

export interface IFallRepository {
  create(data: {
    patientId?: string;
    deviceId?: string;
    fallDatetime: Date;
    confidenceScore?: number;
    confidenceLevel?: string;
    sosTriggered?: boolean;
    severity?: string;
    location?: string;
    wasInjured?: boolean;
    notes?: string;
    batteryLevel?: number;
  }): Promise<Fall>;
  findById(id: string): Promise<Fall | null>;
  findMany(options?: FindOptions<Fall>): Promise<Fall[]>;
  findByPatientId(patientId: string): Promise<Fall[]>;
  findByDeviceId(deviceId: string): Promise<Fall[]>;
  findRecent(limit: number): Promise<Fall[]>;
  findUnresolved(): Promise<Fall[]>;
  update(id: string, data: Partial<Fall>): Promise<Fall>;
  count(): Promise<number>;
}

// ============================================================================
// Device Repository
// ============================================================================

export interface IDeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByDeviceId(deviceId: string): Promise<Device | null>;
  findByPatientId(patientId: string): Promise<Device[]>;
  findMany(options?: FindOptions<Device>): Promise<Device[]>;
  create(data: {
    deviceId: string;
    patientId?: string;
    deviceName?: string;
    isActive?: boolean;
    batteryLevel?: number;
    firmwareVersion?: string;
  }): Promise<Device>;
  update(id: string, data: Partial<Device>): Promise<Device>;
  updateByDeviceId(deviceId: string, data: Partial<Device>): Promise<Device>;
  count(): Promise<number>;
}

// ============================================================================
// SensorData Repository
// ============================================================================

export interface ISensorDataRepository {
  findById(id: string): Promise<SensorData | null>;
  findByDeviceId(
    deviceId: string,
    options?: FindOptions<SensorData>,
  ): Promise<SensorData[]>;
  findRecent(deviceId: string, limit: number): Promise<SensorData[]>;
  create(data: {
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
  }): Promise<SensorData>;
  findBetween(
    deviceId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<SensorData[]>;
}

// ============================================================================
// DeviceStatus Repository
// ============================================================================

export interface IDeviceStatusRepository {
  findById(id: string): Promise<DeviceStatus | null>;
  findByDeviceId(
    deviceId: string,
    options?: FindOptions<DeviceStatus>,
  ): Promise<DeviceStatus[]>;
  findRecent(deviceId: string, limit: number): Promise<DeviceStatus[]>;
  findLatest(deviceId: string): Promise<DeviceStatus | null>;
  create(data: {
    deviceId: string;
    timestamp: Date;
    batteryPercentage: number;
    wifiConnected: boolean;
    bluetoothConnected: boolean;
    sensorsInitialized: boolean;
    uptimeMs: bigint;
    currentStatus?: string;
  }): Promise<DeviceStatus>;
}

// ============================================================================
// HealthLog Repository
// ============================================================================

export interface IHealthLogRepository {
  create(data: {
    patientId: string;
    healthScore: number;
    recordedAt?: Date;
  }): Promise<HealthLog>;
  findById(id: string): Promise<HealthLog | null>;
  findByPatientId(
    patientId: string,
    options?: FindOptions<HealthLog>,
  ): Promise<HealthLog[]>;
  findRecent(patientId: string, limit: number): Promise<HealthLog[]>;
  findBetween(
    patientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HealthLog[]>;
  update(id: string, data: Partial<HealthLog>): Promise<HealthLog>;
}

// ============================================================================
// Message Repository
// ============================================================================

export interface IMessageRepository {
  create(data: {
    caregiverId: string;
    patientId: string;
    subject?: string;
    messageText: string;
    isUrgent?: boolean;
  }): Promise<Message>;
  findByPatientId(patientId: string): Promise<Message[]>;
  findByCaregiverAndPatient(
    caregiverId: string,
    patientId: string,
  ): Promise<Message[]>;
  getUnreadCount(patientId: string): Promise<number>;
  markAsRead(messageId: string, patientId: string): Promise<Message>;
}

// ============================================================================
// Main Database Adapter Interface
// ============================================================================

export interface IDatabaseAdapter {
  users: IUserRepository;
  sessions: ISessionRepository;
  patients: IPatientRepository;
  caregivers: ICaregiverRepository;
  caregiverPatients: ICaregiverPatientRepository;
  falls: IFallRepository;
  devices: IDeviceRepository;
  sensorData: ISensorDataRepository;
  deviceStatus: IDeviceStatusRepository;
  healthLogs: IHealthLogRepository;
  messages: IMessageRepository;
}
