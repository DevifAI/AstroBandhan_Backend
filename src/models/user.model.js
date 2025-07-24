import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    socketId: {
      type: String,
      default: null,
    },
    email: { type: String, required: false, unique: true },
    dateOfBirth: { type: String, required: false },
    password: { type: String },
    timeOfBirth: { type: String, required: false },
    placeOfBirth: { type: String, required: false },
    gender: { type: String, required: false },
    phone: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    photo: { type: String },
    playerId: { type: String, default: null },
    isOnApp: { type: Boolean, default: false },
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
    accessToken: { type: String },
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
