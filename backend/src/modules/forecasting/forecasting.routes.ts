import { Router } from "express";
import { parse } from "csv-parse/sync";
import multer from "multer";
import path from "node:path";
import { promises as fs } from "node:fs";
import { z } from "zod";

import { HttpError } from "../../middleware/http-error";
import { ok } from "../../middleware/response-envelope";
import {
  saveForecastIngestionRecord,
  upsertForecastDailyRows,
  type ForecastDailyRow,
} from "./forecasting.store";

const forecastingSchema = z.object({
  model: z.enum(["naive", "arima", "prophet", "lstm"]),
  horizonDays: z.number().int().min(1).max(90),
});

const forecastingIngestionSchema = z.object({
  model: z.enum(["naive", "arima", "prophet", "lstm"]),
  horizonDays: z.coerce.number().int().min(1).max(90),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const forecastDataOutputPath = path.resolve(
  process.cwd(),
  "..",
  "ai-services",
  "forecasting",
  "merged_daily_paid_orders.csv",
);

const router = Router();

type GenericCsvRow = Record<string, string>;

function parseCsvRows(buffer: Buffer): GenericCsvRow[] {
  const rows = parse(buffer.toString("utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return rows as GenericCsvRow[];
}

function toCaseInsensitiveLookup(row: GenericCsvRow): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    lookup[key.trim().toLowerCase()] = String(value ?? "").trim();
  }
  return lookup;
}

function pickValue(
  lookup: Record<string, string>,
  candidates: string[],
): string | undefined {
  for (const key of candidates) {
    const value = lookup[key.toLowerCase()];
    if (value) {
      return value;
    }
  }
  return undefined;
}

function parseDateToDay(raw: string): string | undefined {
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) {
    return undefined;
  }

  const day = Number(slashMatch[1]);
  const month = Number(slashMatch[2]);
  const year = Number(slashMatch[3]);
  const manual = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(manual.getTime())) {
    return undefined;
  }
  return manual.toISOString().slice(0, 10);
}

function parseNumber(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }

  const cleaned = raw.replace(/,/g, "").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRows(
  rows: GenericCsvRow[],
  source: string,
): ForecastDailyRow[] {
  const daily = new Map<string, ForecastDailyRow>();

  for (const row of rows) {
    const lookup = toCaseInsensitiveLookup(row);

    const paymentStatus = pickValue(lookup, [
      "paymentstatus",
      "payment_status",
      "financial_status",
    ]);
    if (paymentStatus && paymentStatus.toLowerCase() !== "paid") {
      continue;
    }

    const dateRaw = pickValue(lookup, [
      "createdat",
      "createtime",
      "paymentconfirmedat",
      "createddate",
      "date",
      "orderdate",
    ]);
    if (!dateRaw) {
      continue;
    }

    const day = parseDateToDay(dateRaw);
    if (!day) {
      continue;
    }

    const revenue = Math.max(
      0,
      parseNumber(
        pickValue(lookup, [
          "total",
          "paidprice",
          "paid_price",
          "amount",
          "orderamount",
        ]),
      ),
    );

    const existing = daily.get(day);
    if (!existing) {
      daily.set(day, {
        date: day,
        paidOrderCount: 1,
        paidRevenue: revenue,
        sources: [source],
      });
      continue;
    }

    existing.paidOrderCount += 1;
    existing.paidRevenue += revenue;
    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }
  }

  return Array.from(daily.values());
}

