import { GoogleGenerativeAI } from "@google/generative-ai";
import Habit from "../models/Habit.js";
import Log from "../models/Log.js";
import { format, subDays } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getAIWeeklyReport = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const start = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const end = format(new Date(), "yyyy-MM-dd");
    const logs = await Log.find({
      user: req.user._id,
      completedDate: { $gte: start, $lte: end },
    });

    const dataString = habits
      .map((h) => {
        const done = logs.filter((l) => l.habitId.toString() === h._id.toString()).length;
        return `- ${h.name}: ${done}/${h.targetDays || 7} days completed this week.`;
      })
      .join("\n");

    const prompt = `
      You are an AI Habit Coach. Here is the user's habit performance for the last 7 days:
      ${dataString}
      
      Please write a short, encouraging, and insightful weekly report (approx 100-150 words). 
      Highlight successes, identify patterns, and offer 1-2 specific, gentle suggestions for improvement.
      Use a friendly, supportive tone. Use Markdown for formatting.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ content: response.text() });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "AI Error: " + error.message });
  }

};

export const chatWithAI = async (req, res) => {
  try {
    const { question } = req.body;
    const habits = await Habit.find({ user: req.user._id });
    const logs = await Log.find({ user: req.user._id }).sort({ completedDate: -1 }).limit(100);

    const context = `
      User's Habits: ${habits.map((h) => h.name).join(", ")}
      Recent Logs (last 100): ${logs.map((l) => `${l.completedDate}: ${l.habitId}`).join(", ")}
    `;

    const prompt = `
      You are an AI Habit Analysis Assistant. Use the following context about the user's habits to answer their question.
      Context: ${context}
      User Question: ${question}
      
      Provide a helpful, data-driven answer. If you don't have enough data, give general best practices for habit building. Keep it concise.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ content: response.text() });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "AI Error: " + error.message });
  }

};

export const getMorningMotivation = async (req, res) => {
  try {
    const user = req.user;
    const prompt = `
      Write a short (1-2 sentence) personalized morning greeting and motivation for ${user.name}.
      They are building habits like self-improvement and consistency.
      Keep it fresh, upbeat, and inspiring. Use Markdown for styling if needed.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ content: response.text() });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "AI Error: " + error.message });
  }

};

export const getHabitSuggestions = async (req, res) => {
  try {
    const { goals, productiveTime, struggles } = req.body;
    const habits = await Habit.find({ user: req.user._id });
    
    const prompt = `
      The user has the following goals: ${goals}.
      They are most productive during: ${productiveTime}.
      They struggle with: ${struggles}.
      Currently tracking: ${habits.map((h) => h.name).join(", ")}.

      Suggest 3 new habits. Return ONLY a JSON array of 3 objects.
      Each object must have: name, description, category, frequency (daily/weekly), icon (emoji), and reason (why this helps).
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Check if the response was blocked
    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
        throw new Error("AI response was blocked or empty.");
    }

    const text = response.text();
    
    try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("Could not find JSON array in AI response.");
        }
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const suggestions = JSON.parse(jsonStr);
        res.json({ suggestions });
    } catch (e) {
        console.warn("AI JSON Parse Error:", e.message, "Text:", text);
        res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error("AI Controller Error (getHabitSuggestions):", error);
    res.status(500).json({ message: "AI Error: " + error.message });
  }


};

export const getStreakRecoveryPlan = async (req, res) => {
  try {
    const { habitId } = req.body;
    const habit = await Habit.findById(habitId);
    
    const prompt = `
      The user just broke their streak for the habit: "${habit.name}".
      Write a gentle, encouraging 3-day recovery plan to help them get back on track.
      Keep it short (under 100 words). Use Markdown for formatting.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ content: response.text() });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "AI Error: " + error.message });
  }

};

