import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    astrologer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Astrologer",
      required: true,
    },
    chatType: {
      type: String,
      enum: ["chat", "audio", "video"],
      required: true,
    }, // Type of communication
    status: { type: String, enum: ["waiting"], default: "waiting" },
  },
  { timestamps: true }
);

const Waitlist = mongoose.model("Waitlist", waitlistSchema);
export default Waitlist;
