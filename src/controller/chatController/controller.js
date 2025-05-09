import moment from "moment-timezone";
import { Astrologer } from "../../models/astrologer.model.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import Waitlist from "../../models/waitlist.model.js";
import { endChat, startChat } from "./chatBilling.js";
import { User } from "../../models/user.model.js";
import Chat from "../../models/chatSchema.js";
import sendPushNotification from "../../utils/One_Signal/onesignal.js";
import { formatISTDateTime } from "../../utils/validate_Date_Time.js";

// Define a regex pattern to detect phone numbers, emails, and social media links/keywords
const SENSITIVE_INFO_REGEX =
  /(\+?\d{10,15})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(facebook|fb|instagram|insta|twitter|tiktok|snapchat|linkedin|whatsapp|telegram|discord|youtube|t.me|wa.me|snap\.com|linkedin\.com|tiktok\.com|facebook\.com|instagram\.com|twitter\.com|youtube\.com)/;

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
  console.log({ userId, astrologerId, chatType });

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

    console.log({ astrologerSocketId });

    if (!astrologerSocketId) {
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message: "Astrologer is not accepting requests right now",
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

    const existingChatRoom = await ChatRoom.findOne({
      user: userId,
      status: { $in: ["confirmed", "pending"] },
    });

    const userOnChatRoom = await ChatRoom.findOne({
      user: userId,
      status: { $in: ["active"] },
    });

    const onChatSession = await ChatRoom.findOne({
      astrologer: astrologerId,
      status: { $in: ["active", "confirmed", "pending"] },
    });

    // console.log({ existingChatRoom, onChatSession });

    if (userOnChatRoom) {
      console.log("Pending chat request exists:", existingChatRoom._id);
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message:
            "You are already in a consultation session. Please end the current session to start a new one.",
        });
      }
      return;
    }
    if (existingChatRoom) {
      console.log("Pending chat request exists:", existingChatRoom._id);
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message:
            "You have already sent a request. Please cancel the old request.",
        });
      }
      return;
    }

    if (onChatSession) {
      console.log("Astrologer is busy in session:", onChatSession._id);
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_failed", {
          message:
            "Astrologer is busy. We will let you know when they are available.",
        });
      }
      return;
    }

    // Create new chat room
    const chatRoom = new ChatRoom({
      user: userId,
      astrologer: astrologerId,
      chatType,
      status: "pending",
    });

    await chatRoom.save();

    if (astrologerSocketId) {
      console.log("test");
      io.to(astrologerSocketId).emit("chat_request_received", {
        message: "You have a new chat request. Please respond within 5 min.",
      });
    }
    const userPlayerId = user?.playerId;
    if (userSocketId) {
      const title = "Chat Request Sent";
      const message = "Your chat request has been sent successfully.";
      await sendPushNotification(
        userId,
        title,
        message,
        userPlayerId // Ensure the playerId is passed for reliable delivery
      );
    }

    // Optional notifications can be added back here

    // Start timeout
    setTimeout(async () => {
      const updatedChatRoom = await ChatRoom.findById(chatRoom._id);
      if (updatedChatRoom && updatedChatRoom.status === "pending") {
        await handleAstrologerResponse(
          io,
          chatRoom._id,
          userId,
          astrologerId,
          "timeout"
        );
      }
    }, 300000); // 5 minutes
  } catch (error) {
    console.error("Error creating chat request:", error.message);
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
      console.log("response", response);
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
        const userPlayerId = user?.playerId;
        const title = "Chat Request Accepted";
        const message = "Your chat request has been Accepted.";
        await sendPushNotification(
          userId,
          title,
          message,
          userPlayerId // Ensure the playerId is passed for reliable delivery
        );
        io.to(userSocketId).emit("astrologer_confirmed", {
          chatRoomId,
          userId,
          astrologerId,
          message:
            "Astrologer is ready to join. Do you want to start the chat?",
        });
        io.to(astrologerSocketId).emit("astrologer_confirmed", {
          chatRoomId,
          userId,
          astrologerId,
          message:
            "Astrologer is ready to join. Do you want to start the chat?",
        });
      }

      // Add system message to chat collection
      const fullUser = await User.findById(userId).lean();
      const name = fullUser?.name || "User";
      const gender = fullUser?.gender;
      const dateOfBirth = fullUser?.dateOfBirth;
      const timeOfBirth = fullUser?.timeOfBirth;
      const placeOfBirth = fullUser?.placeOfBirth;

      // Build message only with available fields
      let introMessage = `Hi, I am ${name}.`;

      if (gender) {
        introMessage += ` My gender is ${gender}.`;
      }
      if (dateOfBirth) {
        const formattedDOB = moment(dateOfBirth).format("DD MMM YYYY");
        introMessage += ` My date of birth is ${formattedDOB}.`;
      }
      if (timeOfBirth) {
        introMessage += ` My time of birth is ${timeOfBirth}.`;
      }
      if (placeOfBirth) {
        introMessage += ` My place of birth is ${placeOfBirth}.`;
      }

      // Create system message (astrologer joined)
      const systemMessage = {
        senderType: "system",
        messageType: "text",
        message: "Astrologer has joined the chat.",
      };

      // Create user introduction message
      const userIntroMessage = {
        senderType: "user",
        senderId: userId.toString(),
        messageType: "text",
        message: introMessage,
      };

      let chat = await Chat.findOne({ chatRoomId });

      if (chat) {
        chat.messages.push(systemMessage, userIntroMessage);
      } else {
        chat = new Chat({
          chatRoomId,
          participants: {
            user: userId,
            astrologer: astrologerId,
          },
          messages: [systemMessage, userIntroMessage],
        });
      }

      await chat.save();
      // Start a timeout for 1 minute (60,000 ms)
      setTimeout(async () => {
        const updatedChatRoom = await ChatRoom.findById(chatRoomId);
        if (updatedChatRoom && updatedChatRoom.status === "confirmed") {
          // Automatically reject the chat request
          updatedChatRoom.status = "rejected";
          updatedChatRoom.rejectedBy = "system";
          await updatedChatRoom.save();

          // Notify both user and astrologer
          if (userSocketId) {
            io.to(userSocketId).emit("chat_request_cancelled", {
              message:
                "You did not respond to the chat request in time. The request has been cancelled.",
            });
          }

          if (astrologerSocketId) {
            io.to(astrologerSocketId).emit("chat_request_cancelled", {
              message:
                "The user did did not respond to the chat request in time. The request has been cancelled.",
            });
          }
        }
      }, 60000); // 1 minute
    } else if (response === "reject") {
      // Update chat room status to "rejected" and set rejectedBy
      chatRoom.status = "rejected";
      chatRoom.rejectedBy = "astrologer";
      await chatRoom.save();

      // Remove from waitlist
      await Waitlist.findOneAndDelete({
        user: userId,
        astrologer: astrologerId,
      });

      if (userSocketId) {
        const title = "Chat Request Rejected";
        const message =
          "Your chat request has been rejected by the astrologer. Please try again later.";
        const userPlayerId = user?.playerId;
        await sendPushNotification(
          userId,
          title,
          message,
          userPlayerId // Ensure the playerId is passed for reliable delivery
        );
        io.to(userSocketId).emit("chat_request_cancelled", {
          message: "The astrologer has rejected your chat request.",
        });
      }

      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_request_cancelled", {
          message: "You have rejected the chat request.",
        });
      }
    } else if (response === "timeout") {
      // Handle timeout rejection
      chatRoom.status = "rejected";
      chatRoom.rejectedBy = "system";
      await chatRoom.save();

      // Notify user
      if (userSocketId) {
        io.to(userSocketId).emit("chat_request_cancelled", {
          message:
            "The chat request has been automatically rejected due to inactivity.",
        });
      }

      // Notify astrologer
      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_request_cancelled", {
          message:
            "The chat request has been automatically rejected due to inactivity.",
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

      const systemMessage = {
        senderType: "system",
        messageType: "text",
        message: "User has joined the chat.",
      };

      // Create user introduction message

      let chat = await Chat.findOne({ chatRoomId });

      if (chat) {
        chat.messages.push(systemMessage);
      } else {
        chat = new Chat({
          chatRoomId,
          participants: {
            user: userId,
            astrologer: astrologerId,
          },
          messages: [systemMessage],
        });
      }

      await chat.save();

      // Notify both sides
      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("chat_started", {
          chatRoomId,
          message: "User accepted the request. Chat is starting...",
        });
      }

      // Start the chat session
      await startChat(io, chatRoomId, chatRoom.chatType, userId, astrologerId);
    } else {
      // Update chat room status to "rejected" and set rejectedBy
      if (chatRoom) {
        chatRoom.status = "rejected";
        chatRoom.rejectedBy = "user";
        await chatRoom.save();
      }

      // Remove user from waitlist
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
  const {
    chatRoomId,
    senderType,
    senderId,
    recipientId, // <-- new
    messageType,
    message,
  } = data;

  // Validate inputs
  if (
    !chatRoomId ||
    !["user", "astrologer", "system"].includes(senderType) ||
    !senderId ||
    !message
  ) {
    console.error("Invalid parameters in handleChatMessage");
    return { error: "Invalid parameters provided" };
  }

  console.log({ messageType, message });

  // Bypass sensitive info check for Cloudinary URLs
  if (message.includes("https://res.cloudinary.com")) {
    console.log(
      "Message contains Cloudinary URL, skipping sensitive info check"
    );
    return processMessage(data, io); // Proceed to handle the message without blocking
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

  // If message doesn't contain sensitive info, continue processing it
  return processMessage(data, io);
};

const processMessage = async (data, io) => {
  const {
    chatRoomId,
    senderType,
    senderId,
    recipientId,
    messageType,
    message,
  } = data;

  try {
    // Find or create chat
    let chat = await Chat.findOne({ chatRoomId });

    if (!chat) {
      if (!recipientId) {
        return { error: "Missing recipientId when creating chat" };
      }

      chat = new Chat({
        chatRoomId,
        participants: {
          [senderType]: senderId,
          [senderType === "user" ? "astrologer" : "user"]: recipientId,
        },
        messages: [],
      });
    }

    // Compose new message
    const newMessage = {
      senderType,
      senderId: senderType === "system" ? undefined : senderId,
      recipientId,
      messageType: messageType || "text",
      message,
      timestamp: moment().tz("Asia/Kolkata").toDate(),
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Determine recipient type and ID
    const recipientType = senderType === "user" ? "astrologer" : "user";
    let resolvedRecipientId = chat.participants?.[recipientType] || recipientId;

    if (!resolvedRecipientId) {
      console.error("Recipient not found in chat participants");
      return { error: "Recipient not found" };
    }

    // Get recipient socket
    let recipient;
    // Ensure recipient is fetched correctly based on the type

    if (recipientType === "user") {
      // Find user by ID
      recipient = await User.findById(resolvedRecipientId);

      // Check if the user is not on the app
      if (recipient && recipient.isOnApp === false) {
        const title = "Message Received";
        const message = "You have received a new message.";

        // Ensure the recipient has a playerId for push notification
        if (recipient.playerId) {
          await sendPushNotification(
            recipient._id,
            title,
            message,
            recipient.playerId // Send push notification if playerId exists
          );
        } else {
          console.log("User does not have a playerId for push notification.");
        }
      }
    } else if (recipientType === "astrologer") {
      // If recipientType is "astrologer", find the astrologer by ID
      recipient = await Astrologer.findById(resolvedRecipientId);
    } else {
      console.log("Invalid recipient type.");
    }

    if (recipient?.socketId) {
      console.log("sending message to recipient socketId:", recipient.socketId);
      io.to(recipient.socketId).emit("received-message", {
        ...newMessage,
        chatRoomId,
      });
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

  sender
) {
  try {
    // Validate inputs
    if (!roomId || !userId || !astrologerId || !sender) {
      console.error("Missing required parameters in handleEndChat");
      io.to(roomId).emit("chat-error", {
        message: "Invalid parameters provided.",
      });
      return;
    }

    // Perform earnings, wallet deductions, logs etc.
    await endChat(io, roomId, userId, astrologerId);

    // Fetch the chat and chatRoom
    const chat = await Chat.findOne({ chatRoomId: roomId });
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chat || !chatRoom) {
      console.error("Chat or ChatRoom not found");
      return;
    }

    // Set endTime
    const endTime = moment().tz("Asia/Kolkata").toDate();
    chat.endTime = endTime;

    // Compute duration from startTime to now (or fallback to messages)
    let startTime = chat.startTime;
    if (!startTime && chat.messages.length > 0) {
      startTime = chat.messages[0].timestamp;
    }

    if (startTime) {
      const durationMins = Math.round(
        (endTime - new Date(startTime)) / (1000 * 60)
      );
      chat.duration = `${durationMins} minutes`;
    }

    // Set astrologer status
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      console.error("Astrologer not found:", astrologerId);
      return;
    }

    astrologer.status = "available";
    await astrologer.save();

    // Update ChatRoom status
    chatRoom.status = "ended";
    chatRoom.isUserJoined = false;
    chatRoom.isAstrologerJoined = false;
    chatRoom.endedBy = sender;
    await chatRoom.save();

    const systemMessage = {
      senderType: "system",
      messageType: "text",
      message: `${sender === "user" ? "The user" : "The astrologer"} has exited the chat.`,
    };

    if (chat) {
      chat.messages.push(systemMessage, userIntroMessage);
    } else {
      const chatRoomId = chatRoom._id || roomId; // Use chatRoom._id if available
      chat = new Chat({
        chatRoomId,
        participants: {
          user: userId,
          astrologer: astrologerId,
        },
        messages: [systemMessage],
      });
    }

    await chat.save();

    // Get socket IDs
    const user = await User.findById(userId);
    const payload = {
      message: "Chat session ended .",
      endedBy: sender,
      duration: chat.duration || "Unknown",
    };

    if (user?.socketId) io.to(user.socketId).emit("chat-ended", payload);
    if (astrologer?.socketId)
      io.to(astrologer.socketId).emit("chat-ended", payload);

    console.log(`Chat ended. Astrologer ${astrologer._id} is now available.`);
  } catch (error) {
    console.error("Error handling end of chat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred while ending chat.",
    });
  }
}

export const checkChatRoomStatus = async (io) => {
  // 1. Find all chat rooms with pending, active, or confirmed status
  const chatRooms = await ChatRoom.find({
    status: { $in: ["pending", "active", "confirmed"] },
  })
    .populate("user", "name socketId") // Get user name & socketId
    .populate("astrologer", "name avatar pricePerChatMinute"); // Get astrologer details

  const activeUserIds = new Set();

  for (const chatRoom of chatRooms) {
    const user = chatRoom.user;
    console.log({ user });
    const astrologer = chatRoom.astrologer;

    // console.log({ chatRoom });

    if (!user?.socketId) continue; // Skip if socketId is not available

    activeUserIds.add(user._id.toString()); // Save active user IDs
    console.log({ activeUserIds });
    // Format createdAt
    const { formattedDate, formattedTime } = formatISTDateTime(
      chatRoom.createdAt
    );

    // Safely format updatedAt with default values if it's missing
    let formattedDate_updatedAt = "N/A";
    let formattedTime_updatedAt = "N/A";

    if (chatRoom.updatedAt) {
      const updatedAt = formatISTDateTime(chatRoom.updatedAt);
      formattedDate_updatedAt = updatedAt.formattedDate;
      formattedTime_updatedAt = updatedAt.formattedTime;
    }

    const response = {
      chatRoomId: chatRoom._id,
      chatType: chatRoom.chatType,
      createdAt: { date: formattedDate, time: formattedTime },
      updatedAt: {
        date: formattedDate_updatedAt,
        time: formattedTime_updatedAt,
      },
      status: chatRoom.status,
      user: {
        _id: user._id,
        name: user.name,
      },
      astrologer: {
        _id: astrologer._id,
        name: astrologer.name,
        avatar: astrologer.avatar,
        consultation_rate: astrologer.pricePerChatMinute,
      },
    };
    if (user.socketId) {
      console.log({ user });
      io.to(user.socketId).emit("chatRoomStatusUpdate", response);
    }
    // console.log({ response });
    // Emit chatRoomStatusUpdate event to users involved in chatRooms
  }

  // 2. Find users who are NOT part of any active/pending chat rooms
  const usersWithoutChatRooms = await User.find({
    _id: { $nin: Array.from(activeUserIds) },
    socketId: { $exists: true, $ne: null },
  }).select("socketId");

  for (const user of usersWithoutChatRooms) {
    console.log("User not in any chat room:", user._id);
    if (user.socketId) {
      // console.log(`Sending noChatResponse to socket: ${user.socketId}`);
      io.to(user.socketId).emit("noChatResponse", { response: false });
    }
  }
};

export const getChatHistoryFromDatabase = async (
  chatRoomId,
  senderType,
  astrologerId,
  userId,
  io
) => {
  try {
    // Fetch chat history sorted by createdAt
    const chatHistory = await Chat.find({ chatRoomId }).sort({ createdAt: -1 });

    // If chatHistory is empty, return early
    if (!chatHistory || chatHistory.length === 0) {
      throw new Error("No chat history found");
    }

    // Extract messages from the first chat history object
    let messagesArr = chatHistory[0].messages;
    let duration = chatHistory[0].duration;

    // Fetch socketIds for astrologer and user
    const astrologer = await Astrologer.findById(astrologerId);
    const user = await User.findById(userId);

    if (!astrologer || !user) {
      throw new Error("Astrologer or User not found");
    }

    const astrologerSocketId = astrologer.socketId;
    const userSocketId = user.socketId;

    // Add recipientId to each message if sender is astrologer
    if (senderType === "astrologer") {
      messagesArr = messagesArr.map((msg) => ({
        ...(msg.toObject?.() ?? msg), // handle Mongoose documents
        recipientId: userId,
      }));

      console.log({ messagesArr, chatHistory, astrologerSocketId });

      io.to(astrologerSocketId).emit("chat_history", {
        messagesArr,
        chatRoomId,
        duration,
      });
    } else {
      io.to(userSocketId).emit("chat_history", {
        messagesArr,
        chatRoomId,
        duration,
      });
    }
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw new Error("Could not fetch chat history");
  }
};
