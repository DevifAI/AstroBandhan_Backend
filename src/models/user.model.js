import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    socketId: {
      type: String,
      default: null,
    },
    email: { type: String, required: true, unique: true },
    dateOfBirth: { type: String, required: true },
    password: { type: String, required: true },
    timeOfBirth: { type: String, required: true },
    placeOfBirth: { type: String, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    photo: { type: String, required: true },
    Free_Chat_Available: { type: Boolean, default: true },
    followed_astrologers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Astrologer", default: [] },
    ],
    consultations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consultation",
        default: [],
      },
    ],
    selected_language_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
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
userSchema.methods.generateRefreshToken = function () {
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

export const User = mongoose.model("User", userSchema);
