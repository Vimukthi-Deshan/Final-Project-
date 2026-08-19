import { Router } from "express";

import suppliersRouter from "../modules/suppliers/suppliers.routes";
import batchesRouter from "../modules/batches/batches.routes";
import inventoryRouter from "../modules/inventory/inventory.routes";

const coreRouter = Router();

coreRouter.use(suppliersRouter);
coreRouter.use(batchesRouter);
coreRouter.use(inventoryRouter);

export default coreRouter;
