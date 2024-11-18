// controllers/notificationController.js
import Notification from "../../models/notificationSchema"; // Import the Notification model
import { users, io } from "../socket.js"; // Import the users object and io from socket.js

// Function to send notification to a specific user
export const sendNotificationToUser = async (userId, message) => {
  const socketId = users[userId];
  if (socketId) {
    try {
      // Save the notification to the database
      const notification = new Notification({ userId, message });
      await notification.save();

      // Emit the notification in real-time to the user
      io.to(socketId).emit("notification", notification);
      console.log(`Notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  } else {
    console.log(`User ${userId} is not connected`);
  }
};
