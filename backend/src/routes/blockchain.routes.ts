import { Router } from "express";

import traceabilityRouter from "../modules/traceability/traceability.routes";

const blockchainRouter = Router();

blockchainRouter.use(traceabilityRouter);

export default blockchainRouter;
