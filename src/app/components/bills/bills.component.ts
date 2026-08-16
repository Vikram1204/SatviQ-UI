import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { BillRecord, Animal, Farmer } from '../../models/satviq.models';
import { DetailsModalComponent, DetailField } from '../details-modal/details-modal.component';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailsModalComponent, PaginationComponent],
  templateUrl: './bills.component.html'
})
export class BillsComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  editingId = signal<string | null>(null);
  isFormModalOpen = signal(false);
  activeDropdownId = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  farmerSearch = signal<string>('');
  cattleSearch = signal<string>('');

  billForm: Partial<BillRecord> = {
    farmer: '',
    date: this.dataService.getToday(),
    type: 'AI / Bijdaan',
    cow: '',
    amount: 500,
    payment: 'Paid',
    serviceDetails: '',
    address: '',
    notes: ''
  };

  // Preview state
  previewData: BillRecord | null = null;

  // Details modal
  modalOpen = false;
  modalTitle = 'Bill Details';
  modalFields: DetailField[] = [];

  get selectedFarmer(): Farmer | undefined {
    return this.dataService.getFarmer(this.billForm.farmer);
  }

  get availableFarmerAnimals(): Animal[] {
    if (!this.billForm.farmer) return [];
    return this.dataService.animals().filter(a => a.farmer === this.billForm.farmer);
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

  filteredFarmerResults(): Farmer[] {
    const q = this.farmerSearch().toLowerCase().trim();
    if (!q) return this.dataService.farmers().slice(0, 8);
    return this.dataService.farmers().filter(f =>
      (f.name + ' ' + f.mobile + ' ' + f.id + ' ' + (f.village || '')).toLowerCase().includes(q)
    );
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  filteredBills(): BillRecord[] {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.dataService.bills();
    if (!q) return list;
    return list.filter(b => {
      const farmer = this.dataService.getFarmerName(b.farmer);
      return (b.billno + ' ' + farmer + ' ' + b.type + ' ' + (b.animalTag || '') + ' ' + b.payment + ' ' + b.date + ' ' + b.amount).toLowerCase().includes(q);
    });
  }

  paginatedBills(): BillRecord[] {
    const list = this.filteredBills();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  }

  selectFarmer(f: Farmer) {
    this.billForm.farmer = f.id;
    this.farmerSearch.set(f.name);
    this.billForm.address = f.address || `${f.village ? f.village + ', ' : ''}${f.taluka ? f.taluka + ', ' : ''}${f.district || ''}`;
    this.billForm.cow = '';
    this.cattleSearch.set('');
    this.updatePreview();
  }

  selectAnimal(a: Animal) {
    this.billForm.cow = a.id;
    this.cattleSearch.set(`${a.tag} (${a.species})`);
    this.updatePreview();
  }

  updatePreview() {
    if (!this.billForm.farmer) {
      this.previewData = null;
      return;
    }
    const cow = this.dataService.getAnimal(this.billForm.cow);
    this.previewData = {
      id: this.editingId() || 'PREVIEW',
      billno: this.billForm.billno || `BILL-${new Date().getFullYear()}-${String(this.dataService.bills().length + 1).padStart(4, '0')}`,
      farmer: this.billForm.farmer!,
      farmerId: this.billForm.farmer,
      date: this.billForm.date || this.dataService.getToday(),
      type: this.billForm.type || 'AI / Bijdaan',
      cow: this.billForm.cow,
      animalType: cow?.species || '',
      animalTag: cow?.tag || '',
      amount: Number(this.billForm.amount || 0),
      payment: this.billForm.payment || 'Pending',
      serviceDetails: this.billForm.serviceDetails || '',
      address: this.billForm.address || '',
      notes: this.billForm.notes || '',
      created: this.dataService.getToday(),
      updated: this.dataService.getToday()
    };
  }

  openAddModal() {
    this.resetForm();
    this.isFormModalOpen.set(true);
  }

  saveBillOnly() {
    this.updatePreview();
    if (!this.billForm.farmer || !this.billForm.date || !this.billForm.type || this.billForm.amount === undefined) {
      this.dataService.showToast('Please fill in Farmer, Date, Service Type, and Amount.');
      return;
    }
    const success = this.dataService.saveBill(this.billForm, this.editingId() || undefined);
    if (success) {
      this.closeFormModal();
    }
  }

  saveAndSend(mode: 'wa' | 'sms') {
    this.updatePreview();
    if (!this.billForm.farmer || !this.billForm.date || !this.billForm.type || this.billForm.amount === undefined) {
      this.dataService.showToast('Please fill in Farmer, Date, Service Type, and Amount.');
      return;
    }

    const farmer = this.selectedFarmer;
    if (!farmer) {
      this.dataService.showToast('Select a valid farmer first.');
      return;
    }

    this.billForm.sentVia = mode;
    const success = this.dataService.saveBill(this.billForm, this.editingId() || undefined);
    if (!success) return;

    const record = this.dataService.bills()[0]; // latest saved bill
    const message = this.dataService.generateSimpleBillText(record);

    if (mode === 'wa') {
      const url = this.dataService.getWhatsAppUrl(farmer.mobile, message);
      if (url) window.open(url, '_blank');
      else this.dataService.showToast('Invalid Indian mobile number.');
    } else {
      const url = this.dataService.getSMSUrl(farmer.mobile, message);
      if (url) window.location.href = url;
      else this.dataService.showToast('Invalid Indian mobile number.');
    }

    this.closeFormModal();
  }

  sendHistoryBill(b: BillRecord, mode: 'wa' | 'sms') {
    const farmer = this.dataService.getFarmer(b.farmer);
    if (!farmer) {
      this.dataService.showToast('Farmer not found.');
      return;
    }
    const message = this.dataService.generateSimpleBillText(b);
    if (mode === 'wa') {
      const url = this.dataService.getWhatsAppUrl(farmer.mobile, message);
      if (url) window.open(url, '_blank');
      else this.dataService.showToast('Invalid farmer phone number.');
    } else {
      const url = this.dataService.getSMSUrl(farmer.mobile, message);
      if (url) window.location.href = url;
      else this.dataService.showToast('Invalid farmer phone number.');
    }
  }

  editBill(b: BillRecord) {
    this.editingId.set(b.id);
    this.billForm = { ...b };
    const f = this.dataService.getFarmer(b.farmer);
    if (f) this.farmerSearch.set(f.name);
    const c = this.dataService.getAnimal(b.cow);
    if (c) this.cattleSearch.set(`${c.tag} (${c.species})`);
    this.updatePreview();
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.resetForm();
  }

  deleteBill(b: BillRecord) {
    if (confirm(`Delete bill #${b.billno}?`)) {
      this.dataService.deleteBill(b.id);
      if (this.editingId() === b.id) this.closeFormModal();
    }
  }

  viewDetails(b: BillRecord) {
    const f = this.dataService.getFarmer(b.farmer);
    this.modalTitle = `Bill: ${b.billno}`;
    this.modalFields = [
      { label: 'Bill No', value: b.billno },
      { label: 'Farmer Name', value: f?.name },
      { label: 'Farmer Mobile', value: f?.mobile },
      { label: 'Service Type', value: b.type },
      { label: 'Date', value: b.date },
      { label: 'Animal Tag', value: b.animalTag ? `${b.animalType} - ${b.animalTag}` : 'General Service' },
      { label: 'Amount', value: `₹${b.amount}` },
      { label: 'Payment Status', value: b.payment },
      { label: 'Service / Symptoms Details', value: b.serviceDetails },
      { label: 'Farmer Address', value: b.address },
      { label: 'Dispatched Via', value: b.sentVia ? (b.sentVia === 'wa' ? 'WhatsApp' : 'SMS') : 'Not Dispatched' },
      { label: 'Notes', value: b.notes },
      { label: 'Created', value: b.created }
    ];
    this.modalOpen = true;
  }

  resetForm() {
    this.editingId.set(null);
    this.farmerSearch.set('');
    this.cattleSearch.set('');
    this.billForm = {
      farmer: '',
      date: this.dataService.getToday(),
      type: 'AI / Bijdaan',
      cow: '',
      amount: 500,
      payment: 'Paid',
      serviceDetails: '',
      address: '',
      notes: ''
    };
    this.previewData = null;
  }
}
