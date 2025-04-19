import { Astrologer } from "../../../models/astrologer.model.js";
import { User } from "../../../models/user.model.js";
import uuid from "uuid"; // default import in version 3.x
import { Wallet } from "../../../models/walletSchema.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const sendGift_To_Astrologer = asyncHandler(async (req, res) => {
  try {
    const { astrologerId, userId, amount } = req.body;

    // Find the astrologer by ID
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      return res.status(404).json({ message: "Astrologer not found" });
    }
    // Find the astrologer by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }
    // Update wallet balances
    user.walletBalance -= amount;
    astrologer.walletBalance += amount;

    await user.save();
    await astrologer.save();

    // Create wallet transaction for user (debit)
    await Wallet.create({
      user_id: user._id,
      amount: amount,
      transaction_id: uuid.v4(),
      transaction_type: "debit",
      debit_type: "gifting",
    });

    // Create wallet transaction for astrologer (credit)
    await Wallet.create({
      astrologer_id: astrologer._id,
      amount: amount,
      transaction_id: uuid.v4(),
      transaction_type: "credit",
      credit_type: "gifting",
    });

    res.status(200).json({
      message: "Gift Sent To Astrologer",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
