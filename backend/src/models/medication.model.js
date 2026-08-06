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
        totalQuantity: {
            type: Number,
            default: 30,
        },
        remainingQuantity: {
            type: Number,
            default: 30,
        },
        durationDays: {
            type: Number,
            default: 15,
        },
        imageUrl: String,
        startDate: {
            type: Date,
            default: () => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(0, 0, 0, 0);
                return d;
            },
            index: true,
        },
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
