import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleDriveService, DriveBackupFile } from '../../services/google-drive.service';
import { SyncEngineService, BackupFrequency } from '../../services/sync-engine.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  googleAuth = inject(GoogleAuthService);
  driveService = inject(GoogleDriveService);
  syncEngine = inject(SyncEngineService);
  dataService = inject(DataService);

  customClientId = '';
  showClientIdEdit = false;

  availableBackups = signal<DriveBackupFile[]>([]);
  isLoadingBackups = signal<boolean>(false);
  restoringFileId = signal<string | null>(null);

  ngOnInit() {
    this.customClientId = this.googleAuth.clientId();
  }

  async saveClientId() {
    if (this.customClientId.trim()) {
      await this.googleAuth.setClientId(this.customClientId.trim());
      this.dataService.showToast('Google OAuth Client ID updated.');
      this.showClientIdEdit = false;
    }
  }

  async connectGoogle() {
    const success = await this.googleAuth.loginWithGoogle();
    if (success) {
      this.dataService.showToast('Successfully connected Google Account!');
      await this.syncEngine.checkAndAutoBackup();
    } else {
      this.dataService.showToast('Google Sign-In failed or was cancelled.');
    }
  }

  async disconnectGoogle() {
    if (confirm('Are you sure you want to disconnect your Google Account? Automated cloud backups will be disabled.')) {
      await this.googleAuth.logout();
      this.availableBackups.set([]);
      this.dataService.showToast('Google Account disconnected.');
    }
  }

  async updateFrequency(event: Event) {
    const target = event.target as HTMLSelectElement;
    const freq = target.value as BackupFrequency;
    await this.syncEngine.saveSettings({ frequency: freq });
    this.dataService.showToast(`Backup frequency updated to ${freq}.`);
  }

  async toggleAutoSync(event: Event) {
    const target = event.target as HTMLInputElement;
    await this.syncEngine.saveSettings({ autoSyncOnLaunch: target.checked });
    this.dataService.showToast(`Auto-sync on launch set to ${target.checked ? 'Enabled' : 'Disabled'}.`);
  }

  async triggerBackup() {
    const success = await this.syncEngine.performBackup();
    if (success) {
      this.dataService.showToast('Backup created and saved to Google Drive!');
      if (this.availableBackups().length > 0) {
        await this.loadBackups();
      }
    }
  }

  async triggerSync() {
    const result = await this.syncEngine.syncTwoWay();
    if (result) {
      await this.dataService.reloadFromDB();
      this.dataService.showToast('Two-way sync completed successfully!');
    }
  }

  async loadBackups() {
    this.isLoadingBackups.set(true);
    try {
      const files = await this.syncEngine.getAvailableBackups();
      this.availableBackups.set(files);
    } catch (e: any) {
      this.dataService.showToast(e?.message || 'Failed to list backups');
    } finally {
      this.isLoadingBackups.set(false);
    }
  }

  async confirmRestore(file: DriveBackupFile) {
    const dateStr = new Date(file.createdTime).toLocaleString();
    if (confirm(`RESTORE WARNING:\nAre you sure you want to restore the backup from ${dateStr}?\n\nThis will replace your current local database records with the backup file data.`)) {
      this.restoringFileId.set(file.id);
      try {
        await this.syncEngine.restoreBackup(file.id);
        await this.dataService.reloadFromDB();
        this.dataService.showToast('Database successfully restored from Google Drive backup!');
      } catch (e: any) {
        this.dataService.showToast(e?.message || 'Restore failed.');
      } finally {
        this.restoringFileId.set(null);
      }
    }
  }
}
