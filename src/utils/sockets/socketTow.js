import { Server } from "socket.io";
import {
  handleChatRequest,
  handleUserResponse,
  checkWaitlist,
  handleAstrologerResponse,
  handleChatMessage,
  handleEndChat,
} from "../../controller/chatController/controller.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://192.168.0.100:8081", "https://localhost:6000"],
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
            response
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
            astrologerId
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

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
