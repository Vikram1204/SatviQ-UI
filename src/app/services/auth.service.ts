import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db } from '../db/satviq-db';
import { UserApp, RoleApp } from '../models/satviq.models';
import { hashPassword } from '../utils/crypto.utils';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  roleId: string;
  roleName: string;
}

export const ALL_SCREEN_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'farmers', label: 'Farmers Registry' },
  { id: 'cattle', label: 'Cattle Herd Directory' },
  { id: 'ai', label: 'AI / Insemination Tracking' },
  { id: 'pd', label: 'PD Diagnosis' },
  { id: 'pregnancy', label: 'Pregnancy Care' },
  { id: 'calving', label: 'Calving Registry' },
  { id: 'family-tree', label: 'Pedigree Family Tree' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'bills', label: 'Bills & Invoices' },
  { id: 'sms', label: 'SMS & WhatsApp Messenger' },
  { id: 'settings', label: 'Cloud Backup & Settings' },
  { id: 'user-management', label: 'User & Role Administration' }
];

const DEFAULT_ADMIN_ROLE: RoleApp = {
  id: 'ROLE-ADMIN',
  name: 'Admin',
  description: 'Full system administrative access',
  permissions: ALL_SCREEN_PERMISSIONS.map(p => p.id),
  isSystem: true,
  created: new Date().toISOString(),
  updated: new Date().toISOString()
};

const DEFAULT_DOCTOR_ROLE: RoleApp = {
  id: 'ROLE-DOCTOR',
  name: 'Doctor / AI Expert',
  description: 'Standard veterinary clinical & herd management access',
  permissions: ['dashboard', 'farmers', 'cattle', 'ai', 'pd', 'pregnancy', 'calving', 'family-tree', 'reports', 'bills', 'sms', 'settings'],
  isSystem: false,
  created: new Date().toISOString(),
  updated: new Date().toISOString()
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  currentUser = signal<UserApp | null>(null);
  currentRole = signal<RoleApp | null>(null);

  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => {
    const role = this.currentRole();
    if (!role) return false;
    return role.id === 'ROLE-ADMIN' || role.permissions.includes('all');
  });
  user = computed(() => {
    const u = this.currentUser();
    const r = this.currentRole();
    if (!u) return null;
    return {
      username: u.username,
      name: u.name,
      role: r ? r.name : 'User'
    };
  });

  constructor() {
    if (this.isBrowser) {
      this.initDefaultData().then(() => {
        this.loadSessionFromStorage();
      });
    }
  }

  async initDefaultData() {
    try {
      const roleCount = await db.roles.count();
      if (roleCount === 0) {
        await db.roles.bulkAdd([DEFAULT_ADMIN_ROLE, DEFAULT_DOCTOR_ROLE]);
      }

      const userCount = await db.users.count();
      if (userCount === 0) {
        const adminHash = await hashPassword('admin');
        const defaultAdmin: UserApp = {
          id: 'USER-ADMIN',
          username: 'admin',
          passwordHash: adminHash,
          name: 'Administrator',
          roleId: 'ROLE-ADMIN',
          status: 'Active',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        await db.users.add(defaultAdmin);
      }
    } catch (e) {
      console.error('Error initializing default auth data:', e);
    }
  }

  private async loadSessionFromStorage() {
    try {
      const stored = localStorage.getItem('satviq_session_user_id');
      if (stored) {
        const u = await db.users.get(stored);
        if (u && u.status === 'Active') {
          const r = await db.roles.get(u.roleId);
          this.currentUser.set(u);
          this.currentRole.set(r || null);
        } else {
          localStorage.removeItem('satviq_session_user_id');
        }
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
    }
  }

  async login(usernameInput: string, passwordInput: string): Promise<{ success: boolean; message: string }> {
    if (!usernameInput || !passwordInput) {
      return { success: false, message: 'Please enter username and password.' };
    }

    try {
      const cleanUsername = usernameInput.trim().toLowerCase();
      const users = await db.users.toArray();
      const matchedUser = users.find(u => u.username.toLowerCase() === cleanUsername);

      if (!matchedUser) {
        return { success: false, message: 'Invalid username or password.' };
      }

      if (matchedUser.status !== 'Active') {
        return { success: false, message: 'This user account has been deactivated.' };
      }

      const inputHash = await hashPassword(passwordInput);
      if (matchedUser.passwordHash !== inputHash) {
        return { success: false, message: 'Invalid username or password.' };
      }

      const role = await db.roles.get(matchedUser.roleId);

      this.currentUser.set(matchedUser);
      this.currentRole.set(role || null);

      if (this.isBrowser) {
        localStorage.setItem('satviq_session_user_id', matchedUser.id);
      }

      return { success: true, message: 'Login successful' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Login failed due to database error.' };
    }
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentRole.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('satviq_session_user_id');
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = this.currentUser();
    if (!user) return { success: false, message: 'No active session.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    const oldHash = await hashPassword(oldPassword);
    if (user.passwordHash !== oldHash) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const newHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    const updatedUser: UserApp = {
      ...user,
      passwordHash: newHash,
      updated: now
    };

    await db.users.put(updatedUser);
    this.currentUser.set(updatedUser);

    return { success: true, message: 'Password updated successfully.' };
  }

  hasPermission(screenId: string): boolean {
    const user = this.currentUser();
    const role = this.currentRole();
    if (!user || !role) return false;
    if (role.id === 'ROLE-ADMIN' || role.permissions.includes('all')) return true;
    return role.permissions.includes(screenId);
  }
}
