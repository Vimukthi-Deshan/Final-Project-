import { Router } from "express";

import aiRouter from "./ai.routes";
import authRouter from "../modules/auth/auth.routes";
import blockchainRouter from "./blockchain.routes";
import coreRouter from "./core.routes";
import docsRouter from "./docs.routes";

const apiV1Router = Router();

apiV1Router.use(authRouter);
apiV1Router.use(coreRouter);
apiV1Router.use(aiRouter);
apiV1Router.use(blockchainRouter);
apiV1Router.use(docsRouter);

export default apiV1Router;
