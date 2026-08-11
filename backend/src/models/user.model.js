import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["caregiver", "elderly"],
            required: true,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        nickname: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
            unique: true,
            maxlength: 255,
        },
        googleId: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
            maxlength: 255,
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
        avatarUrl: String,
        dateOfBirth: Date,
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
    },
    {
        collection: "users",
        timestamps: true,
    },
);

export default models.User || model("User", userSchema);
