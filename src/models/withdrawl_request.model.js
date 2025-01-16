import mongoose from "mongoose";

// Define the schema for Astrologer Withdrawal Request
const astrologerWithdrawalRequestSchema = new mongoose.Schema({
  astrologerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Astrologer', // Assuming you have an astrologer collection
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  withdrawalType: {
    type: String,
    enum: ['upi', 'bank'],
    required: true
  },
  upiId: {
    type: String,
    required: function() {
      return this.withdrawalType === 'upi';
    }
  },
  bankDetails: {
    type: Object,
    required: function() {
      return this.withdrawalType === 'bank';
    }
  },
  isPaymentDone: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: String,
    enum: ['true', 'false', 'reject'],
    default: 'false'
  }
}, { timestamps: true });

// Create a model from the schema
export const AstrologerWithdrawalRequest = mongoose.model('AstrologerWithdrawalRequest', astrologerWithdrawalRequestSchema);

