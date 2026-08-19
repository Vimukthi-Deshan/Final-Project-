import { Router } from "express";

import exportDocsRouter from "../modules/export-docs/export-docs.routes";

const docsRouter = Router();

docsRouter.use(exportDocsRouter);

export default docsRouter;
