import { Router } from "express";
import { keccak256, toUtf8Bytes } from "ethers";
import { z } from "zod";

import { fail, ok } from "../../middleware/response-envelope";
import { getBatchById, listBatches } from "../batches/batches.store";
import {
  getSupplierByName,
  updateSupplierBlockchainRef,
} from "../suppliers/suppliers.store";
import { upsertTraceabilityRecord } from "./traceability.store";
import { TraceabilityService } from "./traceability.service";
import { RecordSupplierInput } from "./traceability.types";

const router = Router();

function normalizeId(value: string): string {
  return value.trim();
}

const recordSupplierSchema = z.object({
  dataHash: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      "dataHash must be a 0x-prefixed bytes32 hex string",
    ),
  productCount: z.number().int().nonnegative(),
});

const autoRecordSupplierSchema = z.object({
  productCount: z.number().int().nonnegative(),
});

function buildExplorerUrl(txHash: string): string {
  const explorerBase =
    process.env.SEPOLIA_EXPLORER_BASE_URL ?? "https://sepolia.etherscan.io/tx";
  return `${explorerBase}/${txHash}`;
}

router.post("/blockchain-registration/:mongoDbId", async (req, res) => {
  try {
    const mongoDbId = normalizeId(req.params.mongoDbId);
    const parsed = recordSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        fail(
          "INVALID_SUPPLIER_REGISTRATION_PAYLOAD",
          "Payload validation failed",
          {
            issues: parsed.error.issues,
          },
        ),
      );
      return;
    }

    const payload = parsed.data as Omit<RecordSupplierInput, "mongoDbId">;
    const input: RecordSupplierInput = {
      mongoDbId,
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

    await updateSupplierBlockchainRef(input.mongoDbId, {
      txId: result.txHash,
      network: result.network,
      chainId: result.chainId,
      contractAddress: result.contractAddress,
      hash: input.dataHash,
      explorerUrl: buildExplorerUrl(result.txHash),
      recordedAt: new Date().toISOString(),
    });

    res.status(200).json(ok(result));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown registration error";
    res.status(400).json(fail("BLOCKCHAIN_REGISTRATION_FAILED", message));
  }
});

