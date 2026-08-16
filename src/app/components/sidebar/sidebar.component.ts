import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() isOpen = false;
  @Input() isCollapsed = false;
  
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobileSidebar = new EventEmitter<void>();

  activeItem = 'dashboard';

  menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', hash: '#dashboard', iconName: 'dashboard' },
    { id: 'farmers', label: 'Farmers', hash: '#farmers', iconName: 'farmers' },
    { id: 'cattle', label: 'Cattle', hash: '#cattle', iconName: 'cattle' },
    { id: 'ai', label: 'AI/ Bijdaan', hash: '#ai', iconName: 'ai' },
    { id: 'pd', label: 'PD', hash: '#pd', iconName: 'pd', badge: '18', badgeType: 'warning' },
    { id: 'pregnancy', label: 'Pregnancy', hash: '#pregnancy', iconName: 'pregnancy' },
    { id: 'calving', label: 'Calving', hash: '#calving', iconName: 'calving' },
    { id: 'family-tree', label: 'Family Tree', hash: '#family-tree', iconName: 'family-tree' },
    { id: 'reports', label: 'Reports', hash: '#reports', iconName: 'reports' },
    { id: 'bills', label: 'Bills', hash: '#bills', iconName: 'bills' },
    { id: 'sms', label: 'SMS/ WhatsApp', hash: '#sms', iconName: 'sms' }
  ];

  selectItem(id: string) {
    this.activeItem = id;
    this.closeMobileSidebar.emit();
  }

  onToggleCollapse() {
    this.toggleCollapse.emit();
  }
}
