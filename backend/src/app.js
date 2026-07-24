import express from "express";
import mongoose from "./configs/database.js";
import cors from "cors";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/error.controller.js";
import { setupSwagger } from "./configs/swagger.js";

import authRouter from "./routes/authRoute.js";
import pairingRouter from "./routes/pairingRoute.js";
import prescriptionRouter from "./routes/prescriptionRoute.js";
import medicationRouter from "./routes/medicationRoute.js";
import aiAssistantRouter from "./routes/aiAssistantRoute.js";
import emergencyRouter from "./routes/emergencyRoute.js";

const app = express();

// CORS Configuration
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:5173",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Cho phép thiết bị local / mobile
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json());

// Setup Swagger Open API Docs
setupSwagger(app);

app.get("/", (req, res) => {
    res.json({
        message: "Digital Caregiver API is running",
        version: "1.0.0",
        documentation: "http://localhost:3001/api-docs",
        endpoints: {
            auth: "/api/v1/auth",
            pairing: "/api/v1/pairing",
            prescriptions: "/api/v1/prescriptions",
            medications: "/api/v1/medications",
            aiAssistant: "/api/v1/ai-assistant",
            emergency: "/api/v1/emergency",
        },
    });
});

app.get("/api/health", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB is not connected");
        }

        await mongoose.connection.db.admin().ping();

        res.status(200).json({
            status: "healthy",
            server: "connected",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            server: "connected",
            database: "disconnected",
            timestamp: new Date().toISOString(),
        });
    }
});

// Routes Registration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/pairing", pairingRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/medications", medicationRouter);
app.use("/api/v1/ai-assistant", aiAssistantRouter);
app.use("/api/v1/emergency", emergencyRouter);

// Handling unhandled routes
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
