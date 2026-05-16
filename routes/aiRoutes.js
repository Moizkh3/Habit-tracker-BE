import express from "express";
import {
  getAIWeeklyReport,
  chatWithAI,
  getMorningMotivation,
  getHabitSuggestions,
  getStreakRecoveryPlan,
} from "../controllers/aiControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/weekly-report", getAIWeeklyReport);
router.post("/chat", chatWithAI);
router.get("/morning", getMorningMotivation);
router.post("/suggest-habits", getHabitSuggestions);
router.post("/recovery-plan", getStreakRecoveryPlan);


export default router;
