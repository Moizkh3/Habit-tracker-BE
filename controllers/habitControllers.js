import Habit from "../models/Habit.js";
import Log from "../models/Log.js";

export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const query = { user: req.user._id };
    if (includeArchived !== "true") {
      query.isArchived = false;
    }
    const habits = await Habit.find(query).sort({ createdAt: -1 });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, targetDays, color, icon } = req.body;
    const habit = await Habit.create({
      user: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit || habit.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const { name, description, category, frequency, targetDays, color, icon } = req.body;
    habit.name = name || habit.name;
    habit.description = description || habit.description;
    habit.category = category || habit.category;
    habit.frequency = frequency || habit.frequency;
    habit.targetDays = targetDays || habit.targetDays;
    habit.color = color || habit.color;
    habit.icon = icon || habit.icon;

    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleArchiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit || habit.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Habit not found" });
    }
    habit.isArchived = !habit.isArchived;
    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit || habit.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Habit not found" });
    }
    await habit.deleteOne();
    await Log.deleteMany({ habitId: habit._id });
    res.json({ message: "Habit deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
