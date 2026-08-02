export const BATCH_REGISTRY_ABI = [
  "function registerBatch(string batchId,string[] sourceSupplierIds,uint64 processingDate,string aiAssignedGrade,string exportDestination,uint64 logisticsHandoverTimestamp)",
  "function getBatch(string batchId) view returns ((string batchId,string[] sourceSupplierIds,uint64 processingDate,string aiAssignedGrade,string exportDestination,uint64 logisticsHandoverTimestamp,uint64 registeredAt))",
  "function batchExists(string batchId) view returns (bool)",
] as const;
