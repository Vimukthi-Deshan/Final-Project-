export type CinnamonGrade = "Alba" | "C5" | "C4" | "Mexico" | "Hamburg";

export type SupplierCompanySize = "startup" | "small" | "medium" | "large";

export type SupplierAvailability = "in_stock" | "made_to_order" | "seasonal";

export type SupplierStatus = "active" | "inactive" | "blacklisted";

export type SupplierVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export interface SupplierProduct {
  productName: string;
  productDescription?: string;
  hsCode?: string;
  quantity: number;
  quantityUnit?: string;
  price: number;
  currency?: string;
  grade?: string;
  minimumOrder?: number;
  availability?: SupplierAvailability;
  leadTime?: number;
  certifications?: string[];
}

export interface SupplierBlockchainRef {
  txId?: string;
  network?: string;
  chainId?: number;
  contractAddress?: string;
  hash?: string;
  explorerUrl?: string;
  recordedAt?: string;
}

export interface SupplierVerification {
  status?: SupplierVerificationStatus;
  verifiedBy?: string;
  verificationDate?: string;
  verificationNotes?: string;
  documentsRequired?: string[];
  documentsProvided?: string[];
}

export interface SupplierReview {
  rating: number;
  comment?: string;
  reviewedBy?: string;
  reviewDate?: string;
}

export interface Supplier {
  supplierName: string;
  businessLicense?: string;
  registrationNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zipCode?: string;
  companyDescription?: string;
  yearEstablished?: number;
  companySize?: SupplierCompanySize;
  products?: SupplierProduct[];
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  swift?: string;
  paymentTerms?: string;
  blockchainRef?: SupplierBlockchainRef;
  verification?: SupplierVerification;
  qualityRating?: number;
  certifications?: string[];
  reviews?: SupplierReview[];
  status?: SupplierStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
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
  verifyUrl?: string;
  qrValue?: string;
  qrCodeDataUrl?: string;
}
