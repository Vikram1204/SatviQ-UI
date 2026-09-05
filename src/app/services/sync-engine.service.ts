import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db, SyncLog } from '../db/satviq-db';
import { GoogleDriveService, SatviQBackupPayload, DriveBackupFile } from './google-drive.service';
import { GoogleAuthService } from './google-auth.service';
import { DatabaseState, Farmer, Animal, AIRecord, PDRecord, CalvingRecord, BillRecord } from '../models/satviq.models';

export type BackupFrequency = 'off' | 'on_launch' | '2h' | '4h' | '6h' | '12h' | 'daily' | 'weekly' | 'monthly';

export interface BackupSettings {
  frequency: BackupFrequency;
  lastBackupTime?: string;
  lastSyncTime?: string;
  autoSyncOnLaunch: boolean;
}

const DEFAULT_SETTINGS: BackupSettings = {
  frequency: 'daily',
  autoSyncOnLaunch: true
};

@Injectable({
  providedIn: 'root'
})
export class SyncEngineService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private driveService = inject(GoogleDriveService);
  private googleAuth = inject(GoogleAuthService);

  isSyncing = signal<boolean>(false);
  lastSyncStatus = signal<string | null>(null);
  backupSettings = signal<BackupSettings>(DEFAULT_SETTINGS);
  syncLogs = signal<SyncLog[]>([]);

  private deviceId = '';

  constructor() {
    if (this.isBrowser) {
      this.initDeviceId();
      this.loadSettings();
      this.loadLogs();
    }
  }

  private async initDeviceId() {
    try {
      const rec = await db.settings.get('device_id');
      if (rec?.value) {
        this.deviceId = rec.value;
      } else {
        this.deviceId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        await db.settings.put({ key: 'device_id', value: this.deviceId });
      }
    } catch (e) {
      this.deviceId = 'DEV-WEB-APP';
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  async loadSettings(): Promise<BackupSettings> {
    try {
      const rec = await db.settings.get('backup_settings');
      if (rec?.value) {
        this.backupSettings.set({ ...DEFAULT_SETTINGS, ...rec.value });
      }
    } catch (e) {
      console.error('Failed to load backup settings:', e);
    }
    return this.backupSettings();
  }

  async saveSettings(settings: Partial<BackupSettings>) {
    const updated = { ...this.backupSettings(), ...settings };
    this.backupSettings.set(updated);
    await db.settings.put({ key: 'backup_settings', value: updated });
  }

  async loadLogs() {
    try {
      const logs = await db.syncLogs.orderBy('id').reverse().limit(20).toArray();
      this.syncLogs.set(logs);
    } catch (e) {
      console.error('Error loading sync logs:', e);
    }
  }

  private async addLog(type: 'backup' | 'restore' | 'sync', status: 'success' | 'failed' | 'in_progress', message: string, details?: any) {
    const log: SyncLog = {
      timestamp: new Date().toISOString(),
      type,
      status,
      message,
      details
    };
    await db.syncLogs.add(log);
    await this.loadLogs();
  }

  /**
   * Export all Dexie IndexedDB tables into DatabaseState object
   */
  async exportCurrentState(): Promise<DatabaseState> {
    return {
      farmers: await db.farmers.toArray(),
      animals: await db.animals.toArray(),
      ai: await db.ai.toArray(),
      pd: await db.pd.toArray(),
      calvings: await db.calvings.toArray(),
      bills: await db.bills.toArray()
    };
  }

  /**
   * Import DatabaseState object into Dexie IndexedDB tables
   */
  async importState(state: DatabaseState): Promise<void> {
    await db.transaction('rw', [db.farmers, db.animals, db.ai, db.pd, db.calvings, db.bills], async () => {
      await db.farmers.clear();
      await db.animals.clear();
      await db.ai.clear();
      await db.pd.clear();
      await db.calvings.clear();
      await db.bills.clear();

      if (state.farmers?.length) await db.farmers.bulkAdd(state.farmers);
      if (state.animals?.length) await db.animals.bulkAdd(state.animals);
      if (state.ai?.length) await db.ai.bulkAdd(state.ai);
      if (state.pd?.length) await db.pd.bulkAdd(state.pd);
      if (state.calvings?.length) await db.calvings.bulkAdd(state.calvings);
      if (state.bills?.length) await db.bills.bulkAdd(state.bills);
    });
  }

  /**
   * Perform manual or scheduled Google Drive Backup
   */
  async performBackup(): Promise<boolean> {
    if (this.isSyncing()) return false;
    this.isSyncing.set(true);
    this.lastSyncStatus.set('Backing up data to Google Drive...');
    await this.addLog('backup', 'in_progress', 'Started backup to Google Drive');

    try {
      const data = await this.exportCurrentState();
      const payload: SatviQBackupPayload = {
        version: 1,
        app: 'SatviQ',
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        deviceInfo: navigator.userAgent,
        data
      };

      const file = await this.driveService.uploadBackup(payload);
      const now = new Date().toISOString();
      await this.saveSettings({ lastBackupTime: now });

      // Automatically prune old backups, keeping only the 5 most recent
      await this.cleanOldBackups(5);

      this.lastSyncStatus.set(`Backup completed successfully at ${new Date().toLocaleTimeString()}`);
      await this.addLog('backup', 'success', `Backup file uploaded successfully (${file.name})`);
      this.isSyncing.set(false);
      return true;
    } catch (e: any) {
      const errorMsg = e?.message || 'Backup failed';
      this.lastSyncStatus.set(`Backup failed: ${errorMsg}`);
      await this.addLog('backup', 'failed', errorMsg);
      this.isSyncing.set(false);
      return false;
    }
  }

  /**
   * List available backups from Google Drive (auto-prunes backups beyond latest 5)
   */
  async getAvailableBackups(): Promise<DriveBackupFile[]> {
    await this.cleanOldBackups(5);
    return await this.driveService.listBackups();
  }

  /**
   * Restore database state from a specific Google Drive backup file
   */
  async restoreBackup(fileId: string): Promise<DatabaseState> {
    if (this.isSyncing()) throw new Error('Syncing in progress');
    this.isSyncing.set(true);
    this.lastSyncStatus.set('Downloading backup from Google Drive...');
    await this.addLog('restore', 'in_progress', `Downloading backup file ${fileId}`);

    try {
      const payload = await this.driveService.downloadBackup(fileId);
      if (!payload || !payload.data) {
        throw new Error('Downloaded backup payload is empty or invalid.');
      }

      await this.importState(payload.data);
      const now = new Date().toISOString();
      await this.saveSettings({ lastSyncTime: now });

      this.lastSyncStatus.set(`Database restored successfully from backup ${payload.timestamp}`);
      await this.addLog('restore', 'success', `Database restored successfully from ${payload.timestamp}`);
      this.isSyncing.set(false);
      return payload.data;
    } catch (e: any) {
      const errorMsg = e?.message || 'Restore failed';
      this.lastSyncStatus.set(`Restore failed: ${errorMsg}`);
      await this.addLog('restore', 'failed', errorMsg);
      this.isSyncing.set(false);
      throw e;
    }
  }

  /**
   * Dual-device Sync using Last-Write-Wins (LWW) per entity record
   */
  async syncTwoWay(): Promise<DatabaseState | null> {
    if (this.isSyncing()) return null;
    this.isSyncing.set(true);
    this.lastSyncStatus.set('Syncing with Google Drive...');
    await this.addLog('sync', 'in_progress', 'Started dual-device synchronization');

    try {
      // 1. Fetch remote backups list
      const remoteFiles = await this.driveService.listBackups();
      
      let remoteState: DatabaseState = {
        farmers: [], animals: [], ai: [], pd: [], calvings: [], bills: []
      };

      if (remoteFiles.length > 0) {
        const latestFile = remoteFiles[0];
        const payload = await this.driveService.downloadBackup(latestFile.id);
        if (payload?.data) {
          remoteState = payload.data;
        }
      }

      // 2. Export local state
      const localState = await this.exportCurrentState();

      // 3. Perform LWW merge across all entities
      const mergedState: DatabaseState = {
        farmers: this.mergeLWW(localState.farmers, remoteState.farmers),
        animals: this.mergeLWW(localState.animals, remoteState.animals),
        ai: this.mergeLWW(localState.ai, remoteState.ai),
        pd: this.mergeLWW(localState.pd, remoteState.pd),
        calvings: this.mergeLWW(localState.calvings, remoteState.calvings),
        bills: this.mergeLWW(localState.bills, remoteState.bills)
      };

      // 4. Save merged result locally into Dexie
      await this.importState(mergedState);

      // 5. Upload merged state to Google Drive as new snapshot
      const payload: SatviQBackupPayload = {
        version: 1,
        app: 'SatviQ',
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        deviceInfo: navigator.userAgent,
        data: mergedState
      };
      await this.driveService.uploadBackup(payload);

      // Automatically prune old backups, keeping only the 5 most recent
      await this.cleanOldBackups(5);

      const now = new Date().toISOString();
      await this.saveSettings({ lastSyncTime: now, lastBackupTime: now });

      this.lastSyncStatus.set(`Sync completed successfully at ${new Date().toLocaleTimeString()}`);
      await this.addLog('sync', 'success', 'Dual-device synchronization complete');
      this.isSyncing.set(false);

      return mergedState;
    } catch (e: any) {
      const errorMsg = e?.message || 'Sync failed';
      this.lastSyncStatus.set(`Sync failed: ${errorMsg}`);
      await this.addLog('sync', 'failed', errorMsg);
      this.isSyncing.set(false);
      return null;
    }
  }

  /**
   * Automatically prune old backups on Google Drive, keeping only the 5 most recent.
   */
  async cleanOldBackups(maxToKeep: number = 5): Promise<number> {
    try {
      const files = await this.driveService.listBackups();
      if (files.length > maxToKeep) {
        const toDelete = files.slice(maxToKeep);
        let deletedCount = 0;
        for (const file of toDelete) {
          try {
            const success = await this.driveService.deleteBackup(file.id);
            if (success) deletedCount++;
          } catch (e) {
            console.error(`Failed to delete old backup file ${file.id}:`, e);
          }
        }
        if (deletedCount > 0) {
          await this.addLog('backup', 'success', `Auto-cleaned ${deletedCount} older backup(s) to maintain max limit of ${maxToKeep}`);
        }
        return deletedCount;
      }
    } catch (e) {
      console.error('Error while cleaning old backups:', e);
    }
    return 0;
  }

  /**
   * Last-Write-Wins (LWW) array merger matching items by `id` and comparing `updated` timestamp
   */
  private mergeLWW<T extends { id: string; updated?: string }>(localList: T[] = [], remoteList: T[] = []): T[] {
    const map = new Map<string, T>();

    // Put all local records
    for (const item of localList) {
      map.set(item.id, item);
    }

    // Compare with remote records
    for (const remoteItem of remoteList) {
      const existingLocal = map.get(remoteItem.id);
      if (!existingLocal) {
        map.set(remoteItem.id, remoteItem);
      } else {
        const localTime = new Date(existingLocal.updated || 0).getTime();
        const remoteTime = new Date(remoteItem.updated || 0).getTime();
        if (remoteTime > localTime) {
          map.set(remoteItem.id, remoteItem);
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Auto-check if periodic backup is due
   */
  async checkAndAutoBackup() {
    if (!this.googleAuth.isLoggedIn()) return;

    const settings = await this.loadSettings();
    if (settings.frequency === 'off') return;

    const lastBackup = settings.lastBackupTime ? new Date(settings.lastBackupTime).getTime() : 0;
    const now = Date.now();
    const hoursElapsed = (now - lastBackup) / (1000 * 60 * 60);

    let isDue = false;
    if (settings.frequency === 'on_launch') isDue = true;
    else if (settings.frequency === '2h' && hoursElapsed >= 2) isDue = true;
    else if (settings.frequency === '4h' && hoursElapsed >= 4) isDue = true;
    else if (settings.frequency === '6h' && hoursElapsed >= 6) isDue = true;
    else if (settings.frequency === '12h' && hoursElapsed >= 12) isDue = true;
    else if (settings.frequency === 'daily' && hoursElapsed >= 24) isDue = true;
    else if (settings.frequency === 'weekly' && hoursElapsed >= 168) isDue = true;
    else if (settings.frequency === 'monthly' && hoursElapsed >= 720) isDue = true;

    if (isDue) {
      if (settings.autoSyncOnLaunch) {
        await this.syncTwoWay();
      } else {
        await this.performBackup();
      }
    }
  }
}
