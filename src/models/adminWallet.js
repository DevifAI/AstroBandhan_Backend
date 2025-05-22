import mongoose from 'mongoose';

const adminWalletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service_id: {
        type: String, default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    transaction_id: {
        type: String,
        required: true,
        unique: true,
    },
    transaction_type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    debit_type: {
        type: String,
        enum: ['payout_astrologer',],
        required: function () {
            return this.transaction_type === 'debit';
        },
        default: null,
    },
    credit_type: {
        type: String,
        enum: ['service_commission', 'wallet_recharge', 'payout_astrologer', 'call', 'chat', "audio"],
        required: function () {
            return this.transaction_type === 'credit';
        },
        default: null,
    },
}, { timestamps: true });

export const AdminWallet = mongoose.model('AdminWallet', adminWalletSchema);
