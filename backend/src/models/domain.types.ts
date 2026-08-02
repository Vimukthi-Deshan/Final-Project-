export type CinnamonGrade = "Alba" | "C5" | "C4" | "Mexico" | "Hamburg";

export interface SupplierContact {
  email: string;
  phone: string;
  address: string;
}

export interface SupplierPerformanceRecord {
  date: string;
  score: number;
  note?: string;
}

export interface Supplier {
  supplierId: string;
  name: string;
  contact: SupplierContact;
  region: string;
  certifications: string[];
  performanceHistory: SupplierPerformanceRecord[];
}

export interface BatchSupplierContribution {
  supplierId: string;
  contributionKg: number;
}

export interface Batch {
  batchId: string;
  sourceSuppliers: BatchSupplierContribution[];
  processingDate: string;
  qualityGrade?: CinnamonGrade;
  exportDestination: string;
  logisticsHandoverAt?: string;
}
