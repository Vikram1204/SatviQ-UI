import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { PDRecord } from '../../models/satviq.models';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-pd-diagnosis',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './pd-diagnosis.component.html'
})
export class PdDiagnosisComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  pdForm: Partial<PDRecord> = {
    animal: '',
    date: this.dataService.getToday(),
    result: 'Pregnant',
    method: 'Clinical',
    days: 45,
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

  filteredPD(): PDRecord[] {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.dataService.pd();
    if (!q) return list;
    return list.filter(r => {
      const tag = this.dataService.getAnimalTag(r.animal);
      const farmer = this.dataService.getFarmerName(this.dataService.getAnimal(r.animal)?.farmer);
      return (tag + ' ' + farmer + ' ' + r.result + ' ' + r.method + ' ' + (r.notes || '') + ' ' + r.date).toLowerCase().includes(q);
    });
  }

  paginatedPD(): PDRecord[] {
    const list = this.filteredPD();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  savePD() {
    const success = this.dataService.savePD(this.pdForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  editPD(record: PDRecord) {
    this.editingId.set(record.id);
    this.pdForm = { ...record };
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deletePD(record: PDRecord) {
    if (confirm(`Delete PD record for cattle ${this.dataService.getAnimalTag(record.animal)} on ${record.date}?`)) {
      this.dataService.deletePD(record.id);
      if (this.editingId() === record.id) this.closeFormModal();
    }
  }

  resetForm() {
    this.editingId.set(null);
    this.pdForm = {
      animal: '',
      date: this.dataService.getToday(),
      result: 'Pregnant',
      method: 'Clinical',
      days: 45,
      notes: ''
    };
  }
}
