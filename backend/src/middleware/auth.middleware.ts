import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { fail } from './response-envelope';
import { JwtPayload, UserRole } from "../modules/auth/auth.types";


export const JWT_SECRET =
  process.env.JWT_SECRET ?? "canela-dev-secret-change-in-prod";
export const JWT_EXPIRES_IN = "12h";

// Attach decoded JWT to request so downstream handlers can read req.user.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json(fail("UNAUTHORIZED", "Authentication required"));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(fail("INVALID_TOKEN", "Token is invalid or expired"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(fail("UNAUTHORIZED", "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json(fail("FORBIDDEN", `Requires role: ${roles.join(" or ")}`));
      return;
    }
    next();
  };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole("admin")(req, res, next);
}
