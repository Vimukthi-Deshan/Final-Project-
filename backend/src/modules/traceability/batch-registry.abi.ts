export const BATCH_REGISTRY_ABI = [
  "function recordSupplier(string mongoDbId,bytes32 dataHash,uint256 productCount) returns (bool)",
  "function verifySupplier(string mongoDbId) returns (bool)",
  "function updateProductCount(string mongoDbId,uint256 newProductCount) returns (bool)",
  "function getSupplier(string mongoDbId) view returns ((bytes32 dataHash,address recordedBy,uint256 recordedAt,bool isVerified,address verifiedBy,uint256 verificationTimestamp,uint256 productCount,string mongoDbId))",
  "function verifySupplierHash(string mongoDbId,bytes32 dataHash) view returns (bool)",
  "function isSupplierVerified(string mongoDbId) view returns (bool)",
  "function registeredSuppliers(string mongoDbId) view returns (bool)",
  "function totalSuppliers() view returns (uint256)",
] as const;
