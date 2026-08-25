import { Supplier } from "../../models/domain.types";
import { getCollection } from "../../lib/mongo";

interface PersistedSupplier {
  key: string;
  payload: Supplier;
  createdAt: string;
  updatedAt: string;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const collection = await getCollection<PersistedSupplier>("suppliers");
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return docs.map((doc) => doc.payload);
}

export async function getSupplierByName(
  supplierName: string,
): Promise<Supplier | undefined> {
  const collection = await getCollection<PersistedSupplier>("suppliers");
  const doc = await collection.findOne({
    key: supplierName.toLowerCase(),
  });

  return doc?.payload;
}

export async function saveSupplier(supplier: Supplier): Promise<Supplier> {
  const collection = await getCollection<PersistedSupplier>("suppliers");
  const now = new Date().toISOString();

  await collection.insertOne({
    key: supplier.supplierName.toLowerCase(),
    payload: {
      ...supplier,
      createdAt: supplier.createdAt ?? now,
      updatedAt: supplier.updatedAt ?? now,
    },
    createdAt: now,
    updatedAt: now,
  });

  return supplier;
}

export async function updateSupplierBlockchainRef(
  supplierName: string,
  blockchainRef: Supplier["blockchainRef"],
): Promise<void> {
  const collection = await getCollection<PersistedSupplier>("suppliers");
  const now = new Date().toISOString();
  const key = supplierName.toLowerCase();

  const existing = await collection.findOne({ key });
  if (!existing) {
    return;
  }

  await collection.updateOne(
    { key },
    {
      $set: {
        "payload.blockchainRef": blockchainRef,
        "payload.updatedAt": now,
        updatedAt: now,
      },
    },
  );
}
