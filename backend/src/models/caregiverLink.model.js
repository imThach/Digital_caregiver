import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const caregiverLinkSchema = new Schema(
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
            index: true,
        },
        pairingCode: {
            type: String,
            required: true,
            minlength: 6,
            maxlength: 6,
            index: true,
        },
        pairingCodeExpiresAt: Date,
        emergencyPhone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
        relationship: {
            type: String,
            trim: true,
            maxlength: 80,
        },
        status: {
            type: String,
            enum: ["pending", "active", "revoked"],
            default: "pending",
            index: true,
        },
        isPrimary: {
            type: Boolean,
            default: true,
        },
        linkedAt: Date,
    },
    {
        collection: "caregiver_links",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

caregiverLinkSchema.index(
    { caregiverId: 1, elderlyId: 1 },
    { unique: true, partialFilterExpression: { elderlyId: { $exists: true } } },
);

export default models.CaregiverLink || model("CaregiverLink", caregiverLinkSchema);
