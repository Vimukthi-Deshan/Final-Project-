import { Router } from "express";
import gradingRouter from "../modules/grading/grading.routes";
import forecastingRouter from "../modules/forecasting/forecasting.routes";
const aiRouter = Router();
aiRouter.use(gradingRouter);
aiRouter.use(forecastingRouter);
export default aiRouter;
