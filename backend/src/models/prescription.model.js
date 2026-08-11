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
        title: {
            type: String,
            trim: true,
            default: "Đơn thuốc khám bệnh",
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
        timestamps: true,
    },
);

prescriptionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
prescriptionSchema.index({ elderlyId: 1, createdAt: -1 });

export default models.Prescription || model("Prescription", prescriptionSchema);
