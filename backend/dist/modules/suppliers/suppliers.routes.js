import { Router } from "express";
import { z } from "zod";
import { fail, ok } from "../../middleware/response-envelope";
import { getSupplierByName, listSuppliers, saveSupplier, } from "./suppliers.store";
const supplierSchema = z.object({
    supplierName: z.string().min(2),
    businessLicense: z.string().optional(),
    registrationNumber: z.string().optional(),
    contactPerson: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(3),
    address: z.string().min(3),
    city: z.string().min(2),
    country: z.string().min(2),
    zipCode: z.string().optional(),
    companyDescription: z.string().optional(),
    yearEstablished: z.number().int().min(1800).max(3000).optional(),
    companySize: z.enum(["startup", "small", "medium", "large"]).optional(),
    products: z
        .array(z.object({
        productName: z.string().min(1),
        productDescription: z.string().optional(),
        hsCode: z.string().optional(),
        quantity: z.number().nonnegative(),
        quantityUnit: z.string().optional(),
        price: z.number().nonnegative(),
        currency: z.string().optional(),
        grade: z.string().optional(),
        minimumOrder: z.number().nonnegative().optional(),
        availability: z
            .enum(["in_stock", "made_to_order", "seasonal"])
            .optional(),
        leadTime: z.number().int().nonnegative().optional(),
        certifications: z.array(z.string()).optional(),
    }))
        .default([]),
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
    accountNumber: z.string().optional(),
    swift: z.string().optional(),
    paymentTerms: z.string().optional(),
    blockchainRef: z
        .object({
        txId: z.string().optional(),
        network: z.string().optional(),
        contractAddress: z.string().optional(),
        hash: z.string().optional(),
        explorerUrl: z.string().optional(),
        recordedAt: z.string().optional(),
    })
        .optional(),
    verification: z
        .object({
        status: z
            .enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"])
            .optional(),
        verifiedBy: z.string().optional(),
        verificationDate: z.string().optional(),
        verificationNotes: z.string().optional(),
        documentsRequired: z.array(z.string()).optional(),
        documentsProvided: z.array(z.string()).optional(),
    })
        .optional(),
    qualityRating: z.number().min(0).max(5).optional(),
    certifications: z.array(z.string()).default([]),
    reviews: z
        .array(z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        reviewedBy: z.string().optional(),
        reviewDate: z.string().optional(),
    }))
        .default([]),
    status: z.enum(["active", "inactive", "blacklisted"]).optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
const router = Router();
router.get("/suppliers", async (_req, res) => {
    try {
        const suppliers = await listSuppliers();
        res.status(200).json(ok(suppliers));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown supplier read error";
        res.status(500).json(fail("SUPPLIER_LIST_FAILED", message));
    }
});
router.post("/suppliers", async (req, res) => {
    try {
        const parsed = supplierSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(fail("INVALID_SUPPLIER_PAYLOAD", "Supplier payload is invalid", {
                issues: parsed.error.issues,
            }));
            return;
        }
        const existing = await getSupplierByName(parsed.data.supplierName);
        if (existing) {
            res
                .status(409)
                .json(fail("SUPPLIER_EXISTS", "Supplier name already exists"));
            return;
        }
        const saved = await saveSupplier(parsed.data);
        res.status(201).json(ok(saved));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown supplier create error";
        res.status(500).json(fail("SUPPLIER_CREATE_FAILED", message));
    }
});
export default router;
