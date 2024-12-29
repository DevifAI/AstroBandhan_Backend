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
        recordingUrl: { type: String, default: null }, // Cloudinary URL for recording
        totalAmount: { type: Number, default: 0 }, // Total amount charged for the call
        recordingStarted:{type:Boolean}
    },
    { timestamps: true }
);

// Function to handle call start
// callSchema.pre("save", async function (next) {
//     const call = this;

//     // Prevent re-initializing an active call
//     if (call.isNew) {
//         try {
//             const user = await User.findById(call.userId);
//             const astrologer = await Astrologer.findById(call.astrologerId);

//             if (!user || !astrologer) {
//                 throw new Error("User or Astrologer not found");
//             }

//             const pricePerMinute = astrologer.pricePerCallMinute;

//             // Check if the user has enough balance to start the call
//             if (user.wallet < pricePerMinute) {
//                 throw new Error("Insufficient wallet balance to start the call");
//             }

//             // Deduct the first minute's price immediately
//             user.wallet -= pricePerMinute;
//             astrologer.walletBalance += pricePerMinute;

//             await user.save();
//             await astrologer.save();

//             // Initialize totalAmount
//             call.totalAmount = pricePerMinute;

//             // Start a timer to deduct money every minute
//             const intervalId = setInterval(async () => {
//                 try {
//                     const updatedUser = await User.findById(call.userId);
//                     if (updatedUser.wallet < pricePerMinute) {
//                         // End the call if insufficient balance
//                         clearInterval(intervalId);
//                         await endCallAndLogTransaction(call._id);
//                     } else {
//                         // Deduct for the next minute
//                         updatedUser.wallet -= pricePerMinute;
//                         astrologer.walletBalance += pricePerMinute;
//                         call.totalAmount += pricePerMinute;

//                         await updatedUser.save();
//                         await astrologer.save();
//                         console.log("Deducted for one minute");
//                     }
//                 } catch (error) {
//                     console.error("Error during per-minute deduction:", error);
//                     clearInterval(intervalId);
//                 }
//             }, 60000); // Deduct every 60 seconds

//             next();
//         } catch (error) {
//             next(error);
//         }
//     } else {
//         next();
//     }
// });

// Function to handle call end and log transaction


// Call model
const Call = mongoose.model("Call", callSchema);

export default Call;
