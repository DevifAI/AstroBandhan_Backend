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
export async function handleChatRequest(
  io,
  userId,
  astrologerId,
  chatType,
  astrologerSocketMap,
  userSocketMap
) {
  try {
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);

    if (!user || !astrologer) {
      const userSocketId = userSocketMap.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message: "User or Astrologer not found",
        });
      }
      return;
    }

    const userWallet = user.walletBalance;

    if (!userWallet || userWallet < astrologer.pricePerChatMinute) {
      const userSocketId = userSocketMap.get(userId);
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

      const userSocketId = userSocketMap.get(userId);
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
    const astrologerSocketId = astrologerSocketMap.get(astrologerId);
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
  response,
  userSocketMap,
  astrologerSocketMap
) {
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);

    const userSocketId = userSocketMap?.get?.(userId);
    const astrologerSocketId = astrologerSocketMap?.get?.(astrologerId);

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

      // Update status
      chatRoom.status = "confirmed";
      await chatRoom.save();

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
    const astrologerSocketId = astrologerSocketMap?.get?.(astrologerId);
    if (astrologerSocketId) {
      io.to(astrologerSocketId).emit("chat_error", {
        message: "An error occurred while processing the chat response.",
      });
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
  astrologerId,
  astrologerSocketMap
) {
  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const astrologer = await Astrologer.findById(astrologerId);

    const astrologerSocketId = astrologerSocketMap?.get?.(astrologerId);

    if (!astrologer) {
      io.to(userId).emit("chat_request_failed", {
        message: "Astrologer not found.",
      });
      return;
    }

    if (response === "accept") {
      if (!chatRoom || chatRoom.status !== "confirmed") {
        io.to(userId).emit("chat_request_failed", {
          message: "Chat request not found or already processed.",
        });
        return;
      }

      // Start the chat
      chatRoom.status = "active";
      await chatRoom.save();

      astrologer.status = "busy";
      await astrologer.save();

      // Remove from waitlist
      await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_started", {
          chatRoomId,
          message: "User accepted the request. Chat is starting...",
        });
      }

      io.to(userId).emit("chat_accepted", {
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
      // Rejected or cancelled
      await ChatRoom.findByIdAndDelete(chatRoomId);

      const waitlistEntry = await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      if (waitlistEntry) {
        io.to(userId).emit("waitlist_removed", {
          message: "Your request has been removed from the waitlist.",
        });
      }

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_rejected", {
          chatRoomId,
          message: "User cancelled the chat request.",
        });
      }

      io.to(userId).emit("chat_request_cancelled", {
        message: "Your chat request has been cancelled.",
      });
    }
  } catch (error) {
    console.error("Error handling user response:", error);
  }
}

/**
 * Function to handle saving and broadcasting chat messages.
 */
export const handleChatMessage = async (data, io) => {
  const { chatRoomId, senderType, senderId, messageType, message } = data;

  // Validate sender type
  if (!["user", "astrologer", "system"].includes(senderType)) {
    return { error: "Invalid sender type" };
  }

  // Check if the message contains sensitive information or social media references
  if (SENSITIVE_INFO_REGEX.test(message)) {
    // Send warning only to the sender
    io.to(senderId).emit("message_blocked", {
      message:
        "Warning: Your message was not sent because it contains restricted information (phone numbers, emails, or social media links/references).",
    });

    console.warn(
      `Blocked message from ${senderType} (${senderId}): ${message}`
    );

    // Prevent further processing of the message
    return { error: "Message contains restricted information" };
  }

  try {
    // Find or create the chat room
    let chat = await Chat.findOne({ chatRoomId });

    if (!chat) {
      chat = new Chat({ chatRoomId, messages: [] });
    }

    // Create new message object
    const newMessage = {
      senderType,
      senderId,
      messageType: messageType || "text", // Default to text if not provided
      message,
      timestamp: moment().tz("Asia/Kolkata").toDate(),
    };

    // Add message to chat
    chat.messages.push(newMessage);
    await chat.save();

    // Emit the message only to users in the chat room (sender already warned)
    io.to(chatRoomId).emit("received-message", newMessage);
    console.log("Message broadcasted to room:", chatRoomId);

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
    // End the chat session and process transactions
    await endChat(io, roomId, userId, astrologerId, chatType);

    // Find the chat record
    const chat = await Chat.findOne({ chatRoomId: roomId });
    if (chat && chat.messages.length > 0) {
      // Calculate chat duration
      const startTime = chat.messages[0].timestamp;
      const endTime = chat.messages[chat.messages.length - 1].timestamp;
      const durationInMinutes = Math.round((endTime - startTime) / (1000 * 60)); // Convert milliseconds to minutes

      // Save the duration
      chat.duration = `${durationInMinutes} minutes`;
      await chat.save();
    }

    // Find the astrologer
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      console.error("Astrologer not found:", astrologerId);
      return;
    }

    // Update astrologer's status to 'available'
    astrologer.status = "available";
    await astrologer.save();

    // Notify users about chat end
    io.to(roomId).emit("chat-ended", {
      message: "Chat session ended successfully.",
      endedBy: sender,
      duration: chat?.duration || "Unknown",
    });

    console.log(
      `Chat ended. Astrologer ${astrologer._id} is now available. Duration: ${chat?.duration || "Unknown"}`
    );
  } catch (error) {
    console.error("Error handling end of chat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred while ending chat.",
    });
  }
}
