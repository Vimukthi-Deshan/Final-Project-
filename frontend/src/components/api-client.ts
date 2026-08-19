type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    if (payload && "error" in payload) {
      throw new Error(payload.error.message);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!("success" in payload) || payload.success !== true) {
    throw new Error("Unexpected API response envelope");
  }

  return payload.data;
}

export interface SupplierPayload {
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
  companySize?: "startup" | "small" | "medium" | "large";
  products: Array<{
    productName: string;
    productDescription?: string;
    hsCode?: string;
    quantity: number;
    quantityUnit?: string;
    price: number;
    currency?: string;
    grade?: string;
    minimumOrder?: number;
    availability?: "in_stock" | "made_to_order" | "seasonal";
    leadTime?: number;
    certifications?: string[];
  }>;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  swift?: string;
  paymentTerms?: string;
  blockchainRef?: {
    txId?: string;
    network?: string;
    contractAddress?: string;
    hash?: string;
    explorerUrl?: string;
    recordedAt?: string;
  };
  verification?: {
    status?: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
    verifiedBy?: string;
    verificationDate?: string;
    verificationNotes?: string;
    documentsRequired?: string[];
    documentsProvided?: string[];
  };
  qualityRating?: number;
  certifications: string[];
  reviews: Array<{
    rating: number;
    comment?: string;
    reviewedBy?: string;
    reviewDate?: string;
  }>;
  status?: "active" | "inactive" | "blacklisted";
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchPayload {
  batchId: string;
  sourceSuppliers: Array<{ supplierId: string; contributionKg: number }>;
  processingDate: string;
  qualityGrade?: "Alba" | "C5" | "C4" | "Mexico" | "Hamburg";
  exportDestination: string;
  logisticsHandoverAt?: string;
  verifyUrl?: string;
  qrValue?: string;
  qrCodeDataUrl?: string;
}

export type BatchCreatePayload = Omit<
  BatchPayload,
  "batchId" | "verifyUrl" | "qrValue" | "qrCodeDataUrl"
>;

export async function fetchHealth() {
  return request<{ status: string; service: string; version: string }>(
    "/health",
  );
}

export async function listSuppliers() {
  return request<SupplierPayload[]>("/suppliers");
}

export async function createSupplier(payload: SupplierPayload) {
  return request<SupplierPayload>("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listBatches() {
  return request<BatchPayload[]>("/batches");
}

export async function createBatch(payload: BatchCreatePayload) {
  return request<BatchPayload>("/batches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchInventory() {
  return request<Array<{ grade: string; quantityKg: number }>>("/inventory");
}

export interface GradingPredictionResponse {
  predicted_grade: string;
  model: string;
  track_label: string;
}

export async function predictGrading(payload: {
  diameterMm: number;
  colorCategory: string;
  textureCategory: string;
}) {
  return request<GradingPredictionResponse>("/grading/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function predictForecast(payload: {
  model: "naive" | "arima" | "prophet" | "lstm";
  horizonDays: number;
}) {
  return request<Record<string, unknown>>("/forecasting/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ForecastIngestionResponse {
  ingestion: {
    ingestionId: string;
    mergedFilePath: string;
    target: string;
    rows: number;
    columnsUsed: {
      website: string[];
      daraz: string[];
      merged: string[];
    };
  };
  forecast: Record<string, unknown>;
}

export async function ingestAndPredictForecast(payload: {
  model: "naive" | "arima" | "prophet" | "lstm";
  horizonDays: number;
  websiteFile?: File;
  darazFile?: File;
}) {
  const formData = new FormData();
  formData.append("model", payload.model);
  formData.append("horizonDays", String(payload.horizonDays));

  if (payload.websiteFile) {
    formData.append("websiteFile", payload.websiteFile);
  }
  if (payload.darazFile) {
    formData.append("darazFile", payload.darazFile);
  }

  const response = await fetch(
    `${API_BASE_URL}/forecasting/ingest-and-predict`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data =
    (await response.json()) as ApiEnvelope<ForecastIngestionResponse>;

  if (!response.ok) {
    if (data && "error" in data) {
      throw new Error(data.error.message);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!data.success) {
    throw new Error("Unexpected API response envelope");
  }

  return data.data;
}

export interface SupplierChainRecordPayload {
  dataHash: string;
  productCount: number;
}

export async function recordSupplierOnChain(
  mongoDbId: string,
  payload: SupplierChainRecordPayload,
) {
  return request<Record<string, unknown>>(
    `/blockchain-registration/${mongoDbId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function markSupplierVerifiedOnChain(mongoDbId: string) {
  return request<Record<string, unknown>>(
    `/blockchain-registration/${mongoDbId}/verify`,
    {
      method: "POST",
    },
  );
}

export async function updateSupplierProductCountOnChain(
  mongoDbId: string,
  productCount: number,
) {
  return request<Record<string, unknown>>(
    `/blockchain-registration/${mongoDbId}/products`,
    {
      method: "PATCH",
      body: JSON.stringify({ productCount }),
    },
  );
}

export async function verifySupplierOnChain(mongoDbId: string) {
  return request<Record<string, unknown>>(`/verify/${mongoDbId}`);
}

export async function verifySupplierHashOnChain(
  mongoDbId: string,
  dataHash: string,
) {
  return request<{ valid: boolean }>(`/verify/${mongoDbId}/hash/${dataHash}`);
}

export interface BatchHybridVerificationResponse {
  batch: {
    batchId: string;
    processingDate: string;
    qualityGrade: "Alba" | "C5" | "C4" | "Mexico" | "Hamburg" | null;
    exportDestination: string;
    logisticsHandoverAt: string | null;
  };
  summary: {
    totalSuppliers: number;
    registeredSuppliers: number;
    verifiedSuppliers: number;
    allSuppliersVerified: boolean;
  };
  supplierChecks: Array<{
    supplierId: string;
    contributionKg: number;
    onChainRegistered: boolean;
    onChainVerified: boolean;
    dataHash: string | null;
    recordedAt: number | null;
    verificationTimestamp: number | null;
    error: string | null;
  }>;
}

export async function verifyBatchHybrid(batchId: string) {
  return request<BatchHybridVerificationResponse>(
    `/traceability/batches/${batchId}/verify`,
  );
}
