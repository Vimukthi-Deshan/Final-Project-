import { Router } from "express";
import { ok } from "../../middleware/response-envelope";
import { listBatches } from "../batches/batches.store";
const grades = ["Alba", "C5", "C4", "Mexico", "Hamburg"];
const router = Router();
router.get("/inventory", async (_req, res) => {
    const batches = await listBatches();
    const items = grades.map((grade) => {
        const quantityKg = batches
            .filter((batch) => batch.qualityGrade === grade)
            .reduce((acc, batch) => {
            const total = batch.sourceSuppliers.reduce((sum, supplier) => sum + supplier.contributionKg, 0);
            return acc + total;
        }, 0);
        return {
            grade,
            quantityKg,
            lastUpdatedAt: new Date().toISOString(),
        };
    });
    res.status(200).json(ok(items));
});
export default router;
