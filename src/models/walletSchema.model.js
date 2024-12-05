import mongoose from 'mongoose';


const walletSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transaction_id: { type: String, required: true, unique: true },
    amount_type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    debit_type: {
        type: String,
        enum: ['Ecom', 'chat', 'call', 'video_call', 'palm_reading', 'gifting', 'horroscope_reading'],
        default: null
    }
}, { timestamps: true });

export const wallet = mongoose.model("walletSchema", walletSchema);