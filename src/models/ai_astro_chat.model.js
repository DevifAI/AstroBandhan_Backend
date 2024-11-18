import mongoose from 'mongoose';


const ask_ai_astro_schema = new mongoose.Schema({
    question: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User collection
        required: true
    },
    answer: { type: String, required: true },
    astrologyType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export const ai_astro_chat = mongoose.model('AIChat', ask_ai_astro_schema);

