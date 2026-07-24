import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const prescriptionSchema = new Schema(
    {
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        rawAiResponse: Schema.Types.Mixed,
        status: {
            type: String,
            enum: ["processing", "extracted", "confirmed", "failed"],
            default: "processing",
            index: true,
        },
        confirmedAt: Date,
    },
    {
        collection: "prescriptions",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

prescriptionSchema.index({ elderlyId: 1, createdAt: -1 });

export default models.Prescription || model("Prescription", prescriptionSchema);