function mergeDailyRows(rows: ForecastDailyRow[]): ForecastDailyRow[] {
  const merged = new Map<string, ForecastDailyRow>();

  for (const row of rows) {
    const existing = merged.get(row.date);
    if (!existing) {
      merged.set(row.date, {
        date: row.date,
        paidOrderCount: row.paidOrderCount,
        paidRevenue: row.paidRevenue,
        sources: [...row.sources],
      });
      continue;
    }

    existing.paidOrderCount += row.paidOrderCount;
    existing.paidRevenue += row.paidRevenue;
    for (const source of row.sources) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function toMergedCsv(rows: ForecastDailyRow[]): string {
  const header = "date,paid_order_count,paid_revenue,sources";
  const body = rows.map((row) => {
    const revenue = row.paidRevenue.toFixed(2);
    const sources = row.sources.join("+");
    return `${row.date},${row.paidOrderCount},${revenue},${sources}`;
  });
  return `${[header, ...body].join("\n")}\n`;
}

async function callForecastService(payload: {
  model: "naive" | "arima" | "prophet" | "lstm";
  horizonDays: number;
  customSeries?: number[];
}): Promise<Record<string, unknown>> {
  const forecastingServiceUrl =
    process.env.FORECASTING_SERVICE_URL ?? "http://127.0.0.1:8002";

  const response = await fetch(`${forecastingServiceUrl}/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: payload.model,
      horizon_days: payload.horizonDays,
      custom_series: payload.customSeries,
    }),
  });

  if (!response.ok) {
    throw new Error(`Forecasting service responded with ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

router.post("/forecasting/predict", async (req, res, next) => {
  const parsed = forecastingSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new HttpError(
        400,
        "INVALID_FORECAST_PAYLOAD",
        "Forecasting payload is invalid",
        {
          issues: parsed.error.issues,
        },
      ),
    );
  }

  try {
    const data = await callForecastService({
      model: parsed.data.model,
      horizonDays: parsed.data.horizonDays,
    });
    res.status(200).json(ok(data));
  } catch (error) {
    const forecastingServiceUrl =
      process.env.FORECASTING_SERVICE_URL ?? "http://127.0.0.1:8002";
    return next(
      new HttpError(
        502,
        "FORECASTING_SERVICE_UNAVAILABLE",
        "Could not reach forecasting service",
        {
          serviceUrl: forecastingServiceUrl,
          reason: error instanceof Error ? error.message : "unknown",
        },
      ),
    );
  }
});

router.post(
  "/forecasting/ingest-and-predict",
  upload.fields([
    { name: "websiteFile", maxCount: 1 },
    { name: "darazFile", maxCount: 1 },
  ]),
  async (req, res, next) => {
    const parsed = forecastingIngestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new HttpError(
          400,
          "INVALID_FORECAST_INGEST_PAYLOAD",
          "Forecast ingestion payload is invalid",
          { issues: parsed.error.issues },
        ),
      );
    }

    const files = req.files as
      | {
          websiteFile?: Express.Multer.File[];
          darazFile?: Express.Multer.File[];
        }
      | undefined;

    const website = files?.websiteFile?.[0];
    const daraz = files?.darazFile?.[0];

    if (!website && !daraz) {
      return next(
        new HttpError(
          400,
          "MISSING_FORECAST_FILES",
          "Upload at least one CSV file (websiteFile or darazFile)",
        ),
      );
    }

    let websiteRows: GenericCsvRow[] = [];
    let darazRows: GenericCsvRow[] = [];

    try {
      if (website) {
        websiteRows = parseCsvRows(website.buffer);
      }
      if (daraz) {
        darazRows = parseCsvRows(daraz.buffer);
      }
    } catch (error) {
      return next(
        new HttpError(400, "INVALID_CSV", "Unable to parse uploaded CSV", {
          reason: error instanceof Error ? error.message : "unknown",
        }),
      );
    }

    const normalized = mergeDailyRows([
      ...normalizeRows(websiteRows, "website"),
      ...normalizeRows(darazRows, "daraz"),
    ]);

    if (normalized.length === 0) {
      return next(
        new HttpError(
          400,
          "EMPTY_FORECAST_SERIES",
          "No usable paid-order rows remained after cleaning",
        ),
      );
    }

    const ingestionId = `ingest_${Date.now()}`;
    const now = new Date().toISOString();

    await fs.writeFile(
      forecastDataOutputPath,
      toMergedCsv(normalized),
      "utf-8",
    );
    await upsertForecastDailyRows(normalized);
    await saveForecastIngestionRecord({
      ingestionId,
      sourceFiles: {
        website: website?.originalname,
        daraz: daraz?.originalname,
      },
      inputRows: {
        website: websiteRows.length,
        daraz: darazRows.length,
      },
      dailyRows: normalized.length,
      mergedTarget: "paid_order_count",
      createdAt: now,
    });

    try {
      const forecast = await callForecastService({
        model: parsed.data.model,
        horizonDays: parsed.data.horizonDays,
        customSeries: normalized.map((row) => row.paidOrderCount),
      });

      res.status(200).json(
        ok({
          ingestion: {
            ingestionId,
            mergedFilePath: forecastDataOutputPath,
            target: "paid_order_count",
            rows: normalized.length,
            columnsUsed: {
              website: ["createdAt", "paymentStatus", "total"],
              daraz: [
                "createTime",
                "paymentConfirmedAt",
                "paymentStatus",
                "paidPrice",
              ],
              merged: ["date", "paid_order_count", "paid_revenue", "sources"],
            },
          },
          forecast,
        }),
      );
    } catch (error) {
      const forecastingServiceUrl =
        process.env.FORECASTING_SERVICE_URL ?? "http://127.0.0.1:8002";
      return next(
        new HttpError(
          502,
          "FORECASTING_SERVICE_UNAVAILABLE",
          "Could not reach forecasting service",
          {
            serviceUrl: forecastingServiceUrl,
            reason: error instanceof Error ? error.message : "unknown",
            ingestionId,
          },
        ),
      );
    }
  },
);

export default router;
