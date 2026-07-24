import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const medicationLogSchema = new Schema(
    {
        scheduleId: {
            type: Schema.Types.ObjectId,
            ref: "MedicationSchedule",
            required: true,
            index: true,
        },
        medicationId: {
            type: Schema.Types.ObjectId,
            ref: "Medication",
            required: true,
            index: true,
        },
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        scheduledAt: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "taken", "snoozed", "missed"],
            default: "pending",
            index: true,
        },
        respondedAt: Date,
        snoozeUntil: Date,
        caregiverNotifiedAt: Date,
    },
    {
        collection: "medication_logs",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

medicationLogSchema.index({ scheduleId: 1, scheduledAt: 1 }, { unique: true });
medicationLogSchema.index({ elderlyId: 1, scheduledAt: 1 });

export default models.MedicationLog || model("MedicationLog", medicationLogSchema);
