import { Wallet } from "../../models/walletSchema.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { User } from "../../models/user.model.js";
import { Admin } from "../../models/adminModel.js";
import mongoose from "mongoose";
import { AdminWallet } from "../../models/adminWallet.js";

const sessionSummary = {};
const intervals = {};

// Helper: Get astrologer’s price per chat type
async function getChatPrice(astrologerId, chatType) {
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new Error("Astrologer not found");

  switch (chatType) {
    case "text":
      return astrologer.pricePerChatMinute;
    case "audio":
      return astrologer.pricePerCallMinute;
    case "video":
      return astrologer.pricePerVideoCallMinute;
    default:
      throw new Error("Invalid chat type");
  }
}

// Helper: Get commission percentage
async function getAdminCommission(astrologerId, chatType) {
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new Error("Astrologer not found");

  switch (chatType) {
    case "text":
      return astrologer.chatCommission;
    case "audio":
      return astrologer.callCommission;
    case "video":
      return astrologer.videoCallCommission;
    default:
      throw new Error("Invalid chat type");
  }
}

export async function startChat(io, roomId, chatType, userId, astrologerId) {
  try {
    if (!roomId || !chatType || !userId || !astrologerId) {
      throw new Error("Missing required parameters");
    }

    const [astrologer, user, admin] = await Promise.all([
      Astrologer.findById(astrologerId),
      User.findById(userId),
      Admin.findOne(),
    ]);

    if (!astrologer || !user || !admin) {
      throw new Error("Astrologer, User, or Admin not found");
    }

    const costPerMinute = await getChatPrice(astrologerId, chatType);
    const adminCommission = await getAdminCommission(astrologerId, chatType);
    const adminShare = costPerMinute - adminCommission;
    const astrologerShare = costPerMinute - adminShare;

    // Insufficient balance check
    if (user.walletBalance < costPerMinute) {
      io.to(user.socketId).emit("chat-error", {
        message: "Insufficient funds",
      });
      astrologer.status = "available";
      await astrologer.save();
      return;
    }

    // Deduct first minute
    user.walletBalance -= costPerMinute;
    await user.save();

    // Create initial wallet transactions
    const txUser = new Wallet({
      user_id: userId,
      amount: costPerMinute,
      transaction_type: "debit",
      debit_type: chatType,
      service_reference_id: roomId,
      transaction_id: new mongoose.Types.ObjectId(),
    });

    const txAstrologer = new Wallet({
      astrologer_id: astrologerId,
      amount: astrologerShare,
      transaction_type: "credit",
      credit_type: chatType,
      service_reference_id: roomId,
      transaction_id: new mongoose.Types.ObjectId(),
    });

    const txAdmin = new AdminWallet({
      userId: admin._id,
      amount: adminShare,
      transaction_type: "credit",
      credit_type: "chat",
      service_id: roomId,
      transaction_id: new mongoose.Types.ObjectId(),
    });

    await Promise.all([txUser.save(), txAstrologer.save(), txAdmin.save()]);

    astrologer.walletBalance += astrologerShare;
    admin.adminWalletBalance += adminShare;
    await Promise.all([astrologer.save(), admin.save()]);

    sessionSummary[roomId] = {
      totalDeducted: costPerMinute,
      totalTime: 1,
      costPerMinute,
      adminCommission,
      txUserId: txUser._id,
      txAstrologerId: txAstrologer._id,
      txAdminId: txAdmin._id,
    };

    let totalTime = 1;

    const interval = setInterval(async () => {
      try {
        const freshUser = await User.findById(userId);
        const freshAstrologer = await Astrologer.findById(astrologerId);
        const freshAdmin = await Admin.findOne();

        if (!freshUser || !freshAstrologer || !freshAdmin)
          throw new Error("Entity not found");

        if (freshUser.walletBalance < costPerMinute * 3) {
          io.to(user.socketId).emit("low-balance-warning", {
            message: "Warning: Low wallet balance. Only 2 minutes left.",
          });
        }

        if (freshUser.walletBalance < costPerMinute) {
          io.to(user.socketId).emit("chat-end", {
            reason: "Insufficient funds",
          });
          io.to(astrologer.socketId).emit("chat-end", {
            reason: "User has insufficient balance.",
          });

          astrologer.status = "available";
          await astrologer.save();
          clearInterval(interval);
          delete intervals[roomId];
          return;
        }

        // Deduct next minute
        freshUser.walletBalance -= costPerMinute;
        await freshUser.save();

        // Calculate shares again
        const adminShare = costPerMinute - adminCommission;
        const astrologerShare = costPerMinute - adminShare;

        // Update previous wallet transactions
        await Promise.all([
          Wallet.findByIdAndUpdate(sessionSummary[roomId].txUserId, {
            $inc: { amount: costPerMinute },
          }),
          Wallet.findByIdAndUpdate(sessionSummary[roomId].txAstrologerId, {
            $inc: { amount: astrologerShare },
          }),
          AdminWallet.findByIdAndUpdate(sessionSummary[roomId].txAdminId, {
            $inc: { amount: adminShare },
          }),
        ]);

        // Update wallet balances
        freshAstrologer.walletBalance += astrologerShare;
        freshAdmin.adminWalletBalance += adminShare;
        await Promise.all([freshAstrologer.save(), freshAdmin.save()]);

        sessionSummary[roomId].totalDeducted += costPerMinute;
        sessionSummary[roomId].totalTime = ++totalTime;

        io.to(user.socketId).emit("chat-timer", {
          roomId,
          elapsedTime: totalTime,
        });
        io.to(astrologer.socketId).emit("chat-timer", {
          roomId,
          elapsedTime: totalTime,
        });
      } catch (err) {
        console.error("Billing interval error:", err);
        clearInterval(interval);
        delete intervals[roomId];
      }
    }, 60000);

    intervals[roomId] = interval;
  } catch (err) {
    console.error("Error in startChat:", err);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred during chat initialization.",
    });
  }
}

