import { getCollection } from "../../lib/mongo";
export async function listBatches() {
    const collection = await getCollection("batches");
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => doc.payload);
}
export async function getBatchById(batchId) {
    const collection = await getCollection("batches");
    const doc = await collection.findOne({ key: batchId });
    return doc?.payload;
}
export async function saveBatch(batch) {
    const collection = await getCollection("batches");
    const now = new Date().toISOString();
    await collection.insertOne({
        key: batch.batchId,
        payload: batch,
        createdAt: now,
        updatedAt: now,
    });
    return batch;
}
