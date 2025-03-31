import { Astrologer } from "../../models/astrologer.model.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import Waitlist from "../../models/waitlist.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { startChat } from "./chatBilling.js";

/**
 * Function to check waitlist and notify users when an astrologer is available.
 */
export async function checkWaitlist(io, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer || astrologer.status !== "available") return;

    // Get next user from waitlist (oldest request first)
    const nextUser = await Waitlist.findOneAndDelete({
      astrologer: astrologerId,
    }).sort({ createdAt: 1 });

    if (nextUser) {
      io.to(nextUser.user.toString()).emit("waitlist_notified", {
        astrologerId,
        chatType: nextUser.chatType,
        message: `Astrologer is now available for ${nextUser.chatType}. Request chat again to start.`,
      });
    }
  } catch (error) {
    console.error("Error checking waitlist:", error);
  }
}

/**
 * Function to handle new chat request.
 */
export async function handleChatRequest(io, userId, astrologerId, chatType) {
  try {
    const userWallet = await Wallet.findOne({ user_id: userId });
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      io.to(userId).emit("chat_request_failed", {
        message: "Astrologer not found",
      });
      return;
    }

    if (!userWallet || userWallet.amount < astrologer.pricePerChatMinute) {
      io.to(userId).emit("chat_request_failed", {
        message: "Insufficient balance",
      });
      return;
    }

    if (astrologer.status === "busy") {
      // Add user to waitlist
      const waitlistEntry = new Waitlist({
        user: userId,
        astrologer: astrologerId,
        chatType,
        status: "waiting",
      });
      await waitlistEntry.save();

      io.to(userId).emit("waitlist_added", {
        message: `Astrologer is currently busy. You have been added to the ${chatType} waitlist.`,
      });
      return;
    }

    // Create a pending chat request
    const chatRoom = new ChatRoom({
      user: userId,
      astrologer: astrologerId,
      chatType,
      status: "pending",
    });
    await chatRoom.save();

    // Notify astrologer
    io.to(astrologerId).emit("chat_request_received", {
      userId,
      chatRoomId: chatRoom._id,
      chatType,
      message: `New ${chatType} request received. Confirm to proceed.`,
    });
  } catch (error) {
    console.error("Error creating chat request:", error);
  }
}

/**
 * Function to handle astrologer confirmation.
 */
export async function handleAstrologerConfirm(io, chatRoomId, astrologerId) {
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom || chatRoom.status !== "pending") return;

    io.to(chatRoom.user.toString()).emit("astrologer_confirmed", {
      chatRoomId,
      message: "Astrologer is ready to join. Do you want to start the chat?",
    });
  } catch (error) {
    console.error("Error in astrologer confirmation:", error);
  }
}

/**
 * Function to handle user response to astrologer confirmation.
 */
export async function handleUserResponse(io, chatRoomId, userId, accepted) {
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom || chatRoom.status !== "pending") return;

    const astrologer = await Astrologer.findById(chatRoom.astrologer);

    if (accepted) {
      chatRoom.status = "active";
      await chatRoom.save();

      astrologer.status = "busy";
      await astrologer.save();

      io.to(astrologer._id.toString()).emit("chat_started", {
        chatRoomId,
        message: "User accepted the request. Chat is starting...",
      });

      io.to(chatRoom.user.toString()).emit("chat_accepted", {
        chatRoomId,
        message: "Chat started successfully.",
      });

      await startChat(
        io,
        chatRoomId,
        chatRoom.chatType,
        userId,
        astrologer._id
      );
    } else {
      await ChatRoom.findByIdAndDelete(chatRoomId);

      io.to(astrologer._id.toString()).emit("chat_rejected", {
        chatRoomId,
        message: "User rejected the chat request.",
      });

      io.to(chatRoom.user.toString()).emit("chat_request_cancelled", {
        message: "Chat request cancelled.",
      });
    }
  } catch (error) {
    console.error("Error handling user response:", error);
  }
}

/**
 * Function to handle chat cancellation.
 */
export async function handleChatCancellation(io, userId, astrologerId) {
  try {
    // Check if user is in the waitlist
    const waitlistEntry = await Waitlist.findOneAndDelete({
      user: userId,
      astrologer: astrologerId,
    });

    if (waitlistEntry) {
      io.to(userId).emit("waitlist_removed", {
        message: "Your request has been removed from the waitlist.",
      });
      return;
    }

    // Check if there's a pending chat room
    const chatRoom = await ChatRoom.findOneAndDelete({
      user: userId,
      astrologer: astrologerId,
      status: "pending",
    });

    if (chatRoom) {
      io.to(astrologerId).emit("chat_request_cancelled", {
        message: "User has cancelled the chat request.",
      });

      io.to(userId).emit("chat_request_cancelled", {
        message: "Chat request has been cancelled.",
      });
      return;
    }

    io.to(userId).emit("chat_cancel_failed", {
      message: "No active chat request found to cancel.",
    });
  } catch (error) {
    console.error("Error handling chat cancellation:", error);
  }
}
