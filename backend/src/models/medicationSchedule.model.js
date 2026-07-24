import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const medicationScheduleSchema = new Schema(
    {
        medicationId: {
            type: Schema.Types.ObjectId,
            ref: "Medication",
            required: true,
            index: true,
        },
        timeOfDay: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        label: {
            type: String,
            trim: true,
            maxlength: 50,
        },
        daysOfWeek: {
            type: [Number],
            default: [1, 2, 3, 4, 5, 6, 7],
            validate: {
                validator(days) {
                    return days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7);
                },
                message: "daysOfWeek must contain values from 1 to 7",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        collection: "medication_schedules",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

export default models.MedicationSchedule ||
    model("MedicationSchedule", medicationScheduleSchema);
