import { Router } from "express";

import { fail, ok } from "../../middleware/response-envelope";
import { TraceabilityService } from "./traceability.service";
import { RegisterBatchMetadataInput } from "./traceability.types";

const router = Router();

router.post("/blockchain-registration/:batchId", async (req, res) => {
  try {
    const payload = req.body as Omit<RegisterBatchMetadataInput, "batchId">;
    const input: RegisterBatchMetadataInput = {
      batchId: req.params.batchId,
      sourceSupplierIds: payload.sourceSupplierIds,
      processingDate: payload.processingDate,
      aiAssignedGrade: payload.aiAssignedGrade,
      exportDestination: payload.exportDestination,
      logisticsHandoverTimestamp: payload.logisticsHandoverTimestamp,
    };

    const service = new TraceabilityService();
    const result = await service.registerBatchMetadata(input);
    res.status(200).json(ok(result));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown registration error";
    res.status(400).json(fail("BLOCKCHAIN_REGISTRATION_FAILED", message));
  }
});

router.get("/verify/:batchId", async (req, res) => {
  try {
    const service = new TraceabilityService();
    const data = await service.verifyBatch(req.params.batchId);
    res.status(200).json(ok(data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown verification error";
    res.status(404).json(fail("TRACEABILITY_VERIFY_FAILED", message));
  }
});

export default router;
