import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AIRecord } from '../../models/satviq.models';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-ai-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './ai-tracking.component.html'
})
export class AiTrackingComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  aiForm: Partial<AIRecord> = {
    animal: '',
    date: this.dataService.getToday(),
    tech: '',
    bull: '',
    batch: '',
    attempt: 1,
    notes: ''
  };

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

  filteredAI(): AIRecord[] {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.dataService.ai();
    if (!q) return list;
    return list.filter(r => {
      const tag = this.dataService.getAnimalTag(r.animal);
      const farmer = this.dataService.getFarmerName(this.dataService.getAnimal(r.animal)?.farmer);
      return (tag + ' ' + farmer + ' ' + (r.tech || '') + ' ' + (r.bull || '') + ' ' + (r.batch || '') + ' ' + r.date).toLowerCase().includes(q);
    });
  }

  paginatedAI(): AIRecord[] {
    const list = this.filteredAI();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  saveAI() {
    const success = this.dataService.saveAI(this.aiForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  editAI(record: AIRecord) {
    this.editingId.set(record.id);
    this.aiForm = { ...record };
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deleteAI(record: AIRecord) {
    if (confirm(`Delete AI record for cattle ${this.dataService.getAnimalTag(record.animal)} on ${record.date}?`)) {
      this.dataService.deleteAI(record.id);
      if (this.editingId() === record.id) this.closeFormModal();
    }
  }

  resetForm() {
    this.editingId.set(null);
    this.aiForm = {
      animal: '',
      date: this.dataService.getToday(),
      tech: '',
      bull: '',
      batch: '',
      attempt: 1,
      notes: ''
    };
  }
}
