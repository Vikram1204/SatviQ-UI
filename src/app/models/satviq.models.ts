export interface Farmer {
  id: string;
  name: string;
  mobile: string;
  relative?: string;
  village?: string;
  taluka?: string;
  district?: string;
  address?: string;
  language?: string;
  notes?: string;
  created: string;
  updated: string;
}

export interface Animal {
  id: string;
  farmer: string; // farmer id
  tag: string;
  species: string; // Cow / Buffalo
  breed?: string;
  sex: string; // Female / Male
  dob?: string;
  mother?: string; // animal id
  sire?: string; // bull id/name
  mark?: string;
  notes?: string;
  status: string; // Active / Pregnant / AI Follow-up / PD Recheck / Calved
  pregnant: boolean;
  due?: string; // expected calving date YYYY-MM-DD
  calvingId?: string;
  created: string;
  updated: string;
}

export interface AIRecord {
  id: string;
  animal: string; // animal id
  date: string;
  tech?: string;
  bull?: string;
  batch?: string;
  attempt: number;
  notes?: string;
  created: string;
  updated: string;
}

export interface PDRecord {
  id: string;
  animal: string; // animal id
  date: string;
  result: 'Pregnant' | 'Not Pregnant' | 'Recheck';
  method: 'Clinical' | 'Ultrasound' | 'Other';
  days?: number;
  notes?: string;
  created: string;
  updated: string;
}

export interface CalvingRecord {
  id: string;
  mother: string; // animal id
  date: string;
  outcome: 'Normal' | 'Assisted' | 'Difficult' | 'Other';
  tag: string; // calf tag
  sex: 'Female' | 'Male';
  weight?: number;
  notes?: string;
  created: string;
  updated: string;
}

export interface BillRecord {
  id: string;
  billno: string;
  farmer: string; // farmer id
  farmerId?: string;
  date: string;
  type: string; // Service Type
  cow?: string; // animal id
  buffalo?: string;
  animalType?: string;
  animalTag?: string;
  amount: number;
  payment: 'Pending' | 'Paid' | 'Partially Paid';
  symptoms?: string;
  serviceDetails?: string;
  village?: string;
  taluka?: string;
  district?: string;
  address?: string;
  notes?: string;
  sentVia?: string;
  created: string;
  updated: string;
}

export interface DatabaseState {
  farmers: Farmer[];
  animals: Animal[];
  ai: AIRecord[];
  pd: PDRecord[];
  calvings: CalvingRecord[];
  bills: BillRecord[];
}
