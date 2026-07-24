import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const medicationSchema = new Schema(
    {
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        prescriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Prescription",
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        usageNote: {
            type: String,
            trim: true,
            maxlength: 255,
        },
        dosage: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        imageUrl: String,
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        collection: "medications",
        timestamps: true,
    },
);

medicationSchema.index({ elderlyId: 1, isActive: 1 });

export default models.Medication || model("Medication", medicationSchema);
