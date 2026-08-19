import { Router } from "express";
import { z } from "zod";
import { fail, ok } from "../../middleware/response-envelope";
import { getBatchById } from "../batches/batches.store";
import { upsertTraceabilityRecord } from "./traceability.store";
import { TraceabilityService } from "./traceability.service";
const router = Router();
const recordSupplierSchema = z.object({
    dataHash: z
        .string()
        .regex(/^0x[0-9a-fA-F]{64}$/, "dataHash must be a 0x-prefixed bytes32 hex string"),
    productCount: z.number().int().nonnegative(),
});
router.post("/blockchain-registration/:mongoDbId", async (req, res) => {
    try {
        const parsed = recordSupplierSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(fail("INVALID_SUPPLIER_REGISTRATION_PAYLOAD", "Payload validation failed", {
                issues: parsed.error.issues,
            }));
            return;
        }
        const payload = parsed.data;
        const input = {
            mongoDbId: req.params.mongoDbId,
            dataHash: payload.dataHash,
            productCount: payload.productCount,
        };
        const service = new TraceabilityService();
        const result = await service.recordSupplier(input);
        await upsertTraceabilityRecord(input.mongoDbId, {
            dataHash: input.dataHash,
            productCount: input.productCount,
            verifiedOnChain: false,
            lastAction: "record",
            txHash: result.txHash,
            network: result.network,
            chainId: result.chainId,
            contractAddress: result.contractAddress,
            blockNumber: result.blockNumber,
        });
        res.status(200).json(ok(result));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown registration error";
        res.status(400).json(fail("BLOCKCHAIN_REGISTRATION_FAILED", message));
    }
});
router.post("/blockchain-registration/:mongoDbId/verify", async (req, res) => {
    try {
        const service = new TraceabilityService();
        const result = await service.markSupplierVerified(req.params.mongoDbId);
        await upsertTraceabilityRecord(req.params.mongoDbId, {
            verifiedOnChain: true,
            lastAction: "verify",
            txHash: result.txHash,
            network: result.network,
            chainId: result.chainId,
            contractAddress: result.contractAddress,
            blockNumber: result.blockNumber,
        });
        res.status(200).json(ok(result));
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown verification update error";
        res.status(400).json(fail("BLOCKCHAIN_VERIFY_UPDATE_FAILED", message));
    }
});
router.patch("/blockchain-registration/:mongoDbId/products", async (req, res) => {
    try {
        const productCount = Number(req.body.productCount);
        if (!Number.isFinite(productCount) || productCount < 0) {
            throw new Error("productCount must be a non-negative number.");
        }
        const service = new TraceabilityService();
        const result = await service.updateSupplierProducts(req.params.mongoDbId, productCount);
        await upsertTraceabilityRecord(req.params.mongoDbId, {
            productCount,
            lastAction: "updateProducts",
            txHash: result.txHash,
            network: result.network,
            chainId: result.chainId,
            contractAddress: result.contractAddress,
            blockNumber: result.blockNumber,
        });
        res.status(200).json(ok(result));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown product update error";
        res.status(400).json(fail("BLOCKCHAIN_PRODUCT_UPDATE_FAILED", message));
    }
});
router.get("/verify/:mongoDbId", async (req, res) => {
    try {
        const service = new TraceabilityService();
        const data = await service.verifySupplier(req.params.mongoDbId);
        await upsertTraceabilityRecord(req.params.mongoDbId, {
            dataHash: data.dataHash,
            productCount: data.productCount,
            verifiedOnChain: data.isVerified,
            recordedAt: data.recordedAt,
            verificationTimestamp: data.verificationTimestamp,
            lastAction: "read",
        });
        res.status(200).json(ok(data));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown verification error";
        res.status(404).json(fail("TRACEABILITY_VERIFY_FAILED", message));
    }
});
router.get("/verify/:mongoDbId/hash/:dataHash", async (req, res) => {
    try {
        const service = new TraceabilityService();
        const valid = await service.verifySupplierHash(req.params.mongoDbId, req.params.dataHash);
        res.status(200).json(ok({ valid }));
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown hash verification error";
        res.status(400).json(fail("TRACEABILITY_HASH_VERIFY_FAILED", message));
    }
});
router.get("/traceability/batches/:batchId/verify", async (req, res) => {
    try {
        const batch = await getBatchById(req.params.batchId);
        if (!batch) {
            res
                .status(404)
                .json(fail("BATCH_NOT_FOUND", `Batch ${req.params.batchId} was not found.`));
            return;
        }
        const service = new TraceabilityService();
        const checks = await Promise.all(batch.sourceSuppliers.map(async (source) => {
            try {
                const supplier = await service.verifySupplier(source.supplierId);
                return {
                    supplierId: source.supplierId,
                    contributionKg: source.contributionKg,
                    onChainRegistered: supplier.isRegistered,
                    onChainVerified: supplier.isVerified,
                    dataHash: supplier.dataHash,
                    recordedAt: supplier.recordedAt,
                    verificationTimestamp: supplier.verificationTimestamp,
                    error: null,
                };
            }
            catch (error) {
                return {
                    supplierId: source.supplierId,
                    contributionKg: source.contributionKg,
                    onChainRegistered: false,
                    onChainVerified: false,
                    dataHash: null,
                    recordedAt: null,
                    verificationTimestamp: null,
                    error: error instanceof Error
                        ? error.message
                        : "Unknown supplier verification error",
                };
            }
        }));
        const totalSuppliers = checks.length;
        const registeredSuppliers = checks.filter((item) => item.onChainRegistered).length;
        const verifiedSuppliers = checks.filter((item) => item.onChainVerified).length;
        const allSuppliersVerified = totalSuppliers > 0 && verifiedSuppliers === totalSuppliers;
        res.status(200).json(ok({
            batch: {
                batchId: batch.batchId,
                processingDate: batch.processingDate,
                qualityGrade: batch.qualityGrade ?? null,
                exportDestination: batch.exportDestination,
                logisticsHandoverAt: batch.logisticsHandoverAt ?? null,
            },
            summary: {
                totalSuppliers,
                registeredSuppliers,
                verifiedSuppliers,
                allSuppliersVerified,
            },
            supplierChecks: checks,
        }));
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown batch traceability verification error";
        res.status(400).json(fail("BATCH_TRACEABILITY_VERIFY_FAILED", message));
    }
});
export default router;
