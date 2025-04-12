import mongoose from "mongoose";
import moment from "moment-timezone";
import { Astrologer } from "../../models/astrologer.model.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import Waitlist from "../../models/waitlist.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { endChat, startChat } from "./chatBilling.js";
import { User } from "../../models/user.model.js";
import Chat from "../../models/chatSchema.js";

// Define a regex pattern to detect phone numbers, emails, and social media links/keywords
const SENSITIVE_INFO_REGEX =
  /(\+?\d{10,15})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(facebook|fb|instagram|insta|twitter|tiktok|snapchat|linkedin|whatsapp|telegram|discord|youtube|t.me|wa.me|snap\.com|linkedin\.com|tiktok\.com|facebook\.com|instagram\.com|twitter\.com|youtube\.com)/gi;

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
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);

    const userSocketId = user?.socketId;
    const astrologerSocketId = astrologer?.socketId;

    if (!user || !astrologer) {
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message: "User or Astrologer not found",
        });
      }
      return;
    }

    const userWallet = user.walletBalance;

    if (!userWallet || userWallet < astrologer.pricePerChatMinute) {
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message: "Insufficient balance",
        });
      }
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

      if (userSocketId) {
        io.to(userSocketId).emit("waitlist_added", {
          message: `Astrologer is currently busy. You have been added to the ${chatType} waitlist.`,
        });
      }
      return;
    }

    // Create a pending chat room
    const chatRoom = new ChatRoom({
      user: userId,
      astrologer: astrologerId,
      chatType,
      status: "pending",
    });
    await chatRoom.save();

    // Notify astrologer
    if (astrologerSocketId) {
      io.to(astrologerSocketId).emit("chat_request_received", {
        userId,
        chatRoomId: chatRoom._id,
        chatType,
        message: `New ${chatType} request received. Confirm to proceed.`,
      });
    }
  } catch (error) {
    console.error("Error creating chat request:", error);
  }
}

/**
 * Handle astrologer's response to a chat request
 */
export async function handleAstrologerResponse(
  io,
  chatRoomId,
  userId,
  astrologerId,
  response
) {
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);

    const userSocketId = user?.socketId;
    const astrologerSocketId = astrologer?.socketId;

    if (!chatRoom) {
      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_request_failed", {
          message: "Chat request not found.",
        });
      }
      return;
    }

    if (response === "confirm") {
      if (chatRoom.status !== "pending") {
        if (astrologerSocketId) {
          io.to(astrologerSocketId).emit("chat_request_failed", {
            message: "Chat request is no longer valid.",
          });
        }
        return;
      }

      // Update chat room status
      chatRoom.status = "confirmed";
      await chatRoom.save();

      // Notify user
      if (userSocketId) {
        io.to(userSocketId).emit("astrologer_confirmed", {
          chatRoomId,
          userId,
          astrologerId,
          message:
            "Astrologer is ready to join. Do you want to start the chat?",
        });
      }
    } else if (response === "reject") {
      // Delete chat room and remove from waitlist
      await ChatRoom.findByIdAndDelete(chatRoomId);
      await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_cancelled", {
          message: "The astrologer has rejected your chat request.",
        });
      }

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_request_cancelled", {
          message: "You have rejected the chat request.",
        });
      }
    }
  } catch (error) {
    console.error("Error handling astrologer response:", error);

    try {
      const astrologer = await Astrologer.findById(astrologerId);
      const astrologerSocketId = astrologer?.socketId;

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_error", {
          message: "An error occurred while processing the chat response.",
        });
      }
    } catch (err) {
      console.error("Failed to send error to astrologer:", err);
    }
  }
}

/**
 * Function to handle user response to astrologer confirmation or cancellation.
 */
export async function handleUserResponse(
  io,
  chatRoomId,
  userId,
  response,
  astrologerId
) {
  try {
    // Validate inputs
    if (!chatRoomId || !userId || !response || !astrologerId) {
      console.error("Missing required parameters in handleUserResponse");
      return;
    }

    // Fetch chat room, astrologer, and user
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const astrologer = await Astrologer.findById(astrologerId);
    const user = await User.findById(userId);

    const userSocketId = user?.socketId;
    const astrologerSocketId = astrologer?.socketId;

    // Ensure astrologer exists
    if (!astrologer) {
      console.error(`Astrologer not found: ${astrologerId}`);
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message: "Astrologer not found.",
        });
      }
      return;
    }

    // Handle user acceptance of the chat
    if (response === "accept") {
      if (!chatRoom || chatRoom.status !== "confirmed") {
        console.error(`Chat room not found or invalid status: ${chatRoomId}`);
        if (userSocketId) {
          io.to(userSocketId).emit("chat_request_failed", {
            message: "Chat request not found or already processed.",
          });
        }
        return;
      }

      // Update chat room status to "active"
      chatRoom.status = "active";
      chatRoom.isUserJoined = true;
      chatRoom.isAstrologerJoined = true;
      await chatRoom.save();

      // Update astrologer status to "busy"
      astrologer.status = "busy";
      await astrologer.save();

      // Remove user from waitlist
      await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      // Notify both sides
      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_started", {
          chatRoomId,
          message: "User accepted the request. Chat is starting...",
        });
      }

      if (userSocketId) {
        io.to(userSocketId).emit("chat_accepted", {
          chatRoomId,
          message: "Chat started successfully.",
        });
      }

      // Start the chat session
      await startChat(io, chatRoomId, chatRoom.chatType, userId, astrologerId);
    } else {
      // Handle user rejection or cancellation of the chat
      if (chatRoom) {
        await ChatRoom.findByIdAndDelete(chatRoomId);
      }

      await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_cancelled", {
          message: "Your chat request has been cancelled.",
        });
        io.to(userSocketId).emit("waitlist_removed", {
          message: "Your request has been removed from the waitlist.",
        });
      }

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_rejected", {
          chatRoomId,
          message: "User cancelled the chat request.",
        });
      }
    }
  } catch (error) {
    console.error("Error handling user response:", error);
    io.to(userId).emit("chat_request_failed", {
      message: "An error occurred while processing your response.",
    });
  }
}


