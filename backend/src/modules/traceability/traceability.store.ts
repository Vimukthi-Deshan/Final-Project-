import { getCollection } from "../../lib/mongo";

export interface TraceabilityRecord {
  mongoDbId: string;
  dataHash?: string;
  productCount?: number;
  verifiedOnChain?: boolean;
  lastAction?: "record" | "verify" | "updateProducts" | "read";
  txHash?: string;
  network?: string;
  chainId?: number;
  contractAddress?: string;
  blockNumber?: number;
  recordedAt?: number;
  verificationTimestamp?: number;
  updatedAt: string;
}

export async function upsertTraceabilityRecord(
  mongoDbId: string,
  update: Omit<Partial<TraceabilityRecord>, "mongoDbId">,
): Promise<void> {
  const collection = await getCollection<TraceabilityRecord>(
    "traceability_records",
  );
  const now = new Date().toISOString();

  await collection.updateOne(
    { mongoDbId },
    {
      $set: {
        mongoDbId,
        ...update,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}
