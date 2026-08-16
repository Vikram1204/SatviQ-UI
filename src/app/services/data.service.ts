import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Farmer, Animal, AIRecord, PDRecord, CalvingRecord, BillRecord, DatabaseState } from '../models/satviq.models';

const STORAGE_KEY = 'satviq_helper_v1';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals for state
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
    this.loadState();
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 3000);
  }

  private loadState() {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const db: DatabaseState = JSON.parse(raw);
        this.farmers.set(db.farmers || []);
        this.animals.set(db.animals || []);
        this.ai.set(db.ai || []);
        this.pd.set(db.pd || []);
        this.calvings.set(db.calvings || []);
        this.bills.set(db.bills || []);
      } else {
        this.seedInitialData();
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
      this.seedInitialData();
    }
  }

  private saveState() {
    if (!this.isBrowser) return;
    try {
      const db: DatabaseState = {
        farmers: this.farmers(),
        animals: this.animals(),
        ai: this.ai(),
        pd: this.pd(),
        calvings: this.calvings(),
        bills: this.bills()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString().slice(0, 10);
    const initialFarmers: Farmer[] = [
      { id: 'FAR-M4K9-1001', name: 'Ramesh Patel', mobile: '9876543210', relative: 'Dahyabhai', village: 'Sanand', taluka: 'Sanand', district: 'Ahmedabad', address: 'Plot 42, Green Farm Road', language: 'Gujarati', notes: 'HF dairy farm', created: now, updated: now },
      { id: 'FAR-M4K9-1002', name: 'Kishan Rabari', mobile: '9123456780', relative: 'Bhagwanbhai', village: 'Morbi', taluka: 'Morbi', district: 'Morbi', address: 'Rabari Vaas, Nr Primary School', language: 'Gujarati', notes: 'Murrah buffalo breeder', created: now, updated: now },
      { id: 'FAR-M4K9-1003', name: 'Bhavin Chaudhary', mobile: '9428012345', relative: 'Somabhai', village: 'Unjha', taluka: 'Unjha', district: 'Mehsana', address: 'Kisan Chowk, Main Bazaar', language: 'Gujarati', notes: 'Gir cow farm', created: now, updated: now }
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

    this.farmers.set(initialFarmers);
    this.animals.set(initialAnimals);
    this.ai.set(initialAI);
    this.pd.set(initialPD);
    this.calvings.set([]);
    this.bills.set([]);
    this.saveState();
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
  saveFarmer(farmerData: Partial<Farmer>, editId?: string): boolean {
    const now = this.getToday();
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
      this.farmers.update(list => list.map(f => f.id === editId ? { ...f, ...farmerData, updated: now } as Farmer : f));
      this.showToast('Farmer updated successfully.');
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
      this.farmers.update(list => [newFarmer, ...list]);
      this.showToast('Farmer registered successfully.');
    }
    this.saveState();
    return true;
  }

  deleteFarmer(farmerId: string) {
    this.farmers.update(list => list.filter(f => f.id !== farmerId));
    this.saveState();
    this.showToast('Farmer removed.');
  }

  // --- Animals CRUD ---
  saveAnimal(animalData: Partial<Animal>, editId?: string): boolean {
    const now = this.getToday();
    if (!animalData.farmer || !animalData.tag) {
      this.showToast('Farmer and Tag ID are required.');
      return false;
    }

    const tagExists = this.animals().some(a => a.tag.toLowerCase() === animalData.tag!.toLowerCase() && a.id !== editId);
    if (tagExists) {
      this.showToast('Tag / Animal ID already exists.');
      return false;
    }

    if (editId) {
      this.animals.update(list => list.map(a => a.id === editId ? { ...a, ...animalData, updated: now } as Animal : a));
      this.showToast('Cattle updated successfully.');
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
        status: 'Active',
        pregnant: false,
        created: now,
        updated: now
      };
      this.animals.update(list => [newAnimal, ...list]);
      this.showToast('Cattle registered successfully.');
    }
    this.saveState();
    return true;
  }

  deleteAnimal(animalId: string) {
    this.animals.update(list => list.filter(a => a.id !== animalId));
    this.saveState();
    this.showToast('Cattle removed.');
  }

  // --- AI Records CRUD ---
  saveAI(aiData: Partial<AIRecord>, editId?: string): boolean {
    const now = this.getToday();
    if (!aiData.animal || !aiData.date) {
      this.showToast('Cattle and AI Date are required.');
      return false;
    }

    if (editId) {
      this.ai.update(list => list.map(r => r.id === editId ? { ...r, ...aiData, updated: now } as AIRecord : r));
      this.showToast('AI record updated.');
    } else {
      const newAI: AIRecord = {
        id: this.generateId('AI'),
        animal: aiData.animal!,
        date: aiData.date!,
        tech: aiData.tech || '',
        bull: aiData.bull || '',
        batch: aiData.batch || '',
        attempt: Number(aiData.attempt) || 1,
        notes: aiData.notes || '',
        created: now,
        updated: now
      };
      this.ai.update(list => [newAI, ...list]);
      this.showToast('Bijdaan recorded successfully.');
    }
    this.saveState();
    return true;
  }

  deleteAI(aiId: string) {
    this.ai.update(list => list.filter(r => r.id !== aiId));
    this.saveState();
    this.showToast('AI record deleted.');
  }

  // --- PD Records CRUD ---
  savePD(pdData: Partial<PDRecord>, editId?: string): boolean {
    const now = this.getToday();
    if (!pdData.animal || !pdData.date || !pdData.result) {
      this.showToast('Cattle, PD Date, and Result are required.');
      return false;
    }

    const animal = this.animals().find(a => a.id === pdData.animal);

    if (editId) {
      this.pd.update(list => list.map(r => r.id === editId ? { ...r, ...pdData, updated: now } as PDRecord : r));
      this.showToast('PD record updated.');
    } else {
      const newPD: PDRecord = {
        id: this.generateId('PD'),
        animal: pdData.animal!,
        date: pdData.date!,
        result: pdData.result,
        method: pdData.method || 'Clinical',
        days: pdData.days ? Number(pdData.days) : undefined,
        notes: pdData.notes || '',
        created: now,
        updated: now
      };
      this.pd.update(list => [newPD, ...list]);
      this.showToast('PD result saved.');
    }

    // Update animal reproductive status
    if (animal) {
      const isPregnant = pdData.result === 'Pregnant';
      let due = '';
      if (isPregnant) {
        const d = new Date(pdData.date);
        d.setDate(d.getDate() + 280);
        due = d.toISOString().slice(0, 10);
      }
      const newStatus = isPregnant ? 'Pregnant' : (pdData.result === 'Not Pregnant' ? 'AI Follow-up' : 'PD Recheck');

      this.animals.update(list => list.map(a => a.id === animal.id ? {
        ...a,
        pregnant: isPregnant,
        status: newStatus,
        due,
        updated: now
      } : a));
    }

    this.saveState();
    return true;
  }

  deletePD(pdId: string) {
    this.pd.update(list => list.filter(r => r.id !== pdId));
    this.saveState();
    this.showToast('PD record deleted.');
  }

  // --- Calving Records CRUD ---
  saveCalving(calvingData: Partial<CalvingRecord>, editId?: string): boolean {
    const now = this.getToday();
    if (!calvingData.mother || !calvingData.date || !calvingData.tag) {
      this.showToast('Mother, Date and Calf Tag are required.');
      return false;
    }

    if (editId) {
      this.calvings.update(list => list.map(c => c.id === editId ? { ...c, ...calvingData, updated: now } as CalvingRecord : c));
      const calf = this.animals().find(a => a.calvingId === editId);
      if (calf) {
        this.animals.update(list => list.map(a => a.id === calf.id ? {
          ...a,
          tag: calvingData.tag!,
          sex: calvingData.sex || 'Female',
          dob: calvingData.date!,
          updated: now
        } : a));
      }
      this.showToast('Calving record updated.');
    } else {
      const mother = this.animals().find(a => a.id === calvingData.mother);
      const calvingId = this.generateId('CAL');

      const newCalving: CalvingRecord = {
        id: calvingId,
        mother: calvingData.mother!,
        date: calvingData.date!,
        outcome: calvingData.outcome || 'Normal',
        tag: calvingData.tag!,
        sex: calvingData.sex || 'Female',
        weight: calvingData.weight ? Number(calvingData.weight) : undefined,
        notes: calvingData.notes || '',
        created: now,
        updated: now
      };
      this.calvings.update(list => [newCalving, ...list]);

      // Automatically register the calf into Animals
      const newCalf: Animal = {
        id: this.generateId('CALF'),
        tag: calvingData.tag!,
        species: mother?.species || 'Cow',
        breed: mother?.breed || '',
        sex: calvingData.sex || 'Female',
        dob: calvingData.date!,
        mother: calvingData.mother!,
        sire: mother?.sire || '',
        farmer: mother?.farmer || '',
        status: 'Active',
        pregnant: false,
        calvingId,
        created: now,
        updated: now
      };
      this.animals.update(list => [newCalf, ...list]);

      // Reset mother pregnant status
      if (mother) {
        this.animals.update(list => list.map(a => a.id === mother.id ? {
          ...a,
          pregnant: false,
          status: 'Calved',
          due: '',
          updated: now
        } : a));
      }

      this.showToast('Delivery recorded and calf added to family tree.');
    }

    this.saveState();
    return true;
  }

  deleteCalving(calvingId: string) {
    this.animals.update(list => list.filter(a => a.calvingId !== calvingId));
    this.calvings.update(list => list.filter(c => c.id !== calvingId));
    this.saveState();
    this.showToast('Calving record and associated calf removed.');
  }

  // --- Bills CRUD ---
  saveBill(billData: Partial<BillRecord>, editId?: string): boolean {
    const now = this.getToday();
    if (!billData.farmer || !billData.date || !billData.type || billData.amount === undefined) {
      this.showToast('Farmer, Date, Service Type, and Amount are required.');
      return false;
    }

    const farmer = this.farmers().find(f => f.id === billData.farmer);
    const cow = this.animals().find(a => a.id === billData.cow);

    const billno = billData.billno || `BILL-${new Date().getFullYear()}-${String(this.bills().length + 1).padStart(4, '0')}`;

    const completeBill: BillRecord = {
      id: editId || this.generateId('BILL'),
      billno,
      farmer: billData.farmer!,
      farmerId: farmer?.id || '',
      date: billData.date!,
      type: billData.type!,
      cow: billData.cow,
      buffalo: billData.buffalo,
      animalType: cow?.species || '',
      animalTag: cow?.tag || '',
      amount: Number(billData.amount),
      payment: billData.payment || 'Pending',
      symptoms: billData.symptoms || '',
      serviceDetails: billData.serviceDetails || '',
      village: farmer?.village || '',
      taluka: farmer?.taluka || '',
      district: farmer?.district || '',
      address: billData.address || farmer?.address || '',
      notes: billData.notes || '',
      sentVia: billData.sentVia || '',
      created: editId ? (this.bills().find(b => b.id === editId)?.created || now) : now,
      updated: now
    };

    if (editId) {
      this.bills.update(list => list.map(b => b.id === editId ? completeBill : b));
      this.showToast('Bill updated.');
    } else {
      this.bills.update(list => [completeBill, ...list]);
      this.showToast('Bill saved in history.');
    }

    this.saveState();
    return true;
  }

  deleteBill(billId: string) {
    this.bills.update(list => list.filter(b => b.id !== billId));
    this.saveState();
    this.showToast('Bill removed.');
  }

  // --- Communication Helpers ---
  normalizeIndianMobile(raw?: string): string {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('0091')) return digits.slice(4);
    if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
    if (digits.length === 10) return digits;
    return '';
  }

  getWhatsAppUrl(mobile: string, message: string): string {
    const clean = this.normalizeIndianMobile(mobile);
    if (!clean) return '';
    return `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`;
  }

  getSMSUrl(mobile: string, message: string): string {
    const clean = this.normalizeIndianMobile(mobile);
    if (!clean) return '';
    return `sms:+91${clean}?body=${encodeURIComponent(message)}`;
  }

  generateSimpleBillText(b: BillRecord): string {
    const farmer = this.getFarmer(b.farmer);
    const lines = [
      ['Farmer', farmer?.name || '-'],
      ['Farmer ID', b.farmerId || farmer?.id || '-'],
      ['Date', this.formatDisplayDate(b.date)],
      ['Service', b.type || '-'],
      ['Animal', b.animalTag ? `${b.animalType} / ${b.animalTag}` : '-'],
      ['Amount', `₹${b.amount || 0}`],
      ['Payment', b.payment || '-'],
      ['Details', b.serviceDetails || '-'],
      ['Address', b.address || '-'],
      ['Bill No', b.billno || '-']
    ];
    const width = Math.max(...lines.map(x => x[0].length));
    const rows = lines.map(x => `${x[0].padEnd(width)} : ${x[1]}`);
    return `SATVIQ HELPER - BILL / SERVICE ENTRY\n\n${rows.join('\n')}\n\nThank you - SatviQ Helper`;
  }

  formatDisplayDate(s?: string): string {
    if (!s) return '-';
    const p = s.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  }

  exportCSV() {
    const rows: string[][] = [
      ['Type', 'ID', 'Farmer', 'Cattle / Ref', 'Date', 'Status / Result', 'Due', 'Amount', 'Notes']
    ];

    this.farmers().forEach(f => rows.push(['Farmer', f.id, f.name, '', f.created, 'Registered', '', '', f.notes || '']));
    this.animals().forEach(a => rows.push(['Animal', a.id, this.getFarmerName(a.farmer), a.tag, a.dob || '', a.pregnant ? 'Pregnant' : a.status, a.due || '', '', a.notes || '']));
    this.ai().forEach(x => rows.push(['AI', x.id, this.getFarmerName(this.getAnimal(x.animal)?.farmer), this.getAnimalTag(x.animal), x.date, 'Recorded', '', '', x.notes || '']));
    this.pd().forEach(x => rows.push(['PD', x.id, this.getFarmerName(this.getAnimal(x.animal)?.farmer), this.getAnimalTag(x.animal), x.date, x.result, '', '', x.notes || '']));
    this.calvings().forEach(x => rows.push(['Calving', x.id, this.getFarmerName(this.getAnimal(x.mother)?.farmer), x.tag, x.date, x.outcome, '', '', x.notes || '']));
    this.bills().forEach(x => rows.push(['Bill', x.id, this.getFarmerName(x.farmer), this.getAnimalTag(x.cow), x.date, x.payment, '', `₹${x.amount}`, x.notes || '']));

    const csvContent = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SatviQ_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV report exported successfully.');
  }
}
