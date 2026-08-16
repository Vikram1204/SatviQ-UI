import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CalvingRecord, Animal } from '../../models/satviq.models';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-calving',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './calving.component.html'
})
export class CalvingComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  calvingForm: Partial<CalvingRecord> = {
    mother: '',
    date: this.dataService.getToday(),
    outcome: 'Normal',
    tag: '',
    sex: 'Female',
    weight: 25,
    notes: ''
  };

  get femaleMothers(): Animal[] {
    return this.dataService.animals().filter(a => a.sex === 'Female');
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

  filteredCalvings(): CalvingRecord[] {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.dataService.calvings();
    if (!q) return list;
    return list.filter(r => {
      const motherTag = this.dataService.getAnimalTag(r.mother);
      const farmer = this.dataService.getFarmerName(this.dataService.getAnimal(r.mother)?.farmer);
      return (motherTag + ' ' + r.tag + ' ' + farmer + ' ' + r.outcome + ' ' + r.sex + ' ' + r.date).toLowerCase().includes(q);
    });
  }

  paginatedCalvings(): CalvingRecord[] {
    const list = this.filteredCalvings();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  saveCalving() {
    const success = this.dataService.saveCalving(this.calvingForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  editCalving(record: CalvingRecord) {
    this.editingId.set(record.id);
    this.calvingForm = { ...record };
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deleteCalving(record: CalvingRecord) {
    if (confirm(`Delete calving record for mother ${this.dataService.getAnimalTag(record.mother)}? Note: The automatically registered calf will also be removed.`)) {
      this.dataService.deleteCalving(record.id);
      if (this.editingId() === record.id) this.closeFormModal();
    }
  }

  resetForm() {
    this.editingId.set(null);
    this.calvingForm = {
      mother: '',
      date: this.dataService.getToday(),
      outcome: 'Normal',
      tag: '',
      sex: 'Female',
      weight: 25,
      notes: ''
    };
  }
}
