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
        enum: ['Ecom', 'chat', 'call', 'video_call', 'palm_reading', 'gifting', 'others'],
        default: null
    },
    chatRoomId: { // New field to track chat room ID
        type: String,
        ref: 'Chat',
        required: function () {
            return this.debit_type === 'chat'; // Only required if debit_type is 'chat'
        },
        default: null
    }
}, { timestamps: true });

export const Wallet = mongoose.model("wallet", walletSchema);