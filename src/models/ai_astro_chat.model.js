import mongoose from 'mongoose';

const ask_ai_astro_schema = new mongoose.Schema(
    {
        aiAstroId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AI_Astrologer', // Reference to the AI_Astrologer collection
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User collection
            required: true,
        },
        messages: [
            {
                question: { type: String, required: true },
                answer: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        amount: { type: Number, default: 0 },
        isChatStarted: { type: Boolean, default: false },
        isChatEnded: { type: Boolean, default: false },
        duration: { type: Number, default: 0 }, // Duration in minutes
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

export const AI_Astro_Chat = mongoose.model('AI_Astro_Chat', ask_ai_astro_schema);
