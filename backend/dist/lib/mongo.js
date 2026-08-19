import { MongoClient } from "mongodb";
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;
let clientPromise = null;
let databasePromise = null;
function resolveDbNameFromUri(uri) {
    try {
        const url = new URL(uri);
        const path = url.pathname.replace(/^\/+/, "").trim();
        return path.length > 0 ? path : null;
    }
    catch {
        return null;
    }
}
async function getClient() {
    if (!mongoUri) {
        throw new Error("Missing MongoDB configuration. Set MONGODB_URI.");
    }
    if (!clientPromise) {
        const client = new MongoClient(mongoUri);
        clientPromise = client.connect();
    }
    return clientPromise;
}
export async function getDatabase() {
    if (databasePromise) {
        return databasePromise;
    }
    databasePromise = (async () => {
        const client = await getClient();
        const dbName = mongoDbName ?? resolveDbNameFromUri(mongoUri) ?? "trace_test";
        return client.db(dbName);
    })();
    return databasePromise;
}
export async function getCollection(collectionName) {
    const db = await getDatabase();
    return db.collection(collectionName);
}
export async function initMongo() {
    const suppliers = await getCollection("suppliers");
    const batches = await getCollection("batches");
    const traceability = await getCollection("traceability_records");
    await suppliers.createIndex({ key: 1 }, { unique: true });
    await batches.createIndex({ key: 1 }, { unique: true });
    await traceability.createIndex({ mongoDbId: 1 }, { unique: true });
}
