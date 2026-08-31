import { getCollection } from "../../lib/mongo";
import { User } from "./auth.types";

interface PersistedUser {
  key: string;
  payload: User;
  createdAt: string;
}

export async function findUserByUsername(
  username: string,
): Promise<User | undefined> {
  const col = await getCollection<PersistedUser>("users");
  const doc = await col.findOne({ key: username.toLowerCase() });
  return doc?.payload;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const col = await getCollection<PersistedUser>("users");
  const doc = await col.findOne({ "payload.userId": userId });
  return doc?.payload;
}

export async function saveUser(user: User): Promise<void> {
  const col = await getCollection<PersistedUser>("users");
  const now = new Date().toISOString();
  await col.updateOne(
    { key: user.username.toLowerCase() },
    {
      $setOnInsert: {
        key: user.username.toLowerCase(),
        payload: user,
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

export async function countUsers(): Promise<number> {
  const col = await getCollection<PersistedUser>("users");
  return col.countDocuments();
}
