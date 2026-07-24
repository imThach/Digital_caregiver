import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const aiConversationSchema = new Schema(
    {
        elderlyId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        questionText: {
            type: String,
            required: true,
        },
        answerText: String,
    },
    {
        collection: "ai_conversations",
        timestamps: { createdAt: true, updatedAt: false },
    },
);

aiConversationSchema.index({ elderlyId: 1, createdAt: -1 });

export default models.AiConversation || model("AiConversation", aiConversationSchema);
