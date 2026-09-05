import { Component, HostListener, Inject, PLATFORM_ID, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ChangePasswordModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);

  @Input() isSidebarCollapsed = false;
  @Output() hamburgerClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();

  isMobileMenuOpen = false;
  isScrolled = false;
  isDarkMode = false;
  isBrowser = false;
  showUserMenu = false;
  isChangePasswordOpen = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Check current DOM class configuration set by head script
      this.isDarkMode = document.documentElement.classList.contains('dark');
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isBrowser) {
      this.isScrolled = window.scrollY > 20;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.showUserMenu = false;
    }
  }

  toggleMobileMenu() {
    this.hamburgerClick.emit();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  openSettings() {
    this.showUserMenu = false;
    this.isMobileMenuOpen = false;
    this.settingsClick.emit();
  }

  openChangePassword() {
    this.showUserMenu = false;
    this.isChangePasswordOpen.set(true);
  }

  onLogout() {
    this.showUserMenu = false;
    this.logoutClick.emit();
  }

  toggleTheme() {
    if (this.isBrowser) {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }
}


