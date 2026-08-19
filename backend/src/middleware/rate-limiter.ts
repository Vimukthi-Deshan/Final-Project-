import type { NextFunction, Request, Response } from "express";

import { fail } from "./response-envelope";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const requestStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = requestStore.get(key);

  if (!current || now > current.resetAt) {
    requestStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    res
      .status(429)
      .json(
        fail("RATE_LIMIT_EXCEEDED", "Too many requests. Please retry shortly."),
      );
    return;
  }

  current.count += 1;
  requestStore.set(key, current);
  next();
}
