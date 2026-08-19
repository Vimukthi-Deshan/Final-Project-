import { Router } from "express";
import QRCode from "qrcode";
import { z } from "zod";

import { fail, ok } from "../../middleware/response-envelope";
import { getBatchById, listBatches, saveBatch } from "./batches.store";

const batchIdPattern = /^CC-BATCH-[0-9]{4}-[0-9]{2}-[0-9]{5}$/;

function buildVerifyUrl(batchId: string): string {
  const baseUrl =
    process.env.PUBLIC_VERIFY_BASE_URL ?? "http://127.0.0.1:5173/verify";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}batchId=${encodeURIComponent(batchId)}`;
}

const batchSchema = z.object({
  sourceSuppliers: z
    .array(
      z.object({
        supplierId: z.string().min(1),
        contributionKg: z.number().positive(),
      }),
    )
    .min(1, "At least one supplier contribution is required"),
  processingDate: z.string(),
  qualityGrade: z.enum(["Alba", "C5", "C4", "Mexico", "Hamburg"]).optional(),
  exportDestination: z.string().min(2),
  logisticsHandoverAt: z.string().optional(),
});

function generateBatchId(existingBatchIds: string[]): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CC-BATCH-${year}-${month}-`;

  const maxSequence = existingBatchIds.reduce((highest, batchId) => {
    if (!batchId.startsWith(prefix) || !batchIdPattern.test(batchId)) {
      return highest;
    }

    const sequence = Number(batchId.slice(-5));
    return Number.isFinite(sequence) && sequence > highest ? sequence : highest;
  }, 0);

  const nextSequence = String(maxSequence + 1).padStart(5, "0");
  return `${prefix}${nextSequence}`;
}

const router = Router();

router.get("/batches", async (_req, res) => {
  try {
    const batches = await listBatches();
    res.status(200).json(ok(batches));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown batch list error";
    res.status(500).json(fail("BATCH_LIST_FAILED", message));
  }
});

router.post("/batches", async (req, res) => {
  try {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        fail("INVALID_BATCH_PAYLOAD", "Batch payload is invalid", {
          issues: parsed.error.issues,
        }),
      );
      return;
    }

    const existingBatches = await listBatches();
    const normalizedBatchId = generateBatchId(
      existingBatches.map((batch) => batch.batchId),
    );
    const existing = await getBatchById(normalizedBatchId);
    if (existing) {
      res.status(409).json(fail("BATCH_EXISTS", "Batch ID already exists"));
      return;
    }

    const verifyUrl = buildVerifyUrl(normalizedBatchId);
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
    });

    const saved = await saveBatch({
      ...parsed.data,
      batchId: normalizedBatchId,
      verifyUrl,
      qrValue: verifyUrl,
      qrCodeDataUrl,
    });
    res.status(201).json(ok(saved));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown batch create error";
    res.status(500).json(fail("BATCH_CREATE_FAILED", message));
  }
});

export default router;
