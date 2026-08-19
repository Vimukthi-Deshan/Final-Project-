export interface RecordSupplierInput {
  mongoDbId: string;
  dataHash: string;
  productCount: number;
}

export interface VerifySupplierInput {
  mongoDbId: string;
}

export interface UpdateSupplierProductsInput {
  mongoDbId: string;
  productCount: number;
}

export interface OnChainSupplierRecord {
  mongoDbId: string;
  dataHash: string;
  recordedBy: string;
  recordedAt: number;
  isVerified: boolean;
  verifiedBy: string;
  verificationTimestamp: number;
  productCount: number;
  isRegistered: boolean;
}

export interface RegistrationResult {
  txHash: string;
  contractAddress: string;
  network: "sepolia";
  chainId: number;
  blockNumber: number;
}
