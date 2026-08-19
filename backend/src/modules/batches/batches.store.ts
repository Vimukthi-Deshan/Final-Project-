import { Batch } from "../../models/domain.types";
import { getCollection } from "../../lib/mongo";

interface PersistedBatch {
  key: string;
  payload: Batch;
  createdAt: string;
  updatedAt: string;
}

export async function listBatches(): Promise<Batch[]> {
  const collection = await getCollection<PersistedBatch>("batches");
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return docs.map((doc) => doc.payload);
}

export async function getBatchById(
  batchId: string,
): Promise<Batch | undefined> {
  const collection = await getCollection<PersistedBatch>("batches");
  const doc = await collection.findOne({ key: batchId });
  return doc?.payload;
}

export async function saveBatch(batch: Batch): Promise<Batch> {
  const collection = await getCollection<PersistedBatch>("batches");
  const now = new Date().toISOString();

  await collection.insertOne({
    key: batch.batchId,
    payload: batch,
    createdAt: now,
    updatedAt: now,
  });

  return batch;
}
