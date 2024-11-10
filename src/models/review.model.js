import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot exceed 5.']  // Custom error messages for min and max validation
    }
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
