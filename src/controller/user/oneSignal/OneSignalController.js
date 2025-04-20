import { Astrologer } from "../../../models/astrologer.model.js";
import { User } from "../../../models/user.model.js";
import sendPushNotification from "../../../utils/One_Signal/onesignal.js";

//FOR USER

export const storePlayerIdForUser = async (userId, playerId) => {
  try {
    // Placeholder logic - replace with actual database logic
    console.log(
      `📝 [Database] Storing player ID ${playerId} for user ${userId}`
    );

    // Example MongoDB implementation
    await User.updateOne(
      { _id: userId }, // Match user by ID
      { $set: { playerId } } // Update the playerId field
    );

    return true; // Indicate successful update
  } catch (error) {
    console.error("Error storing player ID:", error);
    return false; // Indicate failure
  }
};
export const updateUserActivityStatus = async (userId, isActive) => {
  try {
    // Placeholder logic - replace with actual database logic
    console.log(
      `📝 [Database] Updating activity status to ${isActive} for user ${userId}`
    );

    // Example MongoDB implementation
    await User.findByIdAndUpdate(
      userId, // Match user by ID
      { $set: { isOnApp: isActive } } // Update the isActive field
    );

    return true; // Indicate successful update
  } catch (error) {
    console.error("Error updating activity status:", error);
    return false; // Indicate failure
  }
};

export const getPlayerIdForUser = async (userId) => {
  try {
    // Log the database query for debugging purposes
    console.log(`🔍 [Database] Looking up player ID for user ${userId}`);

    // Example MongoDB implementation
    const user = await User.findOne({ _id: userId }); // Find user by ID
    return user?.playerId || null; // Return the playerId or null if not found
  } catch (error) {
    // Log the error for troubleshooting
    console.error("Error getting player ID:", error);
    return null; // Return null on error
  }
};

//FOR ASTROLOGER
export const storePlayerIdForAstrologer = async (userId, playerId) => {
  try {
    // Placeholder logic - replace with actual database logic
    console.log(
      `📝 [Database] Storing player ID ${playerId} for user ${userId}`
    );

    // Example MongoDB implementation
    await Astrologer.updateOne(
      { _id: userId }, // Match user by ID
      { $set: { playerId } } // Update the playerId field
    );

    return true; // Indicate successful update
  } catch (error) {
    console.error("Error storing player ID:", error);
    return false; // Indicate failure
  }
};

//For Both
export const sendWelcomeNotification = async (userId, playerId, userType) => {
  try {
    let user;
    if (userType === "user") {
      user = await User.findOne({ _id: userId });
    } else {
      user = await Astrologer.findOne({ _id: userId });
    }
    // Fetch user details by userId

    if (!user) {
      console.error("User not found.");
      return false; // Handle case where user doesn't exist
    }

    // Extract the user's name
    const userName = user.name || "there"; // Fallback if the name is missing

    // Craft the notification message
    const title = "🎉 Welcome Aboard!";
    const message =
      userType === "user"
        ? `Dear ${userName}, Welcome to Rudra Ganga🌟`
        : `Dear ${userName}, Welcome to Rudra Ganga🌟`;

    console.log("sadsadsadsadsaa");

    // Send the push notification
    await sendPushNotification(
      userId,
      title,
      message,
      playerId // Ensure the playerId is passed for reliable delivery
    );

    console.log(`✅ Welcome notification sent to ${userName}`);
    return true; // Indicate successful notification
  } catch (error) {
    console.error("Error sending welcome notification:", error);
    return false; // Handle any errors during the process
  }
};

export const sendCustomiseNotifications = async (
  userId,
  playerId,
  title,
  message
) => {
  try {
   
    //   Send the push notification
    await sendPushNotification(
      userId,
      title,
      message,
      playerId // Ensure the playerId is passed for reliable delivery
    );
    return true; // Indicate successful notification
  } catch (error) {
    console.error("Error sending welcome notification:", error);
    return false; // Handle any errors during the process
  }
};
