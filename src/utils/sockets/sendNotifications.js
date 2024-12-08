// // controllers/notificationController.js
// import { Notification } from "../../models/notificationSchema.js";  // Import your Notification schema
// import { users, io } from "../sockets/socket.js"; // Import the users map and socket.io instance

// // Function to send notification to a specific user
// export const sendNotificationToUser = async (userId, message) => {
//   const socketId = users[userId];  // Retrieve socket ID based on userId
//   if (socketId) {
//     try {
//       // Save the notification to the database
//       const notification = new Notification({ userId, message });
//       await notification.save();

//       // Emit the notification in real-time to the user
//       io.to(socketId).emit("notification", notification);  // Send the notification to the user
//       console.log(`Notification sent to user ${userId}`);
//     } catch (error) {
//       console.error("Error sending notification:", error);
//     }
//   } else {
//     console.log(`User ${userId} is not connected`);  // Handle case when the user is not connected
//   }
// };
