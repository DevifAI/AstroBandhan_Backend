import OneSignal from "onesignal-node";

// Initialize OneSignal Client with app credentials
const client = new OneSignal.Client(
  "befff9f6-5ae6-4eeb-a989-fe2eabe52a82", // appId
  "os_v2_app_x377t5s24zhoxkmj7yxkxzjkqi344tu5z3cudenn4pdqc4zxii3dt6bcfdto3dtjijzfqcn22kqb2z2rfsscchszupluy2rhoieoksi" // appAuthKey
);

const sendPushNotification = async (
  userId,
  heading = "New Notification",
  message,
  playerId = null
) => {
  // Validate inputs
  if ((!userId && !playerId) || !message) {
    throw new Error("Either userId or playerId, and message are required");
  }

  // Create the base notification object
  const notification = {
    contents: { en: message },
    headings: { en: heading },
    ios_badge_type: "Increase",
    ios_badge_count: 1,
  };

  // If we have a specific player ID, use it (most reliable)
  if (playerId) {
    notification.include_player_ids = [playerId];
  }
  // Otherwise fall back to external user ID
  else if (userId) {
    notification.include_external_user_ids = [userId];
    notification.channel_for_external_user_ids = "push";
  }

  try {
    console.log(
      `Sending notification to ${playerId ? "player ID: " + playerId : "user ID: " + userId}`
    );
    const response = await client.createNotification(notification);

    // Check for common errors
    if (response.body.errors && response.body.errors.length > 0) {
      console.warn("Notification sent but with errors:", response.body.errors);

      // If using external user ID failed, suggest storing player IDs
      if (
        response.body.errors.includes(
          "All included players are not subscribed"
        ) &&
        !playerId
      ) {
        console.warn(
          "User not subscribed. Consider implementing player ID storage."
        );
      }
    } else {
      console.log("✅ Notification sent successfully:", response.body);
    }

    return response.body;
  } catch (error) {
    if (error instanceof OneSignal.HTTPError) {
      console.error("OneSignal API error:", error.statusCode, error.body);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
};



export default sendPushNotification;

