/**
 * Prisma Database Adapter
 * Wraps all Prisma repositories and implements IDatabaseAdapter interface
 */

import { IDatabaseAdapter } from '../base';
import { IUserRepository } from '../base';
import { ISessionRepository } from '../base';
import { IPatientRepository } from '../base';
import { ICaregiverRepository } from '../base';
import { ICaregiverPatientRepository } from '../base';
import { IFallRepository } from '../base';
import { IDeviceRepository } from '../base';
import { ISensorDataRepository } from '../base';
import { IDeviceStatusRepository } from '../base';
import { IHealthLogRepository } from '../base';
import { IMessageRepository } from '../base';

import { PrismaUserRepository } from './users';
import { PrismaSessionRepository } from './sessions';
import { PrismaPatientRepository } from './patients';
import { PrismaCaregiverRepository } from './caregivers';
import { PrismaCaregiverPatientRepository } from './caregiverPatients';
import { PrismaFallRepository } from './falls';
import { PrismaDeviceRepository } from './devices';
import { PrismaSensorDataRepository } from './sensorData';
import { PrismaDeviceStatusRepository } from './deviceStatus';
import { PrismaHealthLogRepository } from './healthLogs';
import { PrismaMessageRepository } from './messages';

/**
 * Prisma adapter implementation
 * All repositories delegate to Prisma ORM
 */
export class PrismaAdapter implements IDatabaseAdapter {
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

  constructor() {
    this.users = new PrismaUserRepository();
    this.sessions = new PrismaSessionRepository();
    this.patients = new PrismaPatientRepository();
    this.caregivers = new PrismaCaregiverRepository();
    this.caregiverPatients = new PrismaCaregiverPatientRepository();
    this.falls = new PrismaFallRepository();
    this.devices = new PrismaDeviceRepository();
    this.sensorData = new PrismaSensorDataRepository();
    this.deviceStatus = new PrismaDeviceStatusRepository();
    this.healthLogs = new PrismaHealthLogRepository();
    this.messages = new PrismaMessageRepository();
  }
}
