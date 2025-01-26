import mongoose from 'mongoose';

const ai_astrologerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        experience: {
            type: Number,
            required: true,
        },
        specialities: [
            {
                type: String,
                required: true, // Ensure at least one speciality is provided
            },
        ],
        rating: {
            type: Number,
            default: 0,
        },
        totalRatingsCount: {
            type: Number,
            default: 0,
        },
        pricePerChatMinute: {
            type: Number,
            required: true,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female'],
            required: true,
        },
        walletBalance: {
            type: Number,
            default: 0,
        },
        bio: {
            type: String,
            requird: true
        },
        avatar: {
            type: String,
            default: function () {
                // Default avatar URL based on gender
                if (this.gender === 'Male') {
                    return 'https://ibb.co/C5mCpXV'; // Replace with your male avatar URL
                } else if (this.gender === 'Female') {
                    return 'https://ibb.co/x5rDjrM'; // Replace with your female avatar URL
                }
                return ''; // If no gender is set, return empty string
            },
        },
    },
    {
        timestamps: true,
    }
);

export const AI_Astrologer = mongoose.model('AI_Astrologer', ai_astrologerSchema);


