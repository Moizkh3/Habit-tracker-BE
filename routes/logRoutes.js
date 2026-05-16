import express from "express";
import {
  createLog,
  deleteLog,
  getTodayLogs,
  getLogsByRange,
  getHeatmapData,
  getStats,
} from "../controllers/logControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", createLog);
router.delete("/", deleteLog);
router.get("/today", getTodayLogs);
router.get("/range", getLogsByRange);
router.get("/heatmap", getHeatmapData);
router.get("/stats", getStats);

export default router;
