import mongoose from "mongoose";
import moment from "moment-timezone";

const chatSchema = new mongoose.Schema(
  {
    chatRoomId: { type: String },
    participants: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      astrologer: { type: mongoose.Schema.Types.ObjectId, ref: "Astrologer" },
    },
    messages: [
      {
        senderType: {
          type: String,
          enum: ["user", "astrologer", "system"],
          required: true,
        },
        senderId: {
          type: String,
          refPath: "senderType",
          required: function () {
            return this.senderType !== "system";
          },
        },
        messageType: {
          type: String,
          default: "text", // Default value is 'text'
          required: true, // Make messageType required
        },
        message: { type: String, required: true },
        timestamp: {
          type: Date,
          default: function () {
            // Set the timestamp to the local timezone before saving
            return moment().tz("Asia/Kolkata").toDate(); // Change to your desired timezone
          },
        },
      },
    ],
    startTime: {
      type: Date,
      default: function () {
        return moment().tz("Asia/Kolkata").toDate(); // Change to your desired timezone
      },
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: { type: String, default: "Not Started" },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
