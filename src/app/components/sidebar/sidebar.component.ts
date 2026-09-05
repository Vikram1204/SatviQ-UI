import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

import { AuthService } from '../../services/auth.service';

export interface MenuItem {
  id: string;
  label: string;
  hash: string;
  iconName: string;
  badge?: string;
  badgeType?: 'warning' | 'error' | 'success' | 'info';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);

  @Input() isOpen = false;
  @Input() isCollapsed = false;
  @Input() activeItem = 'dashboard';
  
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobileSidebar = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<string>();

  get menuItems(): MenuItem[] {
    const all: MenuItem[] = [
      { id: 'dashboard', label: 'Dashboard', hash: '#dashboard', iconName: 'dashboard' },
      { id: 'farmers', label: 'Farmers', hash: '#farmers', iconName: 'farmers' },
      { id: 'cattle', label: 'Cattle', hash: '#cattle', iconName: 'cattle' },
      { id: 'ai', label: 'AI/ Bijdaan', hash: '#ai', iconName: 'ai' },
      { id: 'pd', label: 'PD', hash: '#pd', iconName: 'pd' },
      { id: 'pregnancy', label: 'Pregnancy', hash: '#pregnancy', iconName: 'pregnancy' },
      { id: 'calving', label: 'Calving', hash: '#calving', iconName: 'calving' },
      { id: 'family-tree', label: 'Family Tree', hash: '#family-tree', iconName: 'family-tree' },
      { id: 'reports', label: 'Reports', hash: '#reports', iconName: 'reports' },
      { id: 'bills', label: 'Bills', hash: '#bills', iconName: 'bills' },
      { id: 'sms', label: 'SMS/ WhatsApp', hash: '#sms', iconName: 'sms' },
      { id: 'user-management', label: 'User & Roles', hash: '#user-management', iconName: 'user-management' }
    ];
    return all.filter(item => this.authService.hasPermission(item.id));
  }

  selectItem(id: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.activeItem = id;
    this.itemSelected.emit(id);
    this.closeMobileSidebar.emit();
  }

  onToggleCollapse() {
    this.toggleCollapse.emit();
  }
}
