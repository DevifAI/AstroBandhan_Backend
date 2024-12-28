import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    astrologer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Astrologer',
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transaction_id: {
        type: String,
        required: true,
        unique: true
    },
    transaction_type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    debit_type: {
        type: String,
        enum: ['Ecom', 'chat', 'call', 'video_call', 'palm_reading', 'gifting', 'withdrawl_astrologer', 'others'],
        default: null,
        required: function () {
            return this.transaction_type === 'debit';
        }
    },
    credit_type: {
        type: String,
        enum: ['wallet_recharge', 'chat', 'call', 'video_call', 'palm_reading', 'others'],
        default: null,
        required: function () {
            return this.transaction_type === 'credit';
        }
    },
    service_reference_id: {
        type: String,
        default: null
    },

    admin_id: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

export const Wallet = mongoose.model("Wallet", walletSchema);
