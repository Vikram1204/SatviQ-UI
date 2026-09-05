import { Injectable, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  private currentUser = signal<User | null>(null);

  isLoggedIn = computed(() => this.currentUser() !== null);
  user = computed(() => this.currentUser());

  // Default credentials
  private readonly DEFAULT_USERNAME = 'admin';
  private readonly DEFAULT_PASSWORD = 'admin';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('satviq_user');
      if (storedUser) {
        try {
          this.currentUser.set(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('satviq_user');
        }
      }
    }
  }

  login(username: string, password: string): { success: boolean; message: string } {
    if (username === this.DEFAULT_USERNAME && password === this.DEFAULT_PASSWORD) {
      const user: User = {
        username: username,
        role: 'Doctor / AI Expert'
      };
      this.currentUser.set(user);
      if (this.isBrowser) {
        localStorage.setItem('satviq_user', JSON.stringify(user));
      }
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'Invalid username or password' };
  }

  logout(): void {
    this.currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('satviq_user');
    }
  }
}
