import { randomUUID } from "node:crypto";

import { Router } from "express";
import { z } from "zod";

import { HttpError } from "../../middleware/http-error";
import { ok } from "../../middleware/response-envelope";

const documentTypeEnum = z.enum([
  "quotation",
  "proforma_invoice",
  "packing_list",
  "certificate_of_origin",
]);

const exportDocSchema = z.object({
  documentType: documentTypeEnum,
  batchId: z.string().min(1),
  supplierRefs: z.array(z.string()).optional().default([]),
  payload: z.record(z.unknown()).optional().default({}),
});

const router = Router();

router.post("/export-docs/generate", (req, res) => {
  const parsed = exportDocSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(
      400,
      "INVALID_EXPORT_DOC_PAYLOAD",
      "Export document payload is invalid",
      {
        issues: parsed.error.issues,
      },
    );
  }

  const doc = {
    documentId: `DOC-${randomUUID()}`,
    generatedAt: new Date().toISOString(),
    ...parsed.data,
  };

  res.status(201).json(ok(doc));
});

export default router;
