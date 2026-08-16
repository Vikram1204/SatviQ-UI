import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

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

  @Input() isOpen = false;
  @Input() isCollapsed = false;
  @Input() activeItem = 'dashboard';
  
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobileSidebar = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<string>();

  get menuItems(): MenuItem[] {
    return [
      { id: 'dashboard', label: 'Dashboard', hash: '#dashboard', iconName: 'dashboard' },
      { id: 'farmers', label: 'Farmers', hash: '#farmers', iconName: 'farmers', badge: this.dataService.totalFarmers() ? String(this.dataService.totalFarmers()) : undefined },
      { id: 'cattle', label: 'Cattle', hash: '#cattle', iconName: 'cattle', badge: this.dataService.totalAnimals() ? String(this.dataService.totalAnimals()) : undefined },
      { id: 'ai', label: 'AI/ Bijdaan', hash: '#ai', iconName: 'ai' },
      { id: 'pd', label: 'PD', hash: '#pd', iconName: 'pd' },
      { id: 'pregnancy', label: 'Pregnancy', hash: '#pregnancy', iconName: 'pregnancy', badge: this.dataService.totalPregnant() ? String(this.dataService.totalPregnant()) : undefined, badgeType: 'success' },
      { id: 'calving', label: 'Calving', hash: '#calving', iconName: 'calving' },
      { id: 'family-tree', label: 'Family Tree', hash: '#family-tree', iconName: 'family-tree' },
      { id: 'reports', label: 'Reports', hash: '#reports', iconName: 'reports' },
      { id: 'bills', label: 'Bills', hash: '#bills', iconName: 'bills', badge: this.dataService.totalBills() ? String(this.dataService.totalBills()) : undefined },
      { id: 'sms', label: 'SMS/ WhatsApp', hash: '#sms', iconName: 'sms' }
    ];
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
