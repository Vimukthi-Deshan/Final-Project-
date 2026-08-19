import { getCollection } from "../../lib/mongo";
export async function listSuppliers() {
    const collection = await getCollection("suppliers");
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => doc.payload);
}
export async function getSupplierByName(supplierName) {
    const collection = await getCollection("suppliers");
    const doc = await collection.findOne({
        key: supplierName.toLowerCase(),
    });
    return doc?.payload;
}
export async function saveSupplier(supplier) {
    const collection = await getCollection("suppliers");
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
