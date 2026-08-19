import { getCollection } from "../../lib/mongo";
export async function upsertTraceabilityRecord(mongoDbId, update) {
    const collection = await getCollection("traceability_records");
    const now = new Date().toISOString();
    await collection.updateOne({ mongoDbId }, {
        $set: {
            mongoDbId,
            ...update,
            updatedAt: now,
        },
    }, { upsert: true });
}
