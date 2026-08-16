import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Animal } from '../../models/satviq.models';
import { DetailsModalComponent, DetailField } from '../details-modal/details-modal.component';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-cattle',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailsModalComponent, PaginationComponent],
  templateUrl: './cattle.component.html'
})
export class CattleComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Form Model
  animalForm: Partial<Animal> = {
    farmer: '',
    tag: '',
    species: 'Cow',
    breed: '',
    sex: 'Female',
    dob: '',
    mother: '',
    sire: '',
    mark: '',
    notes: ''
  };

  // Details Modal
  modalOpen = false;
  modalTitle = 'Cattle Details';
  modalFields: DetailField[] = [];

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

  filteredAnimals(): Animal[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.dataService.animals();
    return this.dataService.animals().filter(a =>
      (a.tag + ' ' + (a.breed || '') + ' ' + (a.species || '') + ' ' + this.dataService.getFarmerName(a.farmer)).toLowerCase().includes(q)
    );
  }

  paginatedAnimals(): Animal[] {
    const list = this.filteredAnimals();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  saveAnimal() {
    const success = this.dataService.saveAnimal(this.animalForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  editAnimal(a: Animal) {
    this.editingId.set(a.id);
    this.animalForm = { ...a };
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deleteAnimal(a: Animal) {
    if (confirm(`Are you sure you want to delete cattle "${a.tag}"?`)) {
      this.dataService.deleteAnimal(a.id);
      if (this.editingId() === a.id) this.closeFormModal();
    }
  }

  viewDetails(a: Animal) {
    this.modalTitle = `Cattle: ${a.tag} (${a.species})`;
    this.modalFields = [
      { label: 'Tag / Animal ID', value: a.tag },
      { label: 'Species', value: a.species },
      { label: 'Farmer Owner', value: this.dataService.getFarmerName(a.farmer) },
      { label: 'Breed', value: a.breed },
      { label: 'Sex', value: a.sex },
      { label: 'Date of Birth', value: a.dob },
      { label: 'Mother ID', value: this.dataService.getAnimalTag(a.mother) },
      { label: 'Sire / Bull ID', value: a.sire },
      { label: 'Reproductive Status', value: a.pregnant ? 'Pregnant' : a.status },
      { label: 'Expected Calving Date', value: a.due },
      { label: 'Colour / Mark', value: a.mark },
      { label: 'Notes', value: a.notes },
      { label: 'Registered Date', value: a.created },
      { label: 'Last Updated', value: a.updated }
    ];
    this.modalOpen = true;
  }

  resetForm() {
    this.editingId.set(null);
    this.animalForm = {
      farmer: '',
      tag: '',
      species: 'Cow',
      breed: '',
      sex: 'Female',
      dob: '',
      mother: '',
      sire: '',
      mark: '',
      notes: ''
    };
  }
}
