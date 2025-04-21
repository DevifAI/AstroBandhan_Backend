import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: "Astrologer" },
    chatType: {
      type: String,
      enum: ["text", "audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "rejected", "ended"],
      default: "pending",
    },
    rejectedBy: {
      type: String,
      enum: ["user", "astrologer", "system"],
    },
    endedBy: {
      type: String,
      enum: ["user", "astrologer", "system"],
    },
    isUserJoined: { type: Boolean, default: false },
    isAstrologerJoined: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
