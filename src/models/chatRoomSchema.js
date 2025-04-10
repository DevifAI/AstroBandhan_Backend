import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: "Astrologer" },
    chatRoomId: { type: String, unique: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "inactive"],
      default: "pending",
    },
    isUserJoined: { type: Boolean, default: true },
    isAstrologerJoined: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
