import mongoose from "mongoose";
import { Wallet } from "../../models/walletSchema.model.js";
import Call from "../../models/call.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Chat from "../../models/chatSchema.js";

export const findWalletByUserId = async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user_id = new mongoose.Types.ObjectId(userId);
    if (type === "user") {
      const result = await Wallet.find({
        user_id,
        credit_type: "wallet_recharge",
      });

      if (result.length === 0) {
        return res.status(404).json({ message: "No records found" });
      }
      return res.status(200).json(result);
    } else {
      const result = await Wallet.find({
        astrologer_id: user_id,
      }).sort({ created_at: -1 }); // -1 for descending (newest first)

      if (result.length === 0) {
        return res.status(404).json({ message: "No records found" });
      }
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Audio call transaction
export const findCall_Transaction_ByUserId = async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user_id = new mongoose.Types.ObjectId(userId);
    console.log({ user_id });
    let query =
      type === "user"
        ? { userId: user_id, callType: { $in: ["audio", "video"] } }
        : { astrologerId: user_id, callType: { $in: ["audio", "video"] } };

    const result = await Call.find(query)
      .populate({
        path: "userId",
        select: "name photo",
      })
      .populate({
        path: "astrologerId",
        select: "name avatar pricePerCallMinute",
      });
    console.log({ result });
    if (result.length === 0) {
      return res.status(200).json({ message: "No records found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Video call transaction
export const findVideo_Call_Transaction_ByUserId = async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user_id = new mongoose.Types.ObjectId(userId);

    let query;
    if (type === "user") {
      query = { userId: user_id, callType: "video" };
    } else {
      query = { astrologerId: user_id, callType: "video" };
    }

    const result = await Call.find(query)
      .populate({
        path: "userId",
        select: "name photo",
      })
      .populate({
        path: "astrologerId",
        select: "name avatar pricePerVideoCallMinute",
      });

    if (result.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const findChat_Transaction_ByUserId = asyncHandler(async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user_id = new mongoose.Types.ObjectId(userId);

    let query =
      type === "user"
        ? { "messages.senderId": user_id, "messages.senderType": "user" }
        : { "messages.senderId": user_id, "messages.senderType": "astrologer" };

    const chats = await Chat.find(query)
      .populate({ path: "participants.user", select: "name photo" })
      .populate({ path: "participants.astrologer", select: "name avatar" });

    if (chats.length === 0) {
      return res.status(404).json({ message: "No chat transactions found" });
    }

    const result = await Promise.all(
      chats.map(async (chat) => {
        const walletTx = await Wallet.findOne({
          service_reference_id: chat.chatRoomId,
          user_id,
          transaction_type: "debit",
          debit_type: "text",
        });

        const createdAt = new Date(chat.createdAt);
        const updatedAt = new Date(chat.updatedAt);
        const durationMs = updatedAt - createdAt;

        // Convert duration to hh:mm:ss format
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const duration =
          hours > 0
            ? `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            : `${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;

        return {
          user: chat.participants.user,
          astrologer: chat.participants.astrologer,
          amount: walletTx?.amount ?? 0,
          createdAt: chat.createdAt,
          duration,
        };
      })
    );
    console.log({ result });
    return res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});
