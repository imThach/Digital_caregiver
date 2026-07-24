import "dotenv/config";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

export async function connectDatabase() {
    try {
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not configured");
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed");
        console.error(error.message);

        throw error;
    }
}

export async function disconnectDatabase() {
    await mongoose.disconnect();
}

export default mongoose;
