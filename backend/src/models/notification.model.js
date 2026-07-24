import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const notificationSchema = new Schema(
    {
        caregiverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["missed_dose", "sos", "system"],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        message: String,
        relatedLogId: {
            type: Schema.Types.ObjectId,
            ref: "MedicationLog",
        },
        relatedEmergencyId: {
            type: Schema.Types.ObjectId,
            ref: "EmergencyEvent",
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        sentViaEmail: {
            type: Boolean,
            default: false,
        },
    },
    {
        collection: "notifications",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

notificationSchema.index({ caregiverId: 1, isRead: 1, createdAt: -1 });

export default models.Notification || model("Notification", notificationSchema);
