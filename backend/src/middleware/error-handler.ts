import type { NextFunction, Request, Response } from "express";

import { fail } from "./response-envelope";
import { HttpError } from "./http-error";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    const httpError = error;
    res
      .status(httpError.statusCode)
      .json(fail(httpError.code, httpError.message, httpError.details));
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json(fail("INTERNAL_SERVER_ERROR", message));
}
