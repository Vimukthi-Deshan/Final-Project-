import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../middleware/http-error";
import { ok } from "../../middleware/response-envelope";
const forecastingSchema = z.object({
    model: z.enum(["naive", "arima", "prophet", "lstm"]),
    horizonDays: z.number().int().min(1).max(90),
});
const router = Router();
router.post("/forecasting/predict", async (req, res) => {
    const parsed = forecastingSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new HttpError(400, "INVALID_FORECAST_PAYLOAD", "Forecasting payload is invalid", {
            issues: parsed.error.issues,
        });
    }
    const forecastingServiceUrl = process.env.FORECASTING_SERVICE_URL ?? "http://127.0.0.1:8002";
    try {
        const response = await fetch(`${forecastingServiceUrl}/predict`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                model: parsed.data.model,
                horizon_days: parsed.data.horizonDays,
            }),
        });
        if (!response.ok) {
            throw new Error(`Forecasting service responded with ${response.status}`);
        }
        const data = (await response.json());
        res.status(200).json(ok(data));
    }
    catch (error) {
        throw new HttpError(502, "FORECASTING_SERVICE_UNAVAILABLE", "Could not reach forecasting service", {
            serviceUrl: forecastingServiceUrl,
            reason: error instanceof Error ? error.message : "unknown",
        });
    }
});
export default router;
