import { ProformaInvoice } from "../../models/domain.types";
import { getCollection } from "../../lib/mongo";

interface PersistedInvoice {
  key: string;
  payload: ProformaInvoice;
  createdAt: string;
  updatedAt: string;
}

export async function saveInvoice(
  invoice: ProformaInvoice,
): Promise<ProformaInvoice> {
  const collection = await getCollection<PersistedInvoice>("invoices");
  const now = new Date().toISOString();

  await collection.insertOne({
    key: invoice.documentId,
    payload: invoice,
    createdAt: now,
    updatedAt: now,
  });

  return invoice;
}

export async function getInvoiceById(
  documentId: string,
): Promise<ProformaInvoice | undefined> {
  const collection = await getCollection<PersistedInvoice>("invoices");
  const doc = await collection.findOne({ key: documentId });
  return doc?.payload;
}

export async function listInvoices(): Promise<ProformaInvoice[]> {
  const collection = await getCollection<PersistedInvoice>("invoices");
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => d.payload);
}
