import mongoose from 'mongoose';
import Review from './review.model.js';
import { Language } from './language.model.js';
import jwt from 'jsonwebtoken';

const astrologerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    experience: {
      type: Number,
      required: true,
      default: 0,
      min: [1, 'Experience must be at least 1 year'], // Minimum experience of 1 year
      max: [100, 'Experience cannot exceed 100 years'] // Maximum experience of 50 years
    },
    specialities: [String], // e.g., ["Vedic Astrology", "Palmistry"]
    languages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: [true, 'At least one language must be specified.']  // Custom error message
    }],
    rating: { type: Number, default: 0 },  // This will be dynamically calculated
    totalRatingsCount: { type: Number, default: 0 },
    pricePerCallMinute: { type: Number, required: true },  // Price per minute for calls
    pricePerChatMinute: { type: Number, required: true },  // Price per minute for chat
    available: {
      type: {
        isAvailable: { type: Boolean, default: false },
        isCallAvailable: { type: Boolean, default: false },
        isChatAvailable: { type: Boolean, default: false },
        isVideoCallAvailable: { type: Boolean, default: false }
      },
      default: {
        isAvailable: false,
        isCallAvailable: false,
        isChatAvailable: false,
        isVideoCallAvailable: false
      }
    },
    isVerified: { type: Boolean, default: false },
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
    isFeatured: { type: Boolean, default: false },
    password: { type: String, required: true },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female'], // Restrict to only Male or Female
      message: 'Gender must be either Male or Female' // Custom error message if value is invalid
    },
    phone: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    selected_language_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language'
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to handle the asynchronous logic for `selected_language_id`
astrologerSchema.pre('save', async function (next) {
  // Check if `selected_language_id` is not set
  if (!this.selected_language_id) {
    // Find the language by name (e.g., 'English')
    const language = await Language.findOne({ name: 'English' });

    if (language) {
      this.selected_language_id = language._id;

      // Check if this language ID is already in the `languages` array
      if (this.languages.length === 0) {
        this.languages.push(language._id); // Add language ID to the `languages` array if not present
      }
    }
  }
  next(); // Proceed with saving the document after setting values
});

astrologerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "60d",
    }
  );
};

// Method to generate Refresh Token
astrologerSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "80d",
    }
  );
};

// Update astrologer's average rating and total ratings count
astrologerSchema.statics.updateAverageRating = async function (astrologerId, newRating) {
  const astrologer = await this.findById(astrologerId);
  if (!astrologer) return null; // Return null if astrologer is not found

  // Calculate the total ratings count and the new average rating
  const totalRatings = astrologer.totalRatingsCount + 1;
  const averageRating = ((astrologer.rating * astrologer.totalRatingsCount) + newRating) / totalRatings;

  // Round the average rating to 1 decimal place
  const roundedAverageRating = Math.round(averageRating * 10) / 10;

  // Update astrologer document with new rating and total ratings count
  astrologer.rating = roundedAverageRating;
  astrologer.totalRatingsCount = totalRatings;

  // Save the updated astrologer data
  await astrologer.save();

  return astrologer;
};

export const Astrologer = mongoose.model("Astrologer", astrologerSchema);
