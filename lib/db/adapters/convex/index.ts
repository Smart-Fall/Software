/**
 * Convex Database Adapter
 * Wraps all Convex repositories and implements IDatabaseAdapter interface
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

import { ConvexUserRepository } from './users';
import { ConvexSessionRepository } from './sessions';
import { ConvexPatientRepository } from './patients';
import { ConvexCaregiverRepository } from './caregivers';
import { ConvexCaregiverPatientRepository } from './caregiverPatients';
import { ConvexFallRepository } from './falls';
import { ConvexDeviceRepository } from './devices';
import { ConvexSensorDataRepository } from './sensorData';
import { ConvexDeviceStatusRepository } from './deviceStatus';
import { ConvexHealthLogRepository } from './healthLogs';
import { ConvexMessageRepository } from './messages';

/**
 * Convex adapter implementation
 * All repositories delegate to Convex HTTP API
 */
export class ConvexAdapter implements IDatabaseAdapter {
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
    this.users = new ConvexUserRepository();
    this.sessions = new ConvexSessionRepository();
    this.patients = new ConvexPatientRepository();
    this.caregivers = new ConvexCaregiverRepository();
    this.caregiverPatients = new ConvexCaregiverPatientRepository();
    this.falls = new ConvexFallRepository();
    this.devices = new ConvexDeviceRepository();
    this.sensorData = new ConvexSensorDataRepository();
    this.deviceStatus = new ConvexDeviceStatusRepository();
    this.healthLogs = new ConvexHealthLogRepository();
    this.messages = new ConvexMessageRepository();
  }
}
