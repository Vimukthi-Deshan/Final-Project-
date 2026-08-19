import { Collection, Db, Document, MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;

let clientPromise: Promise<MongoClient> | null = null;
let databasePromise: Promise<Db> | null = null;

function resolveDbNameFromUri(uri: string): string | null {
  try {
    const url = new URL(uri);
    const path = url.pathname.replace(/^\/+/, "").trim();
    return path.length > 0 ? path : null;
  } catch {
    return null;
  }
}

async function getClient(): Promise<MongoClient> {
  if (!mongoUri) {
    throw new Error("Missing MongoDB configuration. Set MONGODB_URI.");
  }

  if (!clientPromise) {
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    const client = await getClient();
    const dbName =
      mongoDbName ?? resolveDbNameFromUri(mongoUri as string) ?? "trace_test";
    return client.db(dbName);
  })();

  return databasePromise;
}

export async function getCollection<T extends Document = Document>(
  collectionName: string,
): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

export async function initMongo(): Promise<void> {
  const suppliers = await getCollection("suppliers");
  const batches = await getCollection("batches");
  const traceability = await getCollection("traceability_records");
  const forecastingDailyRows = await getCollection("forecasting_daily_rows");
  const forecastingIngestions = await getCollection("forecasting_ingestions");

  await suppliers.createIndex({ key: 1 }, { unique: true });
  await batches.createIndex({ key: 1 }, { unique: true });
  await traceability.createIndex({ mongoDbId: 1 }, { unique: true });
  await forecastingDailyRows.createIndex({ key: 1 }, { unique: true });
  await forecastingIngestions.createIndex({ key: 1 }, { unique: true });
}
