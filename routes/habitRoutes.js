import express from "express";
import {
  getHabits,
  createHabit,
  updateHabit,
  toggleArchiveHabit,
  deleteHabit,
} from "../controllers/habitControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getHabits);
router.post("/", createHabit);
router.put("/:id", updateHabit);
router.put("/:id/archive", toggleArchiveHabit);
router.delete("/:id", deleteHabit);

export default router;
