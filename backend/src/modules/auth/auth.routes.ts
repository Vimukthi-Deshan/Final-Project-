import { randomUUID } from "node:crypto";

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { HttpError } from "../../middleware/http-error";
import { fail, ok } from "../../middleware/response-envelope";
import {
  JWT_EXPIRES_IN,
  JWT_SECRET,
  requireAuth,
  requireAdmin,
} from "../../middleware/auth.middleware";
import { countUsers, findUserByUsername, saveUser } from "./auth.store";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).default("user"),
});

router.post("/auth/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new HttpError(
        400,
        "INVALID_LOGIN_PAYLOAD",
        "Username and password are required",
      ),
    );
  }

  console.log("[AUTH] Login attempt — username:", parsed.data.username);
  console.log("[AUTH] Plain-text password received:", parsed.data.password);

  const user = await findUserByUsername(parsed.data.username);
  if (!user) {
    console.log("[AUTH] No user found for username:", parsed.data.username);
    res
      .status(401)
      .json(fail("INVALID_CREDENTIALS", "Invalid username or password"));
    return;
  }

  console.log("[AUTH] Stored hash from DB:", user.passwordHash);

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  console.log("[AUTH] bcrypt.compare result:", valid);

  if (!valid) {
    res
      .status(401)
      .json(fail("INVALID_CREDENTIALS", "Invalid username or password"));
    return;
  }

  const token = jwt.sign(
    { userId: user.userId, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.status(200).json(
    ok({
      token,
      role: user.role,
      username: user.username,
      expiresIn: JWT_EXPIRES_IN,
    }),
  );
});

// Admin-only: create new users. First user ever can self-register as admin (bootstrap).
router.post("/auth/register", async (req, res, next) => {
  const total = await countUsers();
  // allow first user without auth; after that require admin token
  if (total > 0) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json(fail("UNAUTHORIZED", "Admin token required to create users"));
      return;
    }
    try {
      const { role } = jwt.verify(authHeader.slice(7), JWT_SECRET) as {
        role: string;
      };
      if (role !== "admin") {
        res.status(403).json(fail("FORBIDDEN", "Only admins can create users"));
        return;
      }
    } catch {
      res
        .status(401)
        .json(fail("INVALID_TOKEN", "Token is invalid or expired"));
      return;
    }
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new HttpError(
        400,
        "INVALID_REGISTER_PAYLOAD",
        "Invalid registration data",
        {
          issues: parsed.error.issues,
        },
      ),
    );
  }

  const existing = await findUserByUsername(parsed.data.username);
  if (existing) {
    res
      .status(409)
      .json(
        fail("USER_EXISTS", `Username '${parsed.data.username}' already taken`),
      );
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = {
    userId: randomUUID(),
    username: parsed.data.username,
    passwordHash,
    role: parsed.data.role,
    createdAt: new Date().toISOString(),
  };
  await saveUser(user);

  res
    .status(201)
    .json(
      ok({ userId: user.userId, username: user.username, role: user.role }),
    );
});

// Return current user profile from their token.
router.get("/auth/me", requireAuth, (req, res) => {
  res.status(200).json(
    ok({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
    }),
  );
});

export default router;
