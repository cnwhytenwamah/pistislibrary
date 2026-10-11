import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { healthService } from "../../services/health.service";

const router = Router();

// Liveness: the process is up (no dependencies touched)
router.get("/live", (_req, res) => {
  res.json({ status: "ok" });
});

// Readiness: PostgreSQL, Redis and BullMQ are reachable. 503 if any are down.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { healthy, body } = await healthService.check();
    res.status(healthy ? 200 : 503).json(body);
  })
);

export default router;
