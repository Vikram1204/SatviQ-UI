import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { db } from '../../db/satviq-db';
import { UserApp, RoleApp } from '../../models/satviq.models';
import { ALL_SCREEN_PERMISSIONS, AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { hashPassword } from '../../utils/crypto.utils';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  authService = inject(AuthService);
  dataService = inject(DataService);

  activeTab = signal<'users' | 'roles'>('users');

  users = signal<UserApp[]>([]);
  roles = signal<RoleApp[]>([]);
  allPermissions = ALL_SCREEN_PERMISSIONS;

  // User Form Modal
  isUserModalOpen = signal(false);
  editingUserId = signal<string | null>(null);
  userForm: Partial<UserApp> & { initialPassword?: string } = {
    username: '',
    name: '',
    roleId: 'ROLE-DOCTOR',
    status: 'Active',
    initialPassword: ''
  };

  // Reset Password Modal
  isResetPasswordModalOpen = signal(false);
  resetUserId = signal<string | null>(null);
  newResetPassword = '';

  // Role Form Modal
  isRoleModalOpen = signal(false);
  editingRoleId = signal<string | null>(null);
  roleForm: {
    name: string;
    description: string;
    permissions: string[];
  } = {
    name: '',
    description: '',
    permissions: ['dashboard', 'farmers', 'cattle']
  };

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const uList = await db.users.toArray();
      const rList = await db.roles.toArray();
      this.users.set(uList);
      this.roles.set(rList);
    } catch (e) {
      console.error('Failed to load user and role data:', e);
    }
  }

  getRoleName(roleId: string): string {
    const r = this.roles().find(x => x.id === roleId);
    return r ? r.name : roleId;
  }

  // --- USER ACTIONS ---
  openAddUserModal() {
    this.editingUserId.set(null);
    this.userForm = {
      username: '',
      name: '',
      roleId: this.roles().length > 0 ? this.roles()[0].id : 'ROLE-DOCTOR',
      status: 'Active',
      initialPassword: ''
    };
    this.isUserModalOpen.set(true);
  }

  editUser(u: UserApp) {
    this.editingUserId.set(u.id);
    this.userForm = {
      username: u.username,
      name: u.name,
      roleId: u.roleId,
      status: u.status,
      initialPassword: ''
    };
    this.isUserModalOpen.set(true);
  }

  async saveUser() {
    if (!this.userForm.username || !this.userForm.name || !this.userForm.roleId) {
      this.dataService.showToast('Username, Full Name, and Role selection are required.');
      return;
    }

    const editId = this.editingUserId();
    const now = new Date().toISOString();

    if (editId) {
      const existing = await db.users.get(editId);
      if (existing) {
        let newHash = existing.passwordHash;
        if (this.userForm.initialPassword && this.userForm.initialPassword.trim()) {
          newHash = await hashPassword(this.userForm.initialPassword.trim());
        }

        const updated: UserApp = {
          ...existing,
          name: this.userForm.name!,
          roleId: this.userForm.roleId!,
          status: this.userForm.status || 'Active',
          passwordHash: newHash,
          updated: now
        };
        await db.users.put(updated);
        this.dataService.showToast('User account updated.');
      }
    } else {
      if (!this.userForm.initialPassword || this.userForm.initialPassword.length < 4) {
        this.dataService.showToast('Initial password must be at least 4 characters long.');
        return;
      }

      // Check if username already exists
      const existingUser = this.users().find(u => u.username.toLowerCase() === this.userForm.username!.trim().toLowerCase());
      if (existingUser) {
        this.dataService.showToast(`Username "${this.userForm.username}" is already taken.`);
        return;
      }

      const pHash = await hashPassword(this.userForm.initialPassword.trim());
      const newUser: UserApp = {
        id: 'USER-' + Date.now().toString(36).toUpperCase(),
        username: this.userForm.username!.trim().toLowerCase(),
        passwordHash: pHash,
        name: this.userForm.name!,
        roleId: this.userForm.roleId!,
        status: this.userForm.status || 'Active',
        created: now,
        updated: now
      };
      await db.users.put(newUser);
      this.dataService.showToast('User account created successfully.');
    }

    this.isUserModalOpen.set(false);
    await this.loadData();
  }

  async toggleUserStatus(u: UserApp) {
    if (u.id === 'USER-ADMIN') {
      this.dataService.showToast('Default System Admin cannot be deactivated.');
      return;
    }
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    await db.users.update(u.id, { status: newStatus, updated: new Date().toISOString() });
    this.dataService.showToast(`User ${u.name} set to ${newStatus}.`);
    await this.loadData();
  }

  openResetPasswordModal(u: UserApp) {
    this.resetUserId.set(u.id);
    this.newResetPassword = '';
    this.isResetPasswordModalOpen.set(true);
  }

  async confirmResetPassword() {
    const uid = this.resetUserId();
    if (!uid || !this.newResetPassword || this.newResetPassword.length < 4) {
      this.dataService.showToast('New password must be at least 4 characters long.');
      return;
    }

    const pHash = await hashPassword(this.newResetPassword);
    await db.users.update(uid, { passwordHash: pHash, updated: new Date().toISOString() });
    this.dataService.showToast('User password reset successfully.');
    this.isResetPasswordModalOpen.set(false);
    await this.loadData();
  }

  // --- ROLE & PERMISSION ACTIONS ---
  openAddRoleModal() {
    this.editingRoleId.set(null);
    this.roleForm = {
      name: '',
      description: '',
      permissions: ['dashboard', 'farmers', 'cattle']
    };
    this.isRoleModalOpen.set(true);
  }

  editRole(r: RoleApp) {
    this.editingRoleId.set(r.id);
    this.roleForm = {
      name: r.name,
      description: r.description || '',
      permissions: [...r.permissions]
    };
    this.isRoleModalOpen.set(true);
  }

  togglePermission(permId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.roleForm.permissions.includes(permId)) {
        this.roleForm.permissions.push(permId);
      }
    } else {
      this.roleForm.permissions = this.roleForm.permissions.filter(p => p !== permId);
    }
  }

  isPermissionChecked(permId: string): boolean {
    return this.roleForm.permissions.includes(permId);
  }

  async saveRole() {
    if (!this.roleForm.name.trim()) {
      this.dataService.showToast('Role name is required.');
      return;
    }

    const editId = this.editingRoleId();
    const now = new Date().toISOString();

    if (editId) {
      const existing = await db.roles.get(editId);
      if (existing) {
        const updated: RoleApp = {
          ...existing,
          name: this.roleForm.name.trim(),
          description: this.roleForm.description,
          permissions: this.roleForm.permissions,
          updated: now
        };
        await db.roles.put(updated);
        this.dataService.showToast('Role permissions updated.');
      }
    } else {
      const newRole: RoleApp = {
        id: 'ROLE-' + Date.now().toString(36).toUpperCase(),
        name: this.roleForm.name.trim(),
        description: this.roleForm.description,
        permissions: this.roleForm.permissions,
        isSystem: false,
        created: now,
        updated: now
      };
      await db.roles.put(newRole);
      this.dataService.showToast('New role created successfully.');
    }

    this.isRoleModalOpen.set(false);
    await this.loadData();
  }

  async deleteRole(r: RoleApp) {
    if (r.isSystem || r.id === 'ROLE-ADMIN') {
      this.dataService.showToast('System Admin role cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete role "${r.name}"?`)) {
      await db.roles.delete(r.id);
      this.dataService.showToast(`Role "${r.name}" deleted.`);
      await this.loadData();
    }
  }
}
