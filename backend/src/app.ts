import "dotenv/config";

import cors from "cors";
import express from "express";
import morgan from "morgan";

import { errorHandler } from "./middleware/error-handler";
import { ok } from "./middleware/response-envelope";
import { rateLimiter } from "./middleware/rate-limiter";
import apiV1Router from "./routes/api-v1.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));
  app.use(rateLimiter);

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json(
      ok({
        status: "ok",
        service: "canela-ceylon-backend",
        version: "0.1.0",
      }),
    );
  });

  app.use("/api/v1", apiV1Router);

  app.use(errorHandler);

  return app;
}
