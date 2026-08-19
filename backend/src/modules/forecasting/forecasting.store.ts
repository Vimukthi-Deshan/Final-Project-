import { getCollection } from "../../lib/mongo";

export interface ForecastDailyRow {
  date: string;
  paidOrderCount: number;
  paidRevenue: number;
  sources: string[];
}

interface PersistedDailyRow {
  key: string;
  payload: ForecastDailyRow;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastIngestionRecord {
  ingestionId: string;
  sourceFiles: {
    website?: string;
    daraz?: string;
  };
  inputRows: {
    website: number;
    daraz: number;
  };
  dailyRows: number;
  mergedTarget: string;
  createdAt: string;
}

interface PersistedIngestionRecord {
  key: string;
  payload: ForecastIngestionRecord;
  createdAt: string;
  updatedAt: string;
}

export async function upsertForecastDailyRows(
  rows: ForecastDailyRow[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const collection = await getCollection<PersistedDailyRow>(
    "forecasting_daily_rows",
  );
  const now = new Date().toISOString();

  await Promise.all(
    rows.map((row) =>
      collection.updateOne(
        { key: row.date },
        {
          $set: {
            key: row.date,
            payload: row,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      ),
    ),
  );
}

export async function saveForecastIngestionRecord(
  record: ForecastIngestionRecord,
): Promise<void> {
  const collection = await getCollection<PersistedIngestionRecord>(
    "forecasting_ingestions",
  );

  await collection.insertOne({
    key: record.ingestionId,
    payload: record,
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  });
}
