import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Farmer, Animal, AIRecord, PDRecord, CalvingRecord, BillRecord, DatabaseState } from '../models/satviq.models';
import { db } from '../db/satviq-db';

const LEGACY_STORAGE_KEY = 'satviq_helper_v1';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals for in-memory state
  farmers = signal<Farmer[]>([]);
  animals = signal<Animal[]>([]);
  ai = signal<AIRecord[]>([]);
  pd = signal<PDRecord[]>([]);
  calvings = signal<CalvingRecord[]>([]);
  bills = signal<BillRecord[]>([]);

  // Toast signal
  toastMessage = signal<string | null>(null);

  // Computed KPIs
  totalFarmers = computed(() => this.farmers().length);
  totalAnimals = computed(() => this.animals().length);
  totalAI = computed(() => this.ai().length);
  totalPregnant = computed(() => this.animals().filter(a => a.pregnant).length);
  totalCalvings = computed(() => this.calvings().length);
  totalBills = computed(() => this.bills().length);

  // Upcoming 30-day alerts
  upcomingAlerts = computed(() => {
    const maxDate = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    return this.animals()
      .filter(a => a.due && a.due <= maxDate && a.pregnant)
      .map(a => ({
        tag: a.tag,
        due: a.due,
        farmerName: this.getFarmerName(a.farmer)
      }));
  });

  constructor() {
    if (this.isBrowser) {
      this.initDatabase();
    }
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 3000);
  }

  /**
   * Initialize Dexie database state & migrate legacy localStorage if needed
   */
  async initDatabase() {
    try {
      let farmerList = await db.farmers.toArray();
      let animalList = await db.animals.toArray();
      let aiList = await db.ai.toArray();
      let pdList = await db.pd.toArray();
      let calvingList = await db.calvings.toArray();
      let billList = await db.bills.toArray();

      const isEmpty = farmerList.length === 0 && animalList.length === 0;

      if (isEmpty) {
        // Check for legacy localStorage data to migrate
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          try {
            const legacy: DatabaseState = JSON.parse(raw);
            if (legacy.farmers?.length) await db.farmers.bulkAdd(legacy.farmers);
            if (legacy.animals?.length) await db.animals.bulkAdd(legacy.animals);
            if (legacy.ai?.length) await db.ai.bulkAdd(legacy.ai);
            if (legacy.pd?.length) await db.pd.bulkAdd(legacy.pd);
            if (legacy.calvings?.length) await db.calvings.bulkAdd(legacy.calvings);
            if (legacy.bills?.length) await db.bills.bulkAdd(legacy.bills);
          } catch (e) {
            console.error('Error migrating legacy localStorage data:', e);
          }
        } else {
          // Seed demo initial data into Dexie
          await this.seedInitialData();
        }

        // Re-read after migration / seed
        farmerList = await db.farmers.toArray();
        animalList = await db.animals.toArray();
        aiList = await db.ai.toArray();
        pdList = await db.pd.toArray();
        calvingList = await db.calvings.toArray();
        billList = await db.bills.toArray();
      }

      this.farmers.set(farmerList);
      this.animals.set(animalList);
      this.ai.set(aiList);
      this.pd.set(pdList);
      this.calvings.set(calvingList);
      this.bills.set(billList);
    } catch (e) {
      console.error('Failed to initialize Dexie database:', e);
    }
  }

  /**
   * Reload all signals from Dexie IndexedDB (used after restore/sync)
   */
  async reloadFromDB() {
    if (!this.isBrowser) return;
    this.farmers.set(await db.farmers.toArray());
    this.animals.set(await db.animals.toArray());
    this.ai.set(await db.ai.toArray());
    this.pd.set(await db.pd.toArray());
    this.calvings.set(await db.calvings.toArray());
    this.bills.set(await db.bills.toArray());
  }

  private async seedInitialData() {
    const now = new Date().toISOString().slice(0, 10);
    const initialFarmers: Farmer[] = [
      { id: 'FAR-M4K9-1001', name: 'Ramesh Patel', mobile: '9876543210', relative: 'Dahyabhai', districtId: 'GJ-AHM', district: 'Ahmedabad', talukaId: 'GJ-AHM-02', taluka: 'Sanand', villageId: 'GJ-AHM-02-01', village: 'Sanand Rural', address: 'Plot 42, Green Farm Road', language: 'Gujarati', notes: 'HF dairy farm', created: now, updated: now },
      { id: 'FAR-M4K9-1002', name: 'Kishan Rabari', mobile: '9123456780', relative: 'Bhagwanbhai', districtId: 'GJ-MOR', district: 'Morbi', talukaId: 'GJ-MOR-01', taluka: 'Morbi', villageId: 'GJ-MOR-01-01', village: 'Lalpar', address: 'Rabari Vaas, Nr Primary School', language: 'Gujarati', notes: 'Murrah buffalo breeder', created: now, updated: now },
      { id: 'FAR-M4K9-1003', name: 'Bhavin Chaudhary', mobile: '9428012345', relative: 'Somabhai', districtId: 'GJ-MEH', district: 'Mehsana', talukaId: 'GJ-MEH-03', taluka: 'Unjha', villageId: 'GJ-MEH-03-01', village: 'Unjha Rural', address: 'Kisan Chowk, Main Bazaar', language: 'Gujarati', notes: 'Gir cow farm', created: now, updated: now }
    ];

    const initialAnimals: Animal[] = [
      { id: 'ANI-C001', farmer: 'FAR-M4K9-1001', tag: 'COW-0428', species: 'Cow', breed: 'HF Crossbreed', sex: 'Female', dob: '2022-03-15', status: 'Pregnant', pregnant: true, due: '2026-09-15', created: now, updated: now },
      { id: 'ANI-B002', farmer: 'FAR-M4K9-1002', tag: 'BUF-0881', species: 'Buffalo', breed: 'Murrah Buffalo', sex: 'Female', dob: '2021-08-20', status: 'PD Recheck', pregnant: false, created: now, updated: now },
      { id: 'ANI-C003', farmer: 'FAR-M4K9-1003', tag: 'COW-0150', species: 'Cow', breed: 'Gir Cow', sex: 'Female', dob: '2023-01-10', status: 'Pregnant', pregnant: true, due: '2026-10-25', created: now, updated: now }
    ];

    const initialAI: AIRecord[] = [
      { id: 'AI-1001', animal: 'ANI-C001', date: '2025-12-10', tech: 'Dr. V. Joshi', bull: 'SEM-SHR-44', batch: 'ST-998', attempt: 1, created: now, updated: now },
      { id: 'AI-1002', animal: 'ANI-B002', date: '2026-01-15', tech: 'Dr. V. Joshi', bull: 'BUL-MUR-99', batch: 'ST-542', attempt: 2, created: now, updated: now }
    ];

    const initialPD: PDRecord[] = [
      { id: 'PD-1001', animal: 'ANI-C001', date: '2026-01-25', result: 'Pregnant', method: 'Ultrasound', days: 45, notes: 'Confirmed twin heartbeat', created: now, updated: now }
    ];

    await db.farmers.bulkAdd(initialFarmers);
    await db.animals.bulkAdd(initialAnimals);
    await db.ai.bulkAdd(initialAI);
    await db.pd.bulkAdd(initialPD);
  }

  generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  getFarmerName(farmerId?: string): string {
    if (!farmerId) return 'Unknown';
    const f = this.farmers().find(x => x.id === farmerId);
    return f ? f.name : 'Unknown';
  }

  getFarmer(farmerId?: string): Farmer | undefined {
    return this.farmers().find(x => x.id === farmerId);
  }

  getAnimal(animalId?: string): Animal | undefined {
    return this.animals().find(x => x.id === animalId);
  }

  getAnimalTag(animalId?: string): string {
    if (!animalId) return 'Unknown';
    const a = this.animals().find(x => x.id === animalId);
    return a ? a.tag : 'Unknown';
  }

  // --- Farmers CRUD ---
  async saveFarmer(farmerData: Partial<Farmer>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!farmerData.name || !farmerData.mobile) {
      this.showToast('Name and mobile number are required.');
      return false;
    }
    const cleanDigits = farmerData.mobile.replace(/\D/g, '');
    if (!(cleanDigits.length === 10 || (cleanDigits.startsWith('91') && cleanDigits.length === 12))) {
      this.showToast('Enter a valid 10-digit Indian mobile number.');
      return false;
    }

    if (editId) {
      const existing = await db.farmers.get(editId);
      if (existing) {
        const updated: Farmer = { ...existing, ...farmerData, updated: now } as Farmer;
        await db.farmers.put(updated);
        this.farmers.update(list => list.map(f => f.id === editId ? updated : f));
        this.showToast('Farmer updated successfully.');
      }
    } else {
      const newFarmer: Farmer = {
        id: this.generateId('FAR'),
        name: farmerData.name!,
        mobile: farmerData.mobile!,
        relative: farmerData.relative || '',
        village: farmerData.village || '',
        taluka: farmerData.taluka || '',
        district: farmerData.district || '',
        address: farmerData.address || '',
        language: farmerData.language || 'Gujarati',
        notes: farmerData.notes || '',
        created: now,
        updated: now
      };
      await db.farmers.put(newFarmer);
      this.farmers.update(list => [newFarmer, ...list]);
      this.showToast('Farmer registered successfully.');
    }
    return true;
  }

  async deleteFarmer(farmerId: string) {
    await db.farmers.delete(farmerId);
    this.farmers.update(list => list.filter(f => f.id !== farmerId));
    this.showToast('Farmer removed.');
  }

  // --- Animals CRUD ---
  async saveAnimal(animalData: Partial<Animal>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!animalData.tag || !animalData.farmer) {
      this.showToast('Tag ID and Farmer owner are required.');
      return false;
    }

    if (editId) {
      const existing = await db.animals.get(editId);
      if (existing) {
        const updated: Animal = { ...existing, ...animalData, updated: now } as Animal;
        await db.animals.put(updated);
        this.animals.update(list => list.map(a => a.id === editId ? updated : a));
        this.showToast('Animal record updated.');
      }
    } else {
      const newAnimal: Animal = {
        id: this.generateId('ANI'),
        farmer: animalData.farmer!,
        tag: animalData.tag!,
        species: animalData.species || 'Cow',
        breed: animalData.breed || '',
        sex: animalData.sex || 'Female',
        dob: animalData.dob || '',
        mother: animalData.mother || '',
        sire: animalData.sire || '',
        mark: animalData.mark || '',
        notes: animalData.notes || '',
        status: animalData.status || 'Active',
        pregnant: animalData.pregnant || false,
        due: animalData.due || '',
        created: now,
        updated: now
      };
      await db.animals.put(newAnimal);
      this.animals.update(list => [newAnimal, ...list]);
      this.showToast('Cattle registered successfully.');
    }
    return true;
  }

  async deleteAnimal(animalId: string) {
    await db.animals.delete(animalId);
    this.animals.update(list => list.filter(a => a.id !== animalId));
    this.showToast('Cattle record removed.');
  }

  // --- AI Records CRUD ---
  async saveAIRecord(recordData: Partial<AIRecord>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!recordData.animal || !recordData.date) {
      this.showToast('Animal tag and AI date are required.');
      return false;
    }

    if (editId) {
      const existing = await db.ai.get(editId);
      if (existing) {
        const updated: AIRecord = { ...existing, ...recordData, updated: now } as AIRecord;
        await db.ai.put(updated);
        this.ai.update(list => list.map(r => r.id === editId ? updated : r));
        this.showToast('AI record updated.');
      }
    } else {
      const newRecord: AIRecord = {
        id: this.generateId('AI'),
        animal: recordData.animal!,
        date: recordData.date!,
        tech: recordData.tech || '',
        bull: recordData.bull || '',
        batch: recordData.batch || '',
        attempt: recordData.attempt || 1,
        notes: recordData.notes || '',
        created: now,
        updated: now
      };
      await db.ai.put(newRecord);
      this.ai.update(list => [newRecord, ...list]);

      // Update animal status to AI Follow-up
      const animal = this.animals().find(a => a.id === recordData.animal);
      if (animal && !animal.pregnant) {
        await this.saveAnimal({ status: 'AI Follow-up' }, animal.id);
      }
      this.showToast('Insemination record saved.');
    }
    return true;
  }

  async deleteAIRecord(id: string) {
    await db.ai.delete(id);
    this.ai.update(list => list.filter(r => r.id !== id));
    this.showToast('AI record removed.');
  }

  // --- PD Records CRUD ---
  async savePDRecord(recordData: Partial<PDRecord>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!recordData.animal || !recordData.date || !recordData.result) {
      this.showToast('Animal tag, date, and diagnosis result are required.');
      return false;
    }

    if (editId) {
      const existing = await db.pd.get(editId);
      if (existing) {
        const updated: PDRecord = { ...existing, ...recordData, updated: now } as PDRecord;
        await db.pd.put(updated);
        this.pd.update(list => list.map(r => r.id === editId ? updated : r));
        this.showToast('PD record updated.');
      }
    } else {
      const newRecord: PDRecord = {
        id: this.generateId('PD'),
        animal: recordData.animal!,
        date: recordData.date!,
        result: recordData.result!,
        method: recordData.method || 'Clinical',
        days: recordData.days || 60,
        notes: recordData.notes || '',
        created: now,
        updated: now
      };
      await db.pd.put(newRecord);
      this.pd.update(list => [newRecord, ...list]);

      // Update animal pregnancy status & calculate due date if pregnant
      const animal = this.animals().find(a => a.id === recordData.animal);
      if (animal) {
        if (recordData.result === 'Pregnant') {
          const gestDays = animal.species === 'Buffalo' ? 310 : 280;
          const remDays = gestDays - (recordData.days || 60);
          const dueDate = new Date(Date.now() + remDays * 864e5).toISOString().slice(0, 10);
          await this.saveAnimal({ pregnant: true, status: 'Pregnant', due: dueDate }, animal.id);
        } else if (recordData.result === 'Not Pregnant') {
          await this.saveAnimal({ pregnant: false, status: 'Active', due: '' }, animal.id);
        } else {
          await this.saveAnimal({ pregnant: false, status: 'PD Recheck' }, animal.id);
        }
      }
      this.showToast('Pregnancy diagnosis recorded.');
    }
    return true;
  }

  async deletePDRecord(id: string) {
    await db.pd.delete(id);
    this.pd.update(list => list.filter(r => r.id !== id));
    this.showToast('PD record removed.');
  }

  // --- Calving Records CRUD ---
  async saveCalving(recordData: Partial<CalvingRecord>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!recordData.mother || !recordData.date || !recordData.tag) {
      this.showToast('Mother cattle tag, date, and calf tag are required.');
      return false;
    }

    if (editId) {
      const existing = await db.calvings.get(editId);
      if (existing) {
        const updated: CalvingRecord = { ...existing, ...recordData, updated: now } as CalvingRecord;
        await db.calvings.put(updated);
        this.calvings.update(list => list.map(c => c.id === editId ? updated : c));
        this.showToast('Calving record updated.');
      }
    } else {
      const newRecord: CalvingRecord = {
        id: this.generateId('CALV'),
        mother: recordData.mother!,
        date: recordData.date!,
        outcome: recordData.outcome || 'Normal',
        tag: recordData.tag!,
        sex: recordData.sex || 'Female',
        weight: recordData.weight || 25,
        notes: recordData.notes || '',
        created: now,
        updated: now
      };
      await db.calvings.put(newRecord);
      this.calvings.update(list => [newRecord, ...list]);

      // Update mother status
      const mother = this.animals().find(a => a.id === recordData.mother);
      if (mother) {
        await this.saveAnimal({ pregnant: false, status: 'Calved', due: '' }, mother.id);
        // Automatically register calf in herd
        await this.saveAnimal({
          farmer: mother.farmer,
          tag: recordData.tag!,
          species: mother.species,
          sex: recordData.sex || 'Female',
          mother: mother.id,
          dob: recordData.date!,
          status: 'Active'
        });
      }
      this.showToast('Calving & new calf registered successfully.');
    }
    return true;
  }

  async deleteCalving(id: string) {
    await db.calvings.delete(id);
    this.calvings.update(list => list.filter(c => c.id !== id));
    this.showToast('Calving record removed.');
  }

  // --- Bills CRUD ---
  async saveBill(billData: Partial<BillRecord>, editId?: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (!billData.farmer || !billData.type || billData.amount === undefined) {
      this.showToast('Farmer, service type, and bill amount are required.');
      return false;
    }

    if (editId) {
      const existing = await db.bills.get(editId);
      if (existing) {
        const updated: BillRecord = { ...existing, ...billData, updated: now } as BillRecord;
        await db.bills.put(updated);
        this.bills.update(list => list.map(b => b.id === editId ? updated : b));
        this.showToast('Bill invoice updated.');
      }
    } else {
      const nextNo = (this.bills().length + 1001).toString();
      const newBill: BillRecord = {
        id: this.generateId('BILL'),
        billno: `INV-${nextNo}`,
        farmer: billData.farmer!,
        date: billData.date || this.getToday(),
        type: billData.type!,
        amount: Number(billData.amount),
        payment: billData.payment || 'Pending',
        symptoms: billData.symptoms || '',
        serviceDetails: billData.serviceDetails || '',
        created: now,
        updated: now
      };
      await db.bills.put(newBill);
      this.bills.update(list => [newBill, ...list]);
      this.showToast('Invoice bill generated successfully.');
    }
    return true;
  }

  async deleteBill(id: string) {
    await db.bills.delete(id);
    this.bills.update(list => list.filter(b => b.id !== id));
    this.showToast('Bill deleted.');
  }

  // --- AI Records Aliases ---
  async saveAI(recordData: Partial<AIRecord>, editId?: string): Promise<boolean> {
    return this.saveAIRecord(recordData, editId);
  }

  async deleteAI(id: string) {
    return this.deleteAIRecord(id);
  }

  // --- PD Records Aliases ---
  async savePD(recordData: Partial<PDRecord>, editId?: string): Promise<boolean> {
    return this.savePDRecord(recordData, editId);
  }

  async deletePD(id: string) {
    return this.deletePDRecord(id);
  }

  // --- Messaging & Export Utilities ---
  generateSimpleBillText(b: BillRecord): string {
    const farmerName = this.getFarmerName(b.farmer);
    return `*SatviQ Dairy Services Invoice*\n` +
           `Invoice #: ${b.billno}\n` +
           `Date: ${b.date}\n` +
           `Farmer: ${farmerName}\n` +
           `Service: ${b.type}\n` +
           `Amount: ₹${b.amount}\n` +
           `Status: ${b.payment}\n` +
           `Thank you for using SatviQ Services!`;
  }

  getWhatsAppUrl(mobile: string, text: string): string {
    const cleanMobile = (mobile || '').replace(/\D/g, '');
    const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  getSMSUrl(mobile: string, text: string): string {
    const cleanMobile = (mobile || '').replace(/\D/g, '');
    return `sms:${cleanMobile}?body=${encodeURIComponent(text)}`;
  }

  exportCSV() {
    const data = this.animals().map(a => ({
      Tag: a.tag,
      Species: a.species,
      Farmer: this.getFarmerName(a.farmer),
      Breed: a.breed || '',
      Sex: a.sex,
      Status: a.pregnant ? 'Pregnant' : a.status,
      Due: a.due || ''
    }));

    if (data.length === 0) {
      this.showToast('No records to export.');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `satviq_cattle_report_${this.getToday()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
