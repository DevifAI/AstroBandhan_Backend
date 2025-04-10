import { Server } from "socket.io";
import {
  handleChatRequest,
  handleUserResponse,
  checkWaitlist,
  handleChatMessage,
  handleEndChat,
  handleAstrologerResponse,
} from "../../controller/chatController/controller.js";

// Socket maps to track active connections
const astrologerSocketMap = new Map();
const userSocketMap = new Map();

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.0.100:8081",
        "https://localhost:6000",
      ],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register user
    socket.on("register_user", ({ userId }) => {
      userSocketMap.set(userId, socket.id);
      console.log(`User registered: ${userId} -> ${socket.id}`);
    });

    // Register astrologer
    socket.on("register_astrologer", ({ astrologerId }) => {
      astrologerSocketMap.set(astrologerId, socket.id);
      console.log(`Astrologer registered: ${astrologerId} -> ${socket.id}`);
    });

    // Handle user requesting a chat with an astrologer
    socket.on("request_chat", async ({ userId, astrologerId, chatType }) => {
      try {
        console.log("Chat request:", userId, astrologerId, chatType);
        await handleChatRequest(
          io,
          userId,
          astrologerId,
          chatType,
          astrologerSocketMap
        );
      } catch (error) {
        console.error("Error processing chat request:", error);
      }
    });

    // Handle astrologer response (confirm/reject)
    socket.on(
      "astrologer_response",
      async ({ chatRoomId, userId, astrologerId, response }) => {
        try {
          await handleAstrologerResponse(
            io,
            chatRoomId,
            userId,
            astrologerId,
            response,
            userSocketMap,
            astrologerSocketMap
          );
        } catch (error) {
          console.error("Error handling astrologer response:", error);
        }
      }
    );

    // Handle user response (accept/reject/cancel)
    socket.on(
      "user_response",
      async ({ chatRoomId, userId, response, astrologerId }) => {
        try {
          await handleUserResponse(
            io,
            chatRoomId,
            userId,
            response,
            astrologerId,
            astrologerSocketMap // pass this map so it works
          );
        } catch (error) {
          console.error("Error handling user response:", error);
        }
      }
    );

    // Handle chat message sending
    socket.on("send_message", async (data) => {
      try {
        const result = await handleChatMessage(data, io);
        if (result.error) {
          socket.emit("error", { message: result.error });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Message sending failed" });
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

    // Handle ending a chat session
    socket.on(
      "end_chat",
      async ({ roomId, userId, astrologerId, chatType, sender }) => {
        try {
          await handleEndChat(
            io,
            roomId,
            userId,
            astrologerId,
            chatType,
            sender,
            socket
          );
        } catch (error) {
          console.error("Error ending chat:", error);
          socket.emit("chat-error", {
            message: "An error occurred while ending the chat.",
          });
        }
      }
    );

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, id] of userSocketMap.entries()) {
        if (id === socket.id) userSocketMap.delete(userId);
      }
      for (const [astrologerId, id] of astrologerSocketMap.entries()) {
        if (id === socket.id) astrologerSocketMap.delete(astrologerId);
      }
    });
  });

  return io;
};

// Export socket maps if needed in controller
export { astrologerSocketMap, userSocketMap };