// End chat session, settle payments
// export async function endChat(io, roomId, userId, astrologerId) {
//   try {
//     if (!roomId || !userId || !astrologerId) {
//       throw new Error("Missing required parameters");
//     }

//     const [user, astrologer] = await Promise.all([
//       User.findById(userId),
//       Astrologer.findById(astrologerId),
//     ]);

//     if (!user || !astrologer) {
//       throw new Error("User or Astrologer not found");
//     }

//     // Mark astrologer as available again
//     astrologer.status = "available";
//     await astrologer.save();

//     // Stop billing interval
//     if (intervals[roomId]) {
//       clearInterval(intervals[roomId]);
//       delete intervals[roomId];
//     }

//     const session = sessionSummary[roomId];

//     // Emit chat end event with summary
//     io.to(user.socketId).emit("chat-ended", {
//       message: "Chat ended",
//       totalTime: session?.totalTime || 0,
//       totalDeducted: session?.totalDeducted || 0,
//     });

//     io.to(astrologer.socketId).emit("chat-ended", {
//       message: "Chat ended",
//       totalTime: session?.totalTime || 0,
//       totalEarnings: session
//         ? (session.totalDeducted * (100 - session.adminCommission)) / 100
//         : 0,
//     });

//     // Clean up session summary
//     delete sessionSummary[roomId];
//   } catch (err) {
//     console.error("Error in endChat:", err);
//     io.to(roomId).emit("chat-error", {
//       message: "An error occurred while ending the chat.",
//     });
//   }
// }

export async function endChat(io, roomId, userId, astrologerId) {
  try {
    if (!roomId || !userId || !astrologerId) {
      throw new Error("Missing required parameters");
    }

    const [user, astrologer, admin] = await Promise.all([
      User.findById(userId),
      Astrologer.findById(astrologerId),
      Admin.findOne(),
    ]);

    if (!user || !astrologer || !admin) {
      throw new Error("User, Astrologer, or Admin not found");
    }

    // Mark astrologer as available again
    astrologer.status = "available";
    await astrologer.save();

    // Stop billing interval
    if (intervals[roomId]) {
      clearInterval(intervals[roomId]);
      delete intervals[roomId];
    }

    const session = sessionSummary[roomId];

    // If session was never initialized
    if (!session) {
      io.to(user.socketId).emit("chat-ended", {
        message: "Chat ended (no session data)",
        totalTime: 0,
        totalDeducted: 0,
      });

      io.to(astrologer.socketId).emit("chat-ended", {
        message: "Chat ended (no session data)",
        totalTime: 0,
        totalEarnings: 0,
      });

      return;
    }

    const { totalTime, totalDeducted, adminCommission } = session;
    const totalEarnings = totalDeducted - adminCommission;

    // Final emit to both user and astrologer
    io.to(user.socketId).emit("chat-ended", {
      message: "Chat ended",
      totalTime,
      totalDeducted,
    });

    io.to(astrologer.socketId).emit("chat-ended", {
      message: "Chat ended",
      totalTime,
      totalEarnings,
    });

    // Cleanup session data
    delete sessionSummary[roomId];
  } catch (err) {
    console.error("Error in endChat:", err);
    if (roomId) {
      io.to(roomId).emit("chat-error", {
        message: "An error occurred while ending the chat.",
      });
    }
  }
}
