import mongoose from "mongoose";
import { User } from "./user.model.js"; // User model
import { Astrologer } from "./astrologer.model.js"; // Astrologer model
import { Wallet } from "./walletSchema.model.js"; // Wallet model

// Call Schema
const callSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: "Astrologer", required: true },
        duration: { type: Number, default: 0 }, // Duration in seconds
        startedAt: { type: Date, required: true },
        endedAt: { type: Date },
        channelName: { type: String, required: true }, // Agora channel name
        resourceId: { type: String, required: true }, // Agora resource ID for recording
        sid: { type: String, required: true }, // Agora session ID
        recordingUID: { type: String, required: true }, // Agora session ID
        recordingToken: { type: String, required: true }, // Agora session ID
        recordingData: { type: Object, default: null }, // AWS  for recording
        totalAmount: { type: Number, default: 0 }, // Total amount charged for the call
        recordingStarted: { type: Boolean },
        callType: { type: String, default: "audio" }
    },
    { timestamps: true }
);




// Call model
const Call = mongoose.model("Call", callSchema);

export default Call;
