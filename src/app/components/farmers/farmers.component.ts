import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Farmer } from '../../models/satviq.models';
import { LOCATION_DATA } from '../../data/location.data';
import { DetailsModalComponent, DetailField } from '../details-modal/details-modal.component';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailsModalComponent, PaginationComponent],
  templateUrl: './farmers.component.html'
})
export class FarmersComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination state
  currentPage = signal(1);
  pageSize = signal(10);

  // Form Model
  farmerForm: Partial<Farmer> = {
    name: '',
    mobile: '',
    relative: '',
    district: '',
    taluka: '',
    village: '',
    address: '',
    language: 'Gujarati',
    notes: ''
  };

  // Location dropdown options
  districts: string[] = Object.keys(LOCATION_DATA.Gujarat);
  availableTalukas: string[] = [];
  availableVillages: string[] = [];

  // Details Modal
  modalOpen = false;
  modalTitle = 'Farmer Details';
  modalFields: DetailField[] = [];

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

  onDistrictChange() {
    const d = this.farmerForm.district;
    if (d && LOCATION_DATA.Gujarat[d]) {
      this.availableTalukas = LOCATION_DATA.Gujarat[d].talukas;
      this.availableVillages = LOCATION_DATA.Gujarat[d].villages;
    } else {
      this.availableTalukas = [];
      this.availableVillages = [];
    }
    this.farmerForm.taluka = '';
    this.farmerForm.village = '';
  }

  onTalukaChange() {
    const d = this.farmerForm.district;
    if (d && LOCATION_DATA.Gujarat[d]) {
      this.availableVillages = LOCATION_DATA.Gujarat[d].villages;
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  filteredFarmers(): Farmer[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.dataService.farmers();
    return this.dataService.farmers().filter(f =>
      (f.name + ' ' + f.mobile + ' ' + (f.village || '') + ' ' + (f.taluka || '') + ' ' + (f.district || '')).toLowerCase().includes(q)
    );
  }

  paginatedFarmers(): Farmer[] {
    const list = this.filteredFarmers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  getCattleCount(farmerId: string): number {
    return this.dataService.animals().filter(a => a.farmer === farmerId).length;
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  saveFarmer() {
    const success = this.dataService.saveFarmer(this.farmerForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  editFarmer(f: Farmer) {
    this.editingId.set(f.id);
    this.farmerForm = { ...f };
    if (f.district && LOCATION_DATA.Gujarat[f.district]) {
      this.availableTalukas = LOCATION_DATA.Gujarat[f.district].talukas;
      this.availableVillages = LOCATION_DATA.Gujarat[f.district].villages;
    }
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deleteFarmer(f: Farmer) {
    if (confirm(`Are you sure you want to delete farmer "${f.name}"?`)) {
      this.dataService.deleteFarmer(f.id);
      if (this.editingId() === f.id) this.closeFormModal();
    }
  }

  openWhatsApp(f: Farmer) {
    const url = this.dataService.getWhatsAppUrl(f.mobile, `Hello ${f.name}, this is SatviQ Livestock Management.`);
    if (url) {
      window.open(url, '_blank');
    } else {
      this.dataService.showToast('Invalid farmer mobile number.');
    }
  }

  viewDetails(f: Farmer) {
    this.modalTitle = `Farmer: ${f.name}`;
    this.modalFields = [
      { label: 'Farmer ID', value: f.id },
      { label: 'Full Name', value: f.name },
      { label: 'Mobile Number', value: f.mobile },
      { label: 'Father / Spouse', value: f.relative },
      { label: 'District', value: f.district },
      { label: 'Taluka', value: f.taluka },
      { label: 'Village', value: f.village },
      { label: 'Full Address', value: f.address },
      { label: 'Preferred Language', value: f.language },
      { label: 'Total Registered Cattle', value: this.getCattleCount(f.id) },
      { label: 'Notes', value: f.notes },
      { label: 'Registered Date', value: f.created },
      { label: 'Last Updated', value: f.updated }
    ];
    this.modalOpen = true;
  }

  resetForm() {
    this.editingId.set(null);
    this.farmerForm = {
      name: '',
      mobile: '',
      relative: '',
      district: '',
      taluka: '',
      village: '',
      address: '',
      language: 'Gujarati',
      notes: ''
    };
    this.availableTalukas = [];
    this.availableVillages = [];
  }
}
