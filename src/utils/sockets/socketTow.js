import { Server } from "socket.io";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import {
  handleChatRequest,
  handleUserResponse,
  checkWaitlist,
  handleChatMessage,
  handleEndChat,
  handleAstrologerResponse,
} from "../../controller/chatController/controller.js";
import sendPushNotification from "../One_Signal/onesignal.js";
import {
  sendWelcomeNotification,
  storePlayerIdForUser,
  updateUserActivityStatus,
} from "../../controller/user/oneSignal/OneSignalController.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins
      methods: ["GET", "POST", "PATCH", "DELETE"], // Allowed HTTP methods
      allowedHeaders: ["Content-Type"], // Allowed headers
      credentials: false, // Disable credentials if allowing all origins
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    //Save PlayerId and Send Welcome Notification To User
    socket.on("register_player_id", async (data) => {
      const { userId, playerId, userType } = data;
      console.log(`Registering player ID ${playerId} for user ${userId}`);

      try {
        storePlayerIdForUser(userId, playerId, userType); // Store the player ID in the database
        if (userType === "user") {
          await sendWelcomeNotification(userId, playerId, userType); // Send welcome notification
        } else if (userType === "astrologer") {
          await sendWelcomeNotification(userId, playerId, userType);
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });

    // Register user
    socket.on("register_user", async ({ userId }) => {
      if (!userId) {
        console.error("Invalid userId provided for register_user");
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
          console.error(`User not found: ${userId}`);
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Update the user's socketId
        user.socketId = socket.id;
        await user.save();

        console.log(`User registered: ${userId} -> ${socket.id}`);
        socket.emit("success", { message: "User registered successfully" });
      } catch (error) {
        console.error("Error registering user socketId:", error);
        socket.emit("error", { message: "Failed to register user" });
      }
    });

    // Listen for 'ping' from the client
    socket.on("ping", () => {
      console.log("Ping received from client:", socket.id);
      socket.emit("pong"); // Respond with 'pong'
    });

    // Register astrologer
    socket.on("register_astrologer", async ({ astrologerId }) => {
      if (!astrologerId) {
        console.error("Invalid astrologerId provided for register_astrologer");
        socket.emit("error", { message: "Invalid astrologerId" });
        return;
      }

      try {
        console.log({ astrologerId });
        // Check if the astrologer exists
        const astrologer = await Astrologer.findById(astrologerId);
        console.log({ astrologer });
        if (!astrologer) {
          console.error(`Astrologer not found: ${astrologerId}`);
          socket.emit("error", { message: "Astrologer not found" });
          return;
        }

        // Update the astrologer's socketId
        astrologer.socketId = socket.id;
        await astrologer.save();

        console.log(`Astrologer registered: ${astrologerId} -> ${socket.id}`);
        socket.emit("success", {
          message: "Astrologer registered successfully",
        });
      } catch (error) {
        console.error("Error registering astrologer socketId:", error);
        socket.emit("error", { message: "Failed to register astrologer" });
      }
    });

    // Handle user requesting a chat with an astrologer
    socket.on("request_chat", async ({ userId, astrologerId, chatType }) => {
      if (!userId || !astrologerId || !chatType) {
        console.error("Invalid data for request_chat");
        socket.emit("error", { message: "Invalid data for chat request" });
        return;
      }
      try {
        console.log("Chat request:", userId, astrologerId, chatType);
        await handleChatRequest(io, userId, astrologerId, chatType);
      } catch (error) {
        console.error("Error processing chat request:", error);
        socket.emit("error", { message: "Failed to process chat request" });
      }
    });

    // Handle astrologer response
    socket.on(
      "astrologer_response",
      async ({ chatRoomId, userId, astrologerId, response }) => {
        if (!chatRoomId || !userId || !astrologerId || !response) {
          console.error("Invalid data for astrologer_response");
          socket.emit("error", {
            message: "Invalid data for astrologer response",
          });
          return;
        }
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
          socket.emit("error", {
            message: "Failed to process astrologer response",
          });
        }
      }
    );

    // Handle user response
    socket.on(
      "user_response",
      async ({ chatRoomId, userId, response, astrologerId }) => {
        if (!chatRoomId || !userId || !response || !astrologerId) {
          console.error("Invalid data for user_response");
          socket.emit("error", { message: "Invalid data for user response" });
          return;
        }
        try {
          console.log(
            "User response:",
            chatRoomId,
            userId,
            response,
            astrologerId
          );
          await handleUserResponse(
            io,
            chatRoomId,
            userId,
            response,
            astrologerId
          );
        } catch (error) {
          console.error("Error handling user response:", error);
          socket.emit("error", { message: "Failed to process user response" });
        }
      }
    );

    // Handle user status update
    socket.on("update_status", async (data) => {
      if (!data || !data.userId || typeof data.isActive === "undefined") {
        console.error("Invalid data for update_status");
        socket.emit("error", { message: "Invalid data for updating status" });
        return;
      }
      try {
        const result = await updateUserActivityStatus(
          data.userId,
          data.isActive
        ); // Call the DB update function
        if (!result) {
          socket.emit("error", {
            message: "Failed to update user activity status",
          });
        } else {
          console.log(
            `User status updated successfully: ${data.userId} is now ${data.isActive ? "active" : "inactive"}`
          );
          // socket.emit("status_updated", {
          //   message: "Status updated successfully",
          //   userId: data.userId,
          // });
        }
      } catch (error) {
        console.error("Error updating user status:", error);
        socket.emit("error", { message: "Failed to update user status" });
      }
    });

    // Handle chat message
    socket.on("send_message", async (data) => {
      if (!data || !data.chatRoomId || !data.message) {
        console.error("Invalid data for send_message");
        socket.emit("error", { message: "Invalid data for sending message" });
        return;
      }
      try {
        const result = await handleChatMessage(data, io);
        if (result.error) {
          socket.emit("error", { message: result.error });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle astrologer availability
    socket.on("astrologer_available", async ({ astrologerId }) => {
      try {
        await checkWaitlist(io, astrologerId);
      } catch (error) {
        console.error("Error checking waitlist:", error);
      }
    });

    // Handle ending chat
    socket.on(
      "end_chat",
      async ({ roomId, userId, astrologerId, chatType, sender }) => {
        console.log(
          "End chat request:",
          roomId,
          userId,
          astrologerId,
          chatType,
          sender
        );
        if (!roomId || !userId || !astrologerId || !chatType || !sender) {
          console.error("Invalid data for end_chat");
          socket.emit("chat-error", {
            message: "Invalid data for ending chat",
          });
          return;
        }
        try {
          await handleEndChat(
            io,
            roomId,
            userId,
            astrologerId,
            chatType,
            sender
          );
        } catch (error) {
          console.error("Error ending chat:", error);
          socket.emit("chat-error", { message: "Failed to end chat session" });
        }
      }
    );

    // Cleanup on disconnect
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      try {
        await User.updateOne({ socketId: socket.id }, { socketId: null });
        await Astrologer.updateOne({ socketId: socket.id }, { socketId: null });
      } catch (error) {
        console.error("Error clearing socketId on disconnect:", error);
      }
    });
  });

  return io;
};
