import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const emergencyEventSchema = new Schema(
    {
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        triggeredBy: {
            type: String,
            enum: ["button", "voice"],
            required: true,
        },
        latitude: Number,
        longitude: Number,
        mapsLink: String,
        status: {
            type: String,
            enum: ["active", "acknowledged", "resolved"],
            default: "active",
            index: true,
        },
        acknowledgedAt: Date,
        resolvedAt: Date,
    },
    {
        collection: "emergency_events",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

emergencyEventSchema.index({ elderlyId: 1, createdAt: -1 });

export default models.EmergencyEvent || model("EmergencyEvent", emergencyEventSchema);
