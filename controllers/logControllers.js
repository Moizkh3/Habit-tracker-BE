import Log from "../models/Log.js";
import Habit from "../models/Habit.js";
import { startOfDay, endOfDay, subDays, format, parseISO, eachDayOfInterval } from "date-fns";

export const createLog = async (req, res) => {
  try {
    const { habitId, date } = req.body;
    // Check if habit belongs to user
    const habit = await Habit.findById(habitId);
    if (!habit || habit.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const log = await Log.findOneAndUpdate(
      { user: req.user._id, habitId, completedDate: date },
      { user: req.user._id, habitId, completedDate: date },
      { upsert: true, new: true }
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLog = async (req, res) => {
  try {
    const { habitId, date } = req.body;
    await Log.findOneAndDelete({ user: req.user._id, habitId, completedDate: date });
    res.json({ message: "Log removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTodayLogs = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const logs = await Log.find({ user: req.user._id, completedDate: today });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLogsByRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const logs = await Log.find({
      user: req.user._id,
      completedDate: { $gte: start, $lte: end },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHeatmapData = async (req, res) => {
  try {
    const start = format(subDays(new Date(), 89), "yyyy-MM-dd");
    const end = format(new Date(), "yyyy-MM-dd");

    const logs = await Log.find({
      user: req.user._id,
      completedDate: { $gte: start, $lte: end },
    });

    const counts = {};
    logs.forEach((l) => {
      counts[l.completedDate] = (counts[l.completedDate] || 0) + 1;
    });

    const heatmap = Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));

    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id });
    const thirtyDaysAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    const logs = await Log.find({
      user: req.user._id,
      completedDate: { $gte: thirtyDaysAgo, $lte: today },
    });

    const perHabit = habits.map((h) => {
      const habitLogs = logs
        .filter((l) => l.habitId.toString() === h._id.toString())
        .map((l) => l.completedDate)
        .sort()
        .reverse();

      // Calculate streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const dateSet = new Set(habitLogs);
      let checkDate = new Date();
      
      // Current streak check
      if (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
        while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      } else {
        // Check if missed only today
        checkDate = subDays(checkDate, 1);
        if (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
            while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
              currentStreak++;
              checkDate = subDays(checkDate, 1);
            }
        }
      }

      // Longest streak in last 30 days (rough approximation)
      // For a real longest streak, we'd need more data, but this is for the stats page
      // which uses the last 30 days.
      
      const days = eachDayOfInterval({ start: parseISO(thirtyDaysAgo), end: parseISO(today) });
      days.reverse().forEach(d => {
          if(dateSet.has(format(d, "yyyy-MM-dd"))) {
              tempStreak++;
              if(tempStreak > longestStreak) longestStreak = tempStreak;
          } else {
              tempStreak = 0;
          }
      });

      return {
        habitId: h._id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        currentStreak,
        longestStreak, // This should ideally be from all time, but for now 30d
        completions30d: habitLogs.length,
      };
    });

    res.json({ perHabit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
