import Dexie, { Table } from 'dexie';
import { Farmer, Animal, AIRecord, PDRecord, CalvingRecord, BillRecord, UserApp, RoleApp } from '../models/satviq.models';

export interface AppSetting {
  key: string;
  value: any;
}

export interface SyncLog {
  id?: number;
  timestamp: string;
  type: 'backup' | 'restore' | 'sync';
  status: 'success' | 'failed' | 'in_progress';
  message: string;
  details?: any;
}

export class SatviQDatabase extends Dexie {
  farmers!: Table<Farmer, string>;
  animals!: Table<Animal, string>;
  ai!: Table<AIRecord, string>;
  pd!: Table<PDRecord, string>;
  calvings!: Table<CalvingRecord, string>;
  bills!: Table<BillRecord, string>;
  settings!: Table<AppSetting, string>;
  syncLogs!: Table<SyncLog, number>;
  users!: Table<UserApp, string>;
  roles!: Table<RoleApp, string>;

  constructor() {
    super('SatviQDatabase');

    // Define table schemas and indexes
    this.version(1).stores({
      farmers: 'id, name, mobile, village, updated',
      animals: 'id, farmer, tag, species, pregnant, due, status, updated',
      ai: 'id, animal, date, updated',
      pd: 'id, animal, date, result, updated',
      calvings: 'id, mother, date, tag, updated',
      bills: 'id, billno, farmer, date, payment, updated',
      settings: 'key',
      syncLogs: '++id, timestamp, type, status',
      users: 'id, username, roleId, status, updated',
      roles: 'id, name, updated'
    });
  }
}

export const db = new SatviQDatabase();
