import { Router } from "express";
import { z } from "zod";

import { HttpError } from "../../middleware/http-error";
import { ok } from "../../middleware/response-envelope";

const gradingSchema = z.object({
  diameterMm: z.number(),
  colorCategory: z.enum([
    "pale_golden_tan",
    "deep_yellow_golden_brown",
    "medium_brown_with_patches",
    "rough_dark_brown",
  ]),
  textureCategory: z.enum([
    "immaculate",
    "very_clean_under_15_percent_spots",
    "moderately_patchy_40_to_60_percent",
    "rough_heavily_discoloured",
  ]),
});

const router = Router();

router.post("/grading/predict", async (req, res) => {
  const parsed = gradingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(
      400,
      "INVALID_GRADING_PAYLOAD",
      "Grading payload is invalid",
      {
        issues: parsed.error.issues,
      },
    );
  }

  const gradingServiceUrl =
    process.env.GRADING_SERVICE_URL ?? "http://127.0.0.1:8001";

  try {
    const response = await fetch(`${gradingServiceUrl}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        diameter_mm: parsed.data.diameterMm,
        color_category: parsed.data.colorCategory,
        texture_category: parsed.data.textureCategory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grading service responded with ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    res.status(200).json(ok(data));
  } catch (error) {
    throw new HttpError(
      502,
      "GRADING_SERVICE_UNAVAILABLE",
      "Could not reach grading service",
      {
        serviceUrl: gradingServiceUrl,
        reason: error instanceof Error ? error.message : "unknown",
      },
    );
  }
});

export default router;
