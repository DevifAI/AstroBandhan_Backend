import { Server } from "socket.io";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import mongoose from "mongoose";

import {
  handleChatRequest,
  handleUserResponse,
  checkWaitlist,
  handleChatMessage,
  handleEndChat,
  handleAstrologerResponse,
  checkChatRoomStatus,
  getChatHistoryFromDatabase,
  handleCallRequest,
} from "../../controller/chatController/controller.js";
import sendPushNotification from "../One_Signal/onesignal.js";
import {
  sendWelcomeNotification,
  storePlayerIdForUser,
  updateUserActivityStatus,
} from "../../controller/user/oneSignal/OneSignalController.js";
import {
  endCallAndLogTransaction,
  startCall,
} from "../../controller/user/callController.js";
import { generateAgoraToken } from "../call/generateToken.js";
import Call from "../../models/call.model.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Replace with your frontend's URL
      methods: ["GET", "POST", "PATCH", "DELETE"], // Allowed HTTP methods
      allowedHeaders: ["Content-Type"], // Allowed headers
      credentials: true, // Enable credentials
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
        // console.log({ astrologer });
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
        console.log({ userId, astrologerId, chatType });
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
          console.log({ chatRoomId, userId, astrologerId, response });
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

    //fetch chat history for active chats
    // Node.js with Socket.io
    socket.on("getChatHistory", async (data) => {
      const { chatRoomId, userId, astrologerId, senderType } = data;
      console.log({ chatRoomId, userId, astrologerId, senderType });
      try {
        // Query your database for chat history based on chatRoomId
        await getChatHistoryFromDatabase(
          chatRoomId,
          senderType,
          astrologerId,
          userId,
          io
        );
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }

      // Emit the chat history back to the client
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
    socket.on("end_chat", async ({ roomId, userId, astrologerId, sender }) => {
      console.log("End chat request:", roomId, userId, astrologerId, sender);
      if (!roomId || !userId || !astrologerId || !sender) {
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

          sender
        );
      } catch (error) {
        console.error("Error ending chat:", error);
        socket.emit("chat-error", { message: "Failed to end chat session" });
      }
    });

    //handle user initialize call
    socket.on("call_initialize", async ({ payload, token }) => {
      try {
        // Validate input
        if (!payload?.userId || !payload?.astrologerId || !token) {
          throw new Error("Missing required fields");
        }

        // Fetch participants
        const [user, astrologer] = await Promise.all([
          User.findById(payload.userId),
          Astrologer.findById(payload.astrologerId),
        ]);

        if (!user || !astrologer) {
          throw new Error("User or astrologer not found");
        }

        // Verify astrologer is available
        if (astrologer.status !== "available") {
          throw new Error(`Astrologer is ${astrologer.status}`);
        }

        // Generate unique channel name if not provided
        const channelName =
          payload.channelName || `${user._id}_${astrologer._id}_${Date.now()}`;
        const astrologerUid = Math.floor(Math.random() * 100000) + 100000; // Ensure different UID
        const astrologerToken = generateAgoraToken(channelName, astrologerUid);
        // Prepare call data
        const callData = {
          channelName,
          astrologerToken,
          astrologerUid,
          token,
          name: user.name,
          userId: user._id,
          avatar: user.photo,
          publisherUid: payload.uid || Math.floor(Math.random() * 100000),
          astrologerId: astrologer._id,
          callType: "audio",
          timestamp: new Date(),
        };
        console.log({ channelName });
        // Mark astrologer as busy
        astrologer.status = "busy";
        await astrologer.save();

        // Emit to astrologer
        if (astrologer.socketId) {
          io.to(astrologer.socketId).emit("incoming_call", callData);
          console.log(`Call initiated to astrologer ${astrologer._id}`);
        } else {
          throw new Error("Astrologer not connected");
        }

        // Set timeout for no response
        const timeoutId = setTimeout(async () => {
          try {
            const freshAstro = await Astrologer.findById(astrologer._id);
            if (freshAstro && freshAstro.status === "busy") {
              freshAstro.status = "available";
              await freshAstro.save();

              if (astrologer.socketId) {
                io.to(astrologer.socketId).emit("call_timeout");
              }
            }
          } catch (err) {
            console.error("Error in call timeout handler:", err);
          }
        }, 30000);

        // Store timeout ID so we can clear it if call is accepted
        socket.timeoutIds = socket.timeoutIds || {};
        socket.timeoutIds[astrologer._id] = timeoutId;
      } catch (error) {
        console.error("Call initialization failed:", error);
        socket.emit("call_error", {
          message: error.message,
          code: "INIT_FAILED",
        });
      }
    });

    // Handle call rejection from either user or astrologer
    socket.on("call_rejected", async ({ astrologerId, userId, rejectedBy }) => {
      console.log({ astrologerId, userId, rejectedBy });
      console.log("SAdsadsadsadsadsa");
      try {
        // Validate input
        if (!astrologerId || !rejectedBy) {
          throw new Error("Missing required fields");
        }

        // Fetch astrologer
        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
          throw new Error("Astrologer not found");
        }

        // Only update status if astrologer is busy
        if (astrologer.status === "busy") {
          astrologer.status = "available";
          await astrologer.save();
        }

        // Clear the timeout if it exists
        if (socket.timeoutIds && socket.timeoutIds[astrologerId]) {
          clearTimeout(socket.timeoutIds[astrologerId]);
          delete socket.timeoutIds[astrologerId];
        }

        // Notify the other party about the rejection
        if (rejectedBy === "user" && astrologer.socketId) {
          io.to(astrologer.socketId).emit("call_rejected_by_user", {
            astrologerId,
            userId,
          });
        } else if (rejectedBy === "astrologer" && userId) {
          const user = await User.findById(userId);
          if (user?.socketId) {
            io.to(user.socketId).emit("call_rejected_by_astrologer", {
              astrologerId,
              userId,
            });
          }
        }

        console.log(`Call rejected by ${rejectedBy}`, { astrologerId, userId });
      } catch (error) {
        console.error("Error handling call rejection:", error);
      }
    });

    socket.on("call_response_accept", async (data) => {
      try {
        // Validate input
        const requiredFields = [
          "channelName",
          "userId",
          "astrologerId",
          "token",
        ];
        const missing = requiredFields.filter((field) => !data[field]);
        if (missing.length > 0) {
          throw new Error(`Missing fields: ${missing.join(", ")}`);
        }

        console.log(data);

        // Start call without session
        const callResult = await startCall({ ...data });

        if (!callResult.success) {
          throw new Error(callResult.message);
        }

        // Update astrologer's status to "busy"
        await Astrologer.findByIdAndUpdate(data.astrologerId, {
          status: "busy",
        });

        // Emit call ready events
        io.to(data.userId).emit("call_accepted", {
          channelName: data.channelName,
          token: data.token,
          uid: data.publisherUid,
        });

        io.to(data.astrologerId).emit("call_ready", {
          channelName: data.channelName,
          token: data.token,
          uid: callResult.recordingUID,
        });
      } catch (error) {
        console.error("Call acceptance failed:", error);
        socket.emit("call_error", {
          message: error.message,
          code: "ACCEPT_FAILED",
        });

        // Optional: Emit rejection only if data.userId exists
        if (data?.userId) {
          io.to(data.userId).emit("call_rejected");
        }
      }
    });

    //terminate ongoing cvall call
    socket.on("endaudiocall", async (data) => {
      const { astrologerId, userId } = data;
      console.log("ttttttt", astrologerId, userId);

      try {
        if (
          !mongoose.Types.ObjectId.isValid(astrologerId) ||
          !mongoose.Types.ObjectId.isValid(userId)
        ) {
          console.log("222222", astrologerId, userId);
          console.error("Invalid ObjectId(s) provided");
          return;
        }

        console.log({ astrologerId, userId });

        const call = await Call.findOne({
          astrologerId: new mongoose.Types.ObjectId(astrologerId),
          userId: new mongoose.Types.ObjectId(userId),
        });

        if (!call) {
          console.log("Call not found");
          return;
        }

        const callId = call._id;
        console.log("Call ended with ID:", callId);

        const res = await endCallAndLogTransaction(callId);

        if (res) {
          // Update astrologer status
          await Astrologer.findByIdAndUpdate(astrologerId, {
            status: "available",
          });
          console.log("Astrologer status updated to available");

          // Find user and emit event
          const user = await User.findById(userId);
          if (user && user.socketId) {
            console.log("cal ended by astrologer");
            io.to(user.socketId).emit("callEnded", {
              astrologerId,
              userId,
            });
            console.log("callEnded event emitted to user:", user.socketId);
          } else {
            console.log("User not found or no socketId available");
          }
        }
      } catch (error) {
        console.error("Error ending call:", error);
      }
    });

    // System call end function
    async function endCallSystem(callId, reason) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const call = await Call.findById(callId).session(session);
        if (!call || call.status === "ended") return;

        // Stop billing
        await agenda.cancel(`charge_call_${callId}`);

        // Stop recording
        await stopAgoraRecording(call.recording.sid, call.recording.resourceId);

        // Update call record
        call.endedAt = new Date();
        call.status = "ended";
        call.endReason = reason;
        await call.save({ session });

        // Mark astrologer available
        await Astrologer.findByIdAndUpdate(
          call.astrologerId,
          { $set: { onCall: false } },
          { session }
        );

        // Notify both parties
        io.to(call.userId).emit("call_ended", { callId, reason });
        io.to(call.astrologerId).emit("call_ended", { callId, reason });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        console.error("Call end failed:", error);
      } finally {
        session.endSession();
      }
    }

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

  setInterval(() => {
    // console.log("hello");
    checkChatRoomStatus(io);
  }, 5000);

  return io;
};
