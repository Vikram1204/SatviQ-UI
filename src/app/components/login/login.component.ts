import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  username = '';
  password = '';
  showPassword = false;
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.isLoading.set(true);

    try {
      const result = await this.authService.login(this.username, this.password);
      this.isLoading.set(false);

      if (!result.success) {
        this.errorMessage.set(result.message);
        this.password = '';
      }
    } catch (e: any) {
      this.isLoading.set(false);
      this.errorMessage.set(e?.message || 'Authentication error');
    }
  }
}