router.post(
  "/blockchain-registration/:mongoDbId/auto-record",
  async (req, res) => {
    try {
      const mongoDbId = normalizeId(req.params.mongoDbId);
      const parsed = autoRecordSupplierSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(
          fail("INVALID_AUTO_RECORD_PAYLOAD", "Payload validation failed", {
            issues: parsed.error.issues,
          }),
        );
        return;
      }

      const supplier = await getSupplierByName(mongoDbId);
      if (!supplier) {
        res
          .status(404)
          .json(fail("SUPPLIER_NOT_FOUND", `Supplier ${mongoDbId} not found.`));
        return;
      }

      const canonicalPayload = {
        supplierName: supplier.supplierName.trim(),
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        country: supplier.country,
      };

      const dataHash = keccak256(toUtf8Bytes(JSON.stringify(canonicalPayload)));

      const input: RecordSupplierInput = {
        mongoDbId,
        dataHash,
        productCount: parsed.data.productCount,
      };

      const service = new TraceabilityService();
      let result: {
        txHash: string;
        contractAddress: string;
        network: string;
        chainId: number;
        blockNumber: number;
      } | null = null;
      let alreadyRecorded = false;

      try {
        await service.verifySupplier(mongoDbId);
        alreadyRecorded = true;
      } catch {
        alreadyRecorded = false;
      }

      if (!alreadyRecorded) {
        result = await service.recordSupplier(input);

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

        await updateSupplierBlockchainRef(input.mongoDbId, {
          txId: result.txHash,
          network: result.network,
          chainId: result.chainId,
          contractAddress: result.contractAddress,
          hash: input.dataHash,
          explorerUrl: buildExplorerUrl(result.txHash),
          recordedAt: new Date().toISOString(),
        });
      }

      const state = await service.verifySupplier(mongoDbId);

      res.status(200).json(
        ok({
          ...(result ?? {}),
          dataHash,
          mongoDbId,
          source: "supplier_profile",
          alreadyRecorded,
          onChainState: state,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown auto-record error";
      res.status(400).json(fail("BLOCKCHAIN_AUTO_RECORD_FAILED", message));
    }
  },
);

router.post("/blockchain-registration/:mongoDbId/verify", async (req, res) => {
  try {
    const mongoDbId = normalizeId(req.params.mongoDbId);
    const service = new TraceabilityService();
    const result = await service.markSupplierVerified(mongoDbId);

    await upsertTraceabilityRecord(mongoDbId, {
      verifiedOnChain: true,
      lastAction: "verify",
      txHash: result.txHash,
      network: result.network,
      chainId: result.chainId,
      contractAddress: result.contractAddress,
      blockNumber: result.blockNumber,
    });

    const state = await service.verifySupplier(mongoDbId);
    await updateSupplierBlockchainRef(mongoDbId, {
      txId: result.txHash,
      network: result.network,
      chainId: result.chainId,
      contractAddress: result.contractAddress,
      hash: state.dataHash,
      explorerUrl: buildExplorerUrl(result.txHash),
      recordedAt: new Date().toISOString(),
    });

    res.status(200).json(ok(result));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown verification update error";
    res.status(400).json(fail("BLOCKCHAIN_VERIFY_UPDATE_FAILED", message));
  }
});

router.patch(
  "/blockchain-registration/:mongoDbId/products",
  async (req, res) => {
    try {
      const mongoDbId = normalizeId(req.params.mongoDbId);
      const productCount = Number(
        (req.body as { productCount?: number }).productCount,
      );
      if (!Number.isFinite(productCount) || productCount < 0) {
        throw new Error("productCount must be a non-negative number.");
      }

      const service = new TraceabilityService();
      const result = await service.updateSupplierProducts(
        mongoDbId,
        productCount,
      );

      await upsertTraceabilityRecord(mongoDbId, {
        productCount,
        lastAction: "updateProducts",
        txHash: result.txHash,
        network: result.network,
        chainId: result.chainId,
        contractAddress: result.contractAddress,
        blockNumber: result.blockNumber,
      });

      const state = await service.verifySupplier(mongoDbId);
      await updateSupplierBlockchainRef(mongoDbId, {
        txId: result.txHash,
        network: result.network,
        chainId: result.chainId,
        contractAddress: result.contractAddress,
        hash: state.dataHash,
        explorerUrl: buildExplorerUrl(result.txHash),
        recordedAt: new Date().toISOString(),
      });

      res.status(200).json(ok(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown product update error";
      res.status(400).json(fail("BLOCKCHAIN_PRODUCT_UPDATE_FAILED", message));
    }
  },
);

router.get("/verify/:mongoDbId", async (req, res) => {
  try {
    const mongoDbId = normalizeId(req.params.mongoDbId);
    const service = new TraceabilityService();
    const data = await service.verifySupplier(mongoDbId);

    await upsertTraceabilityRecord(mongoDbId, {
      dataHash: data.dataHash,
      productCount: data.productCount,
      verifiedOnChain: data.isVerified,
      recordedAt: data.recordedAt,
      verificationTimestamp: data.verificationTimestamp,
      lastAction: "read",
    });

    res.status(200).json(ok(data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown verification error";
    res.status(404).json(fail("TRACEABILITY_VERIFY_FAILED", message));
  }
});

router.get("/verify/:mongoDbId/hash/:dataHash", async (req, res) => {
  try {
    const mongoDbId = normalizeId(req.params.mongoDbId);
    const service = new TraceabilityService();
    const valid = await service.verifySupplierHash(
      mongoDbId,
      req.params.dataHash,
    );
    res.status(200).json(ok({ valid }));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown hash verification error";
    res.status(400).json(fail("TRACEABILITY_HASH_VERIFY_FAILED", message));
  }
});

router.get("/traceability/suppliers/:mongoDbId/insights", async (req, res) => {
  try {
    const mongoDbId = normalizeId(req.params.mongoDbId);
    const supplier = await getSupplierByName(mongoDbId);
    if (!supplier) {
      res
        .status(404)
        .json(fail("SUPPLIER_NOT_FOUND", `Supplier ${mongoDbId} not found.`));
      return;
    }

    const batches = await listBatches();
    const contributedBatches = batches
      .map((batch) => {
        const contribution = batch.sourceSuppliers.find(
          (item) => item.supplierId.trim() === mongoDbId,
        );
        if (!contribution) {
          return null;
        }

        return {
          batchId: batch.batchId,
          processingDate: batch.processingDate,
          qualityGrade: batch.qualityGrade ?? null,
          exportDestination: batch.exportDestination,
          contributionKg: contribution.contributionKg,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalContributionKg = contributedBatches.reduce(
      (sum, item) => sum + item.contributionKg,
      0,
    );

    res.status(200).json(
      ok({
        supplier: {
          supplierName: supplier.supplierName,
          contactPerson: supplier.contactPerson,
          city: supplier.city,
          country: supplier.country,
          certifications: supplier.certifications ?? [],
          products: supplier.products ?? [],
          blockchainRef: supplier.blockchainRef ?? null,
        },
        contribution: {
          totalBatches: contributedBatches.length,
          totalContributionKg,
          batches: contributedBatches,
        },
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown supplier insights read error";
    res
      .status(400)
      .json(fail("SUPPLIER_TRACEABILITY_INSIGHTS_FAILED", message));
  }
});

router.get("/traceability/batches/:batchId/verify", async (req, res) => {
  try {
    const batchId = normalizeId(req.params.batchId);
    const batch = await getBatchById(batchId);
    if (!batch) {
      res
        .status(404)
        .json(fail("BATCH_NOT_FOUND", `Batch ${batchId} was not found.`));
      return;
    }

    const service = new TraceabilityService();
    const checks = await Promise.all(
      batch.sourceSuppliers.map(async (source) => {
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
        } catch (error) {
          return {
            supplierId: source.supplierId,
            contributionKg: source.contributionKg,
            onChainRegistered: false,
            onChainVerified: false,
            dataHash: null,
            recordedAt: null,
            verificationTimestamp: null,
            error:
              error instanceof Error
                ? error.message
                : "Unknown supplier verification error",
          };
        }
      }),
    );

    const totalSuppliers = checks.length;
    const registeredSuppliers = checks.filter(
      (item) => item.onChainRegistered,
    ).length;
    const verifiedSuppliers = checks.filter(
      (item) => item.onChainVerified,
    ).length;
    const allSuppliersVerified =
      totalSuppliers > 0 && verifiedSuppliers === totalSuppliers;

    res.status(200).json(
      ok({
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
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown batch traceability verification error";
    res.status(400).json(fail("BATCH_TRACEABILITY_VERIFY_FAILED", message));
  }
});

export default router;
