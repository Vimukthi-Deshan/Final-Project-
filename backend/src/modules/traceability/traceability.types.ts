export interface RegisterBatchMetadataInput {
  batchId: string;
  sourceSupplierIds: string[];
  processingDate: number;
  aiAssignedGrade: "Alba" | "C5" | "C4" | "Mexico" | "Hamburg";
  exportDestination: string;
  logisticsHandoverTimestamp: number;
}

export interface OnChainBatchMetadata {
  batchId: string;
  sourceSupplierIds: string[];
  processingDate: number;
  aiAssignedGrade: string;
  exportDestination: string;
  logisticsHandoverTimestamp: number;
  registeredAt: number;
}

export interface RegistrationResult {
  txHash: string;
  contractAddress: string;
  network: "sepolia";
  chainId: number;
  blockNumber: number;
}
