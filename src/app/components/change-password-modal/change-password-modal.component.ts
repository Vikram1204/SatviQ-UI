import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.component.html'
})
export class ChangePasswordModalComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    this.errorMessage.set(null);

    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage.set('Please fill in all password fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('New password and confirmation do not match.');
      return;
    }

    if (this.newPassword.length < 4) {
      this.errorMessage.set('New password must be at least 4 characters long.');
      return;
    }

    this.isLoading.set(true);

    try {
      const res = await this.authService.changePassword(this.oldPassword, this.newPassword);
      this.isLoading.set(false);

      if (res.success) {
        this.dataService.showToast('Password updated successfully! Password is now encrypted.');
        this.resetForm();
        this.close.emit();
      } else {
        this.errorMessage.set(res.message);
      }
    } catch (e: any) {
      this.isLoading.set(false);
      this.errorMessage.set(e?.message || 'Failed to update password.');
    }
  }

  resetForm() {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage.set(null);
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }
}
