import { randomUUID } from "node:crypto";

import { Router } from "express";
import { z } from "zod";

import { HttpError } from "../../middleware/http-error";
import { fail, ok } from "../../middleware/response-envelope";
import { requireAuth } from "../../middleware/auth.middleware";
import { getInvoiceById, listInvoices, saveInvoice } from "./export-docs.store";

const partySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  contact: z.string().min(1),
  email: z.string().email(),
  taxId: z.string().optional(),
});

const itemSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  hsCode: z.string().optional(),
  quantityUnit: z.string().optional(),
  netWeight: z.number().nonnegative().optional(),
  grossWeight: z.number().nonnegative().optional(),
  grade: z.string().optional(),
  batchId: z.string().optional(),
});

const invoiceSchema = z.object({
  batchId: z.string().min(1),
  type: z.enum(["PROFORMA", "COMMERCIAL"]).default("PROFORMA"),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().default("USD"),
  seller: partySchema,
  buyer: partySchema,
  items: z.array(itemSchema).min(1),
  incoterm: z.string().optional(),
  incotermNamedPlace: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  paymentTerms: z
    .object({ term: z.string(), notes: z.string().optional() })
    .optional(),
  amountInWords: z.string().optional(),
  countryOfOrigin: z.string().optional(),
});

const router = Router();

router.post("/export-docs/generate", requireAuth, async (req, res, next) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new HttpError(
        400,
        "INVALID_EXPORT_DOC_PAYLOAD",
        "Invoice payload is invalid",
        {
          issues: parsed.error.issues,
        },
      ),
    );
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const items = d.items.map((item) => ({
    ...item,
    lineTotal: Math.round(item.price * item.quantity * 100) / 100,
  }));
  const total =
    Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;

  const invoice = {
    documentId: `INV-${randomUUID().slice(0, 8).toUpperCase()}`,
    batchId: d.batchId,
    type: d.type,
    date: d.date ?? now,
    dueDate: d.dueDate,
    currency: d.currency,
    seller: d.seller,
    buyer: d.buyer,
    items,
    total,
    paymentStatus: "unpaid" as const,
    incoterm: d.incoterm,
    incotermNamedPlace: d.incotermNamedPlace,
    portOfLoading: d.portOfLoading,
    portOfDischarge: d.portOfDischarge,
    paymentTerms: d.paymentTerms,
    amountInWords: d.amountInWords,
    countryOfOrigin: d.countryOfOrigin,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const saved = await saveInvoice(invoice);
    res.status(201).json(ok(saved));
  } catch (error) {
    return next(
      new HttpError(500, "INVOICE_SAVE_FAILED", "Failed to persist invoice"),
    );
  }
});

router.get("/export-docs", async (_req, res, next) => {
  try {
    const invoices = await listInvoices();
    res.status(200).json(ok(invoices));
  } catch (error) {
    return next(
      new HttpError(500, "INVOICE_LIST_FAILED", "Failed to list invoices"),
    );
  }
});

router.get("/export-docs/:documentId", async (req, res) => {
  const invoice = await getInvoiceById(req.params.documentId);
  if (!invoice) {
    res
      .status(404)
      .json(
        fail("INVOICE_NOT_FOUND", `Invoice ${req.params.documentId} not found`),
      );
    return;
  }
  res.status(200).json(ok(invoice));
});

export default router;
