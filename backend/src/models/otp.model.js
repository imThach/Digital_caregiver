import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        otp: {
            type: String,
            required: true,
            trim: true,
        },
        failedAttempts: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300, // Tự động xoá document sau 5 phút (300 giây)
        },
    },
    {
        collection: "otps",
    }
);

export default models.Otp || model("Otp", otpSchema);
