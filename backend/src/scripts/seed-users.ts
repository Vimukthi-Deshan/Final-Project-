/**
 * Run once to seed default accounts:
 *   admin   / CanelaAdmin2026!
 *   operator / CanelaUser2026!
 *
 * Usage:  cd backend && npx tsx src/scripts/seed-users.ts
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { initMongo } from "../lib/mongo";
import { saveUser, findUserByUsername } from "../modules/auth/auth.store";

const ACCOUNTS = [
  { username: "admin", password: "CanelaAdmin2026!", role: "admin" as const },
  { username: "operator", password: "CanelaUser2026!", role: "user" as const },
];

async function seed() {
  await initMongo();
  console.log("Connected to MongoDB.");

  for (const acc of ACCOUNTS) {
    const existing = await findUserByUsername(acc.username);
    if (existing) {
      console.log(`User '${acc.username}' already exists — skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(acc.password, 12);
    await saveUser({
      userId: randomUUID(),
      username: acc.username,
      passwordHash,
      role: acc.role,
      createdAt: new Date().toISOString(),
    });
    console.log(`Created user '${acc.username}' with role '${acc.role}'.`);
  }

  console.log("\nDefault credentials:");
  console.log("  username: admin      password: CanelaAdmin2026!  role: admin");
  console.log("  username: operator   password: CanelaUser2026!   role: user");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