/**
 * Function to handle saving and broadcasting chat messages.
 */
export const handleChatMessage = async (data, io) => {
  const { chatRoomId, senderType, senderId, messageType, message } = data;

  // Validate inputs
  if (!chatRoomId || !["user", "astrologer", "system"].includes(senderType)) {
    console.error("Invalid parameters in handleChatMessage");
    return { error: "Invalid parameters provided" };
  }

  // Check for sensitive info
  if (SENSITIVE_INFO_REGEX.test(message)) {
    try {
      let sender;
      if (senderType === "user") {
        sender = await User.findById(senderId);
      } else if (senderType === "astrologer") {
        sender = await Astrologer.findById(senderId);
      }

      if (sender?.socketId) {
        io.to(sender.socketId).emit("message_blocked", {
          message:
            "Warning: Your message was not sent because it contains restricted information",
        });
      }

      console.warn(
        `Blocked message from ${senderType} (${senderId}): ${message}`
      );
      return { error: "Message contains restricted information" };
    } catch (err) {
      console.error("Error checking sender during sensitive info block:", err);
      return { error: "Server error while checking sensitive info" };
    }
  }

  try {
    let chat = await Chat.findOne({ chatRoomId });

    if (!chat) {
      chat = new Chat({ chatRoomId, messages: [] });
    }

    const newMessage = {
      senderType,
      senderId,
      messageType: messageType || "text",
      message,
      timestamp: moment().tz("Asia/Kolkata").toDate(),
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Determine recipientType and recipientId
    const recipientType = senderType === "user" ? "astrologer" : "user";
    const recipientId = chat.participants?.[recipientType];

    if (!recipientId) {
      console.error("Recipient not found in chat participants");
      return { error: "Recipient not found" };
    }

    // Get recipient socket from DB
    let recipient;
    if (recipientType === "user") {
      recipient = await User.findById(recipientId);
    } else {
      recipient = await Astrologer.findById(recipientId);
    }

    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("received-message", newMessage);
    }

    return { success: true, timestamp: newMessage.timestamp };
  } catch (error) {
    console.error("Error saving message:", error);
    return { error: "Could not save message" };
  }
};

// Function to handle ending the chat and updating astrologer's status
export async function handleEndChat(
  io,
  roomId,
  userId,
  astrologerId,
  chatType,
  sender
) {
  try {
    // Validate inputs
    if (!roomId || !userId || !astrologerId || !chatType || !sender) {
      console.error("Missing required parameters in handleEndChat");
      io.to(roomId).emit("chat-error", {
        message: "Invalid parameters provided.",
      });
      return;
    }

    // Handle final deduction, earnings, cleanup, etc.
    await endChat(io, roomId, userId, astrologerId, chatType);

    // Calculate and store chat duration
    const chat = await Chat.findOne({ chatRoomId: roomId });
    if (chat && chat.messages.length > 0) {
      const startTime = chat.messages[0]?.timestamp;
      const endTime = chat.messages[chat.messages.length - 1]?.timestamp;
      if (startTime && endTime) {
        const durationMins = Math.round((endTime - startTime) / (1000 * 60));
        chat.duration = `${durationMins} minutes`;
        await chat.save();
      }
    }

    // Set astrologer to available
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      console.error("Astrologer not found:", astrologerId);
      return;
    }

    astrologer.status = "available";
    await astrologer.save();

    // Get user and astrologer socket IDs from DB
    const user = await User.findById(userId);
    const astro = astrologer;

    const payload = {
      message: "Chat session ended successfully.",
      endedBy: sender,
      duration: chat?.duration || "Unknown",
    };

    if (user?.socketId) io.to(user.socketId).emit("chat-ended", payload);
    if (astro?.socketId) io.to(astro.socketId).emit("chat-ended", payload);

    console.log(`Chat ended. Astrologer ${astro._id} is now available.`);
  } catch (error) {
    console.error("Error handling end of chat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred while ending chat.",
    });
  }
}
