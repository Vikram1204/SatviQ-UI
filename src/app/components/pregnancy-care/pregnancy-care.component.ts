import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Animal } from '../../models/satviq.models';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-pregnancy-care',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './pregnancy-care.component.html'
})
export class PregnancyCareComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  activeDropdownId = signal<string | null>(null);

  get pregnantAnimals(): Animal[] {
    return this.dataService.animals().filter(a => a.pregnant);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownId.set(null);
  }

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    this.activeDropdownId.set(this.activeDropdownId() === id ? null : id);
  }

  closeDropdown() {
    this.activeDropdownId.set(null);
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  filteredPregnant(): Animal[] {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.pregnantAnimals;
    if (!q) return list;
    return list.filter(a => {
      const farmer = this.dataService.getFarmerName(a.farmer);
      return (a.tag + ' ' + (a.species || '') + ' ' + (a.breed || '') + ' ' + farmer + ' ' + (a.due || '')).toLowerCase().includes(q);
    });
  }

  paginatedPregnant(): Animal[] {
    const list = this.filteredPregnant();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  getDaysRemaining(dueDate?: string): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  sendCareReminder(a: Animal) {
    const farmer = this.dataService.getFarmer(a.farmer);
    if (!farmer) {
      this.dataService.showToast('Farmer details not found.');
      return;
    }
    const days = this.getDaysRemaining(a.due);
    const daysText = days !== null ? (days > 0 ? `in approx ${days} days` : 'soon') : '';
    const message = `SatviQ Helper Reminder: Your cattle ${a.tag} is pregnant with expected calving on ${a.due || 'scheduled date'} (${daysText}). Please maintain pre-calving diet and consult your veterinary doctor.`;

    const url = this.dataService.getWhatsAppUrl(farmer.mobile, message);
    if (url) {
      window.open(url, '_blank');
    } else {
      this.dataService.showToast('Invalid Indian mobile number for this farmer.');
    }
  }
}
