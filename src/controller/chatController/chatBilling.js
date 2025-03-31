import ChatRoom from "../../models/chatRoomSchema.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { Astrologer } from "../../models/astrologer.model.js";

async function getChatPrice(astrologerId, chatType) {
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) return null;

  switch (chatType) {
    case "chat":
      return astrologer.pricePerChatMinute;
    case "call":
      return astrologer.pricePerCallMinute;
    case "videoCall":
      return astrologer.pricePerVideoCallMinute;
    default:
      return null;
  }
}

async function getAdminCommission(astrologerId, chatType) {
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) return null;

  switch (chatType) {
    case "chat":
      return astrologer.chatCommission;
    case "call":
      return astrologer.callCommission;
    case "videoCall":
      return astrologer.videoCallCommission;
    default:
      return null;
  }
}

// Function to deduct wallet balance from user
async function deductUserWallet(user, costPerMinute) {
  if (user.wallet.balance < costPerMinute) {
    return { success: false, message: "Insufficient funds" };
  }

  user.wallet.balance -= costPerMinute; // Deduct balance
  await user.save(); // Save user without adding a transaction every minute

  return { success: true };
}

const sessionSummary = {}; // Store temporary balances
const intervals = {}; // Store chat intervals

// Function to start chat session
export async function startChat(io, roomId, chatType, userId, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);
    const user = await User.findById(userId);
    const admin = await Admin.findOne();

    if (!astrologer || !user || !admin) {
      io.to(roomId).emit("chat-error", {
        message: "Astrologer, User, or Admin not found",
      });
      return;
    }

    const costPerMinute = await getChatPrice(chatType, astrologerId);
    const adminCommission = await getAdminCommission(astrologerId, chatType);

    if (costPerMinute === null || adminCommission === null) {
      io.to(roomId).emit("chat-error", {
        message: "Invalid chat type or astrologer not found",
      });
      return;
    }

    // Initialize session summary
    sessionSummary[roomId] = {
      totalDeducted: 0,
      totalAstrologerEarnings: 0,
      totalAdminEarnings: 0,
    };

    // First deduction
    const firstDeduction = await deductUserWallet(user, costPerMinute);
    if (!firstDeduction.success) {
      io.to(roomId).emit("chat-error", { message: firstDeduction.message });
      io.to(roomId).emit("chat-end", { reason: firstDeduction.message });
      astrologer.status = "available";
      await astrologer.save();
      return;
    }

    // Calculate earnings based on commission
    const astrologerEarnings = ((100 - adminCommission) / 100) * costPerMinute;
    const adminEarnings = (adminCommission / 100) * costPerMinute;

    // Track totals
    sessionSummary[roomId].totalDeducted += costPerMinute;
    sessionSummary[roomId].totalAstrologerEarnings += astrologerEarnings;
    sessionSummary[roomId].totalAdminEarnings += adminEarnings;

    let totalTime = 1;
    const interval = setInterval(async () => {
      try {
        const deductionResult = await deductUserWallet(user, costPerMinute);
        if (!deductionResult.success) {
          io.to(roomId).emit("chat-error", {
            message: deductionResult.message,
          });
          io.to(roomId).emit("chat-end", { reason: deductionResult.message });

          astrologer.status = "available";
          await astrologer.save();
          clearInterval(interval);
          delete intervals[roomId];
          return;
        }

        // Accumulate deductions and earnings
        sessionSummary[roomId].totalDeducted += costPerMinute;
        sessionSummary[roomId].totalAstrologerEarnings += astrologerEarnings;
        sessionSummary[roomId].totalAdminEarnings += adminEarnings;

        totalTime++;
        io.to(roomId).emit("chat-timer", {
          roomId,
          cost: costPerMinute,
          elapsedTime: totalTime,
        });
      } catch (error) {
        console.error("Error during interval execution:", error);
        io.to(roomId).emit("chat-error", {
          message: "An error occurred during chat billing",
        });
        clearInterval(interval);
        delete intervals[roomId];
      }
    }, 60000);

    intervals[roomId] = interval;
  } catch (error) {
    console.error("Error in startChat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred during chat initialization",
    });
  }
}
