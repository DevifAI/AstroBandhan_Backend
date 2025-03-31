import { Server } from "socket.io";
import Chat from "./models/chat.model.js";
import {
  handleChatRequest,
  handleAstrologerConfirm,
  handleUserResponse,
  handleChatCancellation,
  checkWaitlist,
} from "../../controller/chatController/controller.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://192.168.0.100:8081"],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user requesting a chat with an astrologer
    socket.on("request_chat", async ({ userId, astrologerId, chatType }) => {
      try {
        await handleChatRequest(io, userId, astrologerId, chatType);
      } catch (error) {
        console.error("Error processing chat request:", error);
      }
    });

    // Handle astrologer confirming a chat request
    socket.on("confirm_chat", async ({ chatRoomId, astrologerId }) => {
      try {
        await handleAstrologerConfirm(io, chatRoomId, astrologerId);
      } catch (error) {
        console.error("Error confirming chat:", error);
      }
    });

    // Handle astrologer rejecting a chat request
    socket.on("reject_chat", async ({ chatRoomId, astrologerId }) => {
      try {
        io.to(chatRoomId).emit("chat_rejected", {
          message: "Astrologer has refused the chat request.",
        });
      } catch (error) {
        console.error("Error rejecting chat:", error);
      }
    });

    // Handle user response (accept/reject) to astrologer confirmation
    socket.on("user_response", async ({ chatRoomId, userId, accepted }) => {
      try {
        await handleUserResponse(io, chatRoomId, userId, accepted);
      } catch (error) {
        console.error("Error handling user response:", error);
      }
    });

    // Handle chat message sending
    socket.on("send_message", async ({ chatRoomId, senderId, message }) => {
      try {
        const chat = await Chat.findOne({ chatRoomId });
        if (!chat) return;

        chat.messages.push({ senderId, message, senderType: "user" });
        await chat.save();

        io.to(chatRoomId).emit("new_message", { senderId, message });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Handle chat cancellation
    socket.on("cancel_chat", async ({ userId, astrologerId }) => {
      try {
        await handleChatCancellation(io, userId, astrologerId);
      } catch (error) {
        console.error("Error canceling chat:", error);
      }
    });

    // Handle astrologer becoming available and checking waitlist
    socket.on("astrologer_available", async ({ astrologerId }) => {
      try {
        await checkWaitlist(io, astrologerId);
      } catch (error) {
        console.error("Error checking waitlist:", error);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
