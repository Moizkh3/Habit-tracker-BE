import "dotenv/config"
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

// Connect to Database
connectDB();

const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // Allow requests with no origin (curl, same-origin, server-to-server)
        if (!origin) return cb(null, true);
        // Allow any localhost/127.0.0.1 origin in development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }
        // Allow anything explicitly listed in CLIENT URL (comma-separated)
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);





if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    });
}

export default app;
