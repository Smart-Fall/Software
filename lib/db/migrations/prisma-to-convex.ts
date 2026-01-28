/**
 * Migration Script: Prisma PostgreSQL → Convex
 *
 * This script migrates data from Prisma (PostgreSQL) to Convex.
 * It maintains ID mappings for data correlation during and after migration.
 *
 * USAGE:
 *   npx ts-node --project tsconfig.json lib/db/migrations/prisma-to-convex.ts
 *
 * REQUIREMENTS:
 *   - Both Prisma and Convex databases must be accessible
 *   - Convex schema must be deployed (via 'npx convex deploy')
 *   - PostgreSQL connection via DATABASE_URL
 *   - Convex deployment via NEXT_PUBLIC_CONVEX_URL
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import prisma from '@/lib/prisma';

let idMappings = {
  users: new Map<string, string>(),
  patients: new Map<string, string>(),
  caregivers: new Map<string, string>(),
  devices: new Map<string, string>(),
  falls: new Map<string, string>(),
};

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}

const client = new ConvexHttpClient(convexUrl);

/**
 * Migrate users from Prisma to Convex
 */
async function migrateUsers(): Promise<void> {
  console.log('📤 Migrating users...');

  const prismaUsers = await prisma.user.findMany();
  console.log(`   Found ${prismaUsers.length} users`);

  for (const user of prismaUsers) {
    try {
      const convexId = await client.mutation(api.users.create, {
        email: user.email,
        passwordHash: user.passwordHash,
        accountType: user.accountType as 'user' | 'caregiver',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        dob: user.dob ? user.dob.getTime() : undefined,
      });

      idMappings.users.set(user.id, convexId as string);
      console.log(`   ✓ User ${user.email}`);
    } catch (error) {
      console.error(`   ✗ Error migrating user ${user.email}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate patients from Prisma to Convex
 */
async function migratePatients(): Promise<void> {
  console.log('📤 Migrating patients...');

  const prismaPatients = await prisma.patient.findMany();
  console.log(`   Found ${prismaPatients.length} patients`);

  for (const patient of prismaPatients) {
    try {
      const userConvexId = idMappings.users.get(patient.userId);
      if (!userConvexId) {
        throw new Error(`User ID mapping not found for patient ${patient.id}`);
      }

      const convexId = await client.mutation(api.patients.create, {
        userId: userConvexId as any,
        riskScore: patient.riskScore,
        isHighRisk: patient.isHighRisk,
        medicalConditions: patient.medicalConditions || undefined,
      });

      idMappings.patients.set(patient.id, convexId as string);
      console.log(`   ✓ Patient ${patient.id}`);
    } catch (error) {
      console.error(`   ✗ Error migrating patient ${patient.id}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate caregivers from Prisma to Convex
 */
async function migrateCaregiversTable(): Promise<void> {
  console.log('📤 Migrating caregivers...');

  const prismaCaregivers = await prisma.caregiver.findMany();
  console.log(`   Found ${prismaCaregivers.length} caregivers`);

  for (const caregiver of prismaCaregivers) {
    try {
      const userConvexId = idMappings.users.get(caregiver.userId);
      if (!userConvexId) {
        throw new Error(`User ID mapping not found for caregiver ${caregiver.id}`);
      }

      const convexId = await client.mutation(api.caregivers.create, {
        userId: userConvexId as any,
        specialization: caregiver.specialization || undefined,
        yearsOfExperience: caregiver.yearsOfExperience || undefined,
      });

      idMappings.caregivers.set(caregiver.id, convexId as string);
      console.log(`   ✓ Caregiver ${caregiver.id}`);
    } catch (error) {
      console.error(`   ✗ Error migrating caregiver ${caregiver.id}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate devices from Prisma to Convex
 */
async function migrateDevices(): Promise<void> {
  console.log('📤 Migrating devices...');

  const prismaDevices = await prisma.device.findMany();
  console.log(`   Found ${prismaDevices.length} devices`);

  for (const device of prismaDevices) {
    try {
      const patientConvexId = device.patientId ? idMappings.patients.get(device.patientId) : undefined;

      const convexId = await client.mutation(api.devices.create, {
        deviceId: device.deviceId,
        patientId: patientConvexId as any,
        deviceName: device.deviceName || undefined,
        isActive: device.isActive,
        batteryLevel: device.batteryLevel || undefined,
        firmwareVersion: device.firmwareVersion || undefined,
      });

      idMappings.devices.set(device.id, convexId as string);
      console.log(`   ✓ Device ${device.deviceId}`);
    } catch (error) {
      console.error(`   ✗ Error migrating device ${device.deviceId}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate falls from Prisma to Convex
 */
async function migrateFalls(): Promise<void> {
  console.log('📤 Migrating falls...');

  const prismaFalls = await prisma.fall.findMany();
  console.log(`   Found ${prismaFalls.length} falls`);

  for (const fall of prismaFalls) {
    try {
      const patientConvexId = fall.patientId ? idMappings.patients.get(fall.patientId) : undefined;
      const deviceConvexId = fall.deviceId ? idMappings.devices.get(fall.deviceId) : undefined;

      const convexId = await client.mutation(api.falls.create, {
        patientId: patientConvexId as any,
        deviceId: deviceConvexId as any,
        fallDatetime: fall.fallDatetime.getTime(),
        confidenceScore: fall.confidenceScore || undefined,
        confidenceLevel: fall.confidenceLevel || undefined,
        sosTriggered: fall.sosTriggered,
        severity: fall.severity || undefined,
        location: fall.location || undefined,
        wasInjured: fall.wasInjured || undefined,
        notes: fall.notes || undefined,
        batteryLevel: fall.batteryLevel || undefined,
      });

      idMappings.falls.set(fall.id, convexId as string);
      console.log(`   ✓ Fall ${fall.id}`);
    } catch (error) {
      console.error(`   ✗ Error migrating fall ${fall.id}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate caregiver-patient assignments
 */
async function migrateCaregiverPatients(): Promise<void> {
  console.log('📤 Migrating caregiver-patient assignments...');

  const assignments = await prisma.caregiverPatient.findMany();
  console.log(`   Found ${assignments.length} assignments`);

  for (const assignment of assignments) {
    try {
      const caregiverConvexId = idMappings.caregivers.get(assignment.caregiverId);
      const patientConvexId = idMappings.patients.get(assignment.patientId);

      if (!caregiverConvexId || !patientConvexId) {
        throw new Error(
          `ID mappings not found for assignment ${assignment.id}`
        );
      }

      await client.mutation(api.caregiverPatients.create, {
        caregiverId: caregiverConvexId as any,
        patientId: patientConvexId as any,
        isActive: assignment.isActive,
      });

      console.log(`   ✓ Assignment ${assignment.id}`);
    } catch (error) {
      console.error(`   ✗ Error migrating assignment ${assignment.id}:`, error);
      throw error;
    }
  }
}

/**
 * Migrate sensor data from Prisma to Convex
 */
async function migrateSensorData(): Promise<void> {
  console.log('📤 Migrating sensor data...');

  const sensorDataRecords = await prisma.sensorData.findMany({
    orderBy: { timestamp: 'asc' },
  });
  console.log(`   Found ${sensorDataRecords.length} sensor data records`);

  // Batch migrate sensor data (in groups of 100)
  for (let i = 0; i < sensorDataRecords.length; i += 100) {
    const batch = sensorDataRecords.slice(i, Math.min(i + 100, sensorDataRecords.length));

    try {
      for (const record of batch) {
        const deviceConvexId = idMappings.devices.get(record.deviceId);
        if (!deviceConvexId) {
          throw new Error(`Device ID mapping not found for sensor data ${record.id}`);
        }

        await client.mutation(api.sensorData.create, {
          deviceId: deviceConvexId as any,
          timestamp: record.timestamp.getTime(),
          accelX: record.accelX,
          accelY: record.accelY,
          accelZ: record.accelZ,
          gyroX: record.gyroX,
          gyroY: record.gyroY,
          gyroZ: record.gyroZ,
          pressure: record.pressure || undefined,
        });
      }

      console.log(`   ✓ Migrated records ${i} - ${Math.min(i + 100, sensorDataRecords.length)}`);
    } catch (error) {
      console.error(`   ✗ Error migrating sensor data batch:`, error);
      throw error;
    }
  }
}

/**
 * Migrate device status from Prisma to Convex
 */
async function migrateDeviceStatus(): Promise<void> {
  console.log('📤 Migrating device status...');

  const statusRecords = await prisma.deviceStatus.findMany({
    orderBy: { timestamp: 'asc' },
  });
  console.log(`   Found ${statusRecords.length} device status records`);

  // Batch migrate device status (in groups of 100)
  for (let i = 0; i < statusRecords.length; i += 100) {
    const batch = statusRecords.slice(i, Math.min(i + 100, statusRecords.length));

    try {
      for (const record of batch) {
        const deviceConvexId = idMappings.devices.get(record.deviceId);
        if (!deviceConvexId) {
          throw new Error(`Device ID mapping not found for device status ${record.id}`);
        }

        await client.mutation(api.deviceStatus.create, {
          deviceId: deviceConvexId as any,
          timestamp: record.timestamp.getTime(),
          batteryPercentage: record.batteryPercentage,
          wifiConnected: record.wifiConnected,
          bluetoothConnected: record.bluetoothConnected,
          sensorsInitialized: record.sensorsInitialized,
          uptimeMs: Number(record.uptimeMs),
          currentStatus: record.currentStatus || undefined,
        });
      }

      console.log(`   ✓ Migrated records ${i} - ${Math.min(i + 100, statusRecords.length)}`);
    } catch (error) {
      console.error(`   ✗ Error migrating device status batch:`, error);
      throw error;
    }
  }
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  console.log('🚀 Starting Prisma → Convex Migration\n=====================================\n');

  try {
    // Migrate in dependency order
    await migrateUsers();
    await migratePatients();
    await migrateCaregiversTable();
    await migrateDevices();
    await migrateFalls();
    await migrateCaregiverPatients();
    await migrateSensorData();
    await migrateDeviceStatus();

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: ${idMappings.users.size}`);
    console.log(`   Patients: ${idMappings.patients.size}`);
    console.log(`   Caregivers: ${idMappings.caregivers.size}`);
    console.log(`   Devices: ${idMappings.devices.size}`);
    console.log(`   Falls: ${idMappings.falls.size}`);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMigration, idMappings };
