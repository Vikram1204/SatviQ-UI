import { Injectable, inject } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { DatabaseState } from '../models/satviq.models';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  mimeType?: string;
}

export interface SatviQBackupPayload {
  version: number;
  app: string;
  timestamp: string;
  deviceId: string;
  deviceInfo?: string;
  data: DatabaseState;
}

const BACKUP_FILE_PREFIX = 'satviq_backup_';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {
  private googleAuth = inject(GoogleAuthService);

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.googleAuth.getAccessToken();
    if (!token) {
      throw new Error('Google Drive account is not connected or session expired. Please sign in again.');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  }

  /**
   * Upload a database backup snapshot to Google Drive appDataFolder space
   */
  async uploadBackup(payload: SatviQBackupPayload): Promise<DriveBackupFile> {
    const headers = await this.getAuthHeaders();
    const filename = `${BACKUP_FILE_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    const metadata = {
      name: filename,
      mimeType: 'application/json',
      parents: ['appDataFolder']
    };

    const fileContent = JSON.stringify(payload, null, 2);

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      close_delim;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&spaces=appDataFolder', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload backup to Google Drive: ${response.statusText} (${errorText})`);
    }

    const file: DriveBackupFile = await response.json();
    return file;
  }

  /**
   * List all backup files in Google Drive appDataFolder space
   */
  async listBackups(): Promise<DriveBackupFile[]> {
    const headers = await this.getAuthHeaders();
    const query = encodeURIComponent(`name contains '${BACKUP_FILE_PREFIX}' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,createdTime,size,mimeType)&orderBy=createdTime desc`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch backup list from Google Drive: ${response.statusText} (${errorText})`);
    }

    const res = await response.json();
    return res.files || [];
  }

  /**
   * Download and parse backup file from Google Drive
   */
  async downloadBackup(fileId: string): Promise<SatviQBackupPayload> {
    const headers = await this.getAuthHeaders();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download backup file (${fileId}) from Google Drive.`);
    }

    const payload: SatviQBackupPayload = await response.json();
    return payload;
  }

  /**
   * Delete backup file from Google Drive
   */
  async deleteBackup(fileId: string): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    return response.ok;
  }
}
