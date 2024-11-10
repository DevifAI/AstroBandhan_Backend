import mongoose from 'mongoose';

const { Schema } = mongoose;

const pendingAstrologerRequestSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female'],
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true, // Ensure the phone number is unique
        },
        experience: {
            type: Number,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        languages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Language', // Assuming Language is another model in your application
                required: true,
            },
        ],
        bio: {
            type: String,
            required: true,
        },
        isApproved: {
            type: Boolean,
            default: false, // Default to false when the request is pending
        },
    },
    { timestamps: true }
);


const PendingAstrologerRequest = mongoose.model('PendingAstrologerRequest', pendingAstrologerRequestSchema);

export default PendingAstrologerRequest;
