import AgoraAccessToken from "agora-access-token";
import axios from "axios";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import Call from "../../models/call.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { Admin } from "../../models/adminModel.js";
import { AdminWallet } from "../../models/adminWallet.js";
import Notification from "../../models/notifications.model.js";
import mongoose from "mongoose";
import { agenda } from "../../utils/call/agenda.js";
import { formatDateToTimeString } from "../../utils/call/generateToken.js";
const { ObjectId } = mongoose.Types; // Import ObjectId from mongoose

// key：608f211d904e4ee8bd7fa43571906fba
// secret：cdd5b28810f245e08d1ed395c2c3f3d1

const ACCESSKEYID = process.env.ACCESSKEYID;
const SECRETACCESSKEY = process.env.SECRETACCESSKEY;

const AGORAKEY = process.env.AGORAKEY;
const AGORASECRET = process.env.AGORASECRET;

// Define Agora credentials and configuration
const appID = process.env.AGORAAPPID;
const appCertificate = process.env.AGORACERTIFICATE;

// Function to generate Agora token for starting the call
const generateAgoraToken = (channelName, uid) => {
  const token = AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    AgoraAccessToken.RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
  );
  return token;
};

// API to acquire recording resource
const acquireRecordingResource = async (channelName, uid) => {
  const acquireParams = {
    cname: channelName,
    uid: uid.toString(),
    clientRequest: {
      resourceExpiredHour: 24,
      scene: 0,
    },
  };

  const authHeader = "Basic " + btoa(`${AGORAKEY}:${AGORASECRET}`);

  try {
    const response = await axios.post(
      `https://api.agora.io/v1/apps/${appID}/cloud_recording/acquire`,
      acquireParams,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );
    console.log({ response });
    return response.data;
  } catch (error) {
    console.error(
      "Error acquiring Agora recording resource:",
      error.response?.data || error.message
    );
    throw new Error("Failed to acquire recording resource");
  }
};
// API to start the recording
const startRecording_video = async (
  resourceId,
  channleid,
  uid,
  token,
  broadcasters
) => {
  console.log("Starting video recording with broadcasters:", broadcasters);
  const startParams = {
    cname: channleid,
    uid: uid.toString(),
    clientRequest: {
      token: token,
      recordingConfig: {
        maxIdleTime: 120, // Wait 2 minutes before stopping when no active streams
        streamTypes: 2, // 2 = Record both audio and video
        streamMode: "default",
        audioProfile: 1, // Default audio profile (1 = high quality)
        channelType: 0, // 0 = Communication channel
        videoStreamType: 0, // 0 = High video quality
        transcodingConfig: {
          height: 640, // Height of the video in the transcoded file
          width: 360, // Width of the video in the transcoded file
          bitrate: 500, // Video bitrate in Kbps
          fps: 15, // Frames per second
          mixedVideoLayout: 1, // Layout for mixed video streams
          backgroundColor: "#FF0000", // Background color (Hex)
        },
        // subscribeAudioUids: [publisherUid.toString(), JoinedId.toString()],
        subscribeAudioUids: [],
        subscribeVideoUids: broadcasters.map(String),
        subscribeUidGroup: 0, // Group for subscribing to the UIDs
      },
      recordingFileConfig: {
        avFileType: ["hls", "mp4"],
      },
      storageConfig: {
        vendor: 1,
        region: 6, // india
        bucket: "astrobandhan2025",
        accessKey: ACCESSKEYID,
        secretKey: SECRETACCESSKEY,
        fileNamePrefix: ["recordings"], // Add this for better organization
      },
    },
  };

  // Encode the username and password to base64 for basic auth
  const authHeader = "Basic " + btoa(AGORAKEY + ":" + AGORASECRET);

  try {
    const response = await axios.post(
      `https://api.sd-rtn.com/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
      startParams,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader, // Add the Authorization header
        },
      }
    );
    console.log("call recording start");
    console.log({ response });
    return response.data; // Return recording start data
  } catch (error) {
    console.error("Error starting Agora recording:", error);
    throw new Error("Failed to start recording");
  }
};

const startRecording_audio = async (
  resourceId,
  channelId,
  uid,
  token,
  broadcasters
) => {
  const startParams = {
    cname: channelId,
    uid: uid.toString(),
    clientRequest: {
      token: token,
      recordingConfig: {
        maxIdleTime: 120,
        streamTypes: 2,
        channelType: 0,
        videoStreamType: 0,
        streamMode: "standard", // use "standard" or "mix" only if you're mixing streams
        audioProfile: 1,
        transcodingConfig: {
          width: 360,
          height: 640,
          fps: 15,
          bitrate: 500,
          mixedVideoLayout: 1,
          backgroundColor: "#FFFFFF",
        },
        subscribeVideoUids: [],
        subscribeAudioUids: broadcasters.map(String), // Important: convert to strings
        subscribeUidGroup: 1,
      },
      recordingFileConfig: {
        avFileType: ["hls", "mp4"],
      },
      storageConfig: {
        vendor: 1,
        region: 5, // india
        bucket: "astrobandhan2025",
        accessKey: ACCESSKEYID,
        secretKey: SECRETACCESSKEY,
        fileNamePrefix: ["recordings"], // Add this for better organization
      },
    },
  };

  const authHeader =
    "Basic " + Buffer.from(`${AGORAKEY}:${AGORASECRET}`).toString("base64");

  try {
    const response = await axios.post(
      `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
      startParams,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );
    console.log("Recording started:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error starting Agora recording:",
      error.response?.data || error.message
    );
    throw new Error("Failed to start recording");
  }
};

// API to stop the recording
const stopRecording = async (resourceId, sid, channelName, recordingUID) => {
  const stopParams = {
    cname: channelName,
    uid: recordingUID.toString(),
    clientRequest: {},
  };

  const authHeader =
    "Basic " + Buffer.from(`${AGORAKEY}:${AGORASECRET}`).toString("base64");

  try {
    const response = await axios.post(
      `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
      stopParams,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    );
    console.log("Recording stopped:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "STOP API URL:",
      `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`
    );
    console.error("Params:", stopParams);
    console.error(
      "Error stopping Agora recording:",
      error.response?.data || error.message
    );
    return null;
  }
};

const queryRecording_audio = async (resourceId, sid, channelId) => {
  const authHeader =
    "Basic " + Buffer.from(`${AGORAKEY}:${AGORASECRET}`).toString("base64");

  try {
    const response = await axios.get(
      `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    console.log("Agora recording query response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error querying Agora recording:",
      error.response?.data || error.message
    );
    throw new Error("Failed to query recording status");
  }
};

export const startCall = async (payload) => {
  const { userId, astrologerId, channelName, callType = "audio" } = payload;

  try {
    // Fetch participants from DB
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);
    const allAdmins = await Admin.find();
    const admin = allAdmins[0];

    if (!user || !astrologer || !admin) {
      throw new Error("Participants not found");
    }

    // Get pricing details
    const pricePerMinute =
      callType === "audio"
        ? astrologer.pricePerCallMinute
        : astrologer.pricePerVideoCallMinute;

    const commission =
      callType === "audio"
        ? astrologer.callCommission
        : astrologer.videoCallCommission;

    // Ensure user has enough balance
    if (user.walletBalance < pricePerMinute) {
      throw new Error("Insufficient balance");
    }

    // Deduct 1 minute of balance
    user.walletBalance -= pricePerMinute;
    astrologer.walletBalance += pricePerMinute - commission;
    admin.walletBalance += commission;

    // Step 1: Check channel for active broadcasters

    const authHeader =
      "Basic " + Buffer.from(`${AGORAKEY}:${AGORASECRET}`).toString("base64");

    const channelStatus = await axios.get(
      `https://api.agora.io/dev/v1/channel/user/${appID}/${channelName}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );
    console.log({ channelStatus });
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    const broadcasters = channelStatus?.data?.data?.broadcasters ?? [];
    console.log({ broadcasters });

    if (broadcasters.length === 0) {
      throw new Error("No active publishers found in channel");
    }

    // Step 2: Start Recording
    const recordingUID = Math.floor(Math.random() * 100000);
    const { resourceId } = await acquireRecordingResource(
      channelName,
      recordingUID
    );
    console.log({ resourceId });

    const newToken = generateAgoraToken(channelName, recordingUID);
    let recording;
    if (callType === "audio") {
      recording = await startRecording_audio(
        resourceId,
        channelName,
        recordingUID,
        newToken,
        broadcasters
      );
    } else {
      recording = await startRecording_video(
        resourceId,
        channelName,
        recordingUID,
        newToken,
        broadcasters
      );
    }

    console.log({ recording });

    const { sid } = recording;

    let pollInterval;

    // const startPolling = () => {
    //   pollInterval = setInterval(async () => {
    //     try {
    //       const queryResult = await queryRecording_audio(
    //         resourceId,
    //         sid,
    //         channelName
    //       );
    //       const status = queryResult?.serverResponse?.status;

    //       console.log("Polling status:", queryResult);

    //       // if (status === 1) {
    //       //   // Success status
    //       //   clearInterval(pollInterval);
    //       //   console.log("Recording processing completed.");
    //       //   // Proceed with further logic here
    //       // } else if ([2, 3].includes(status)) {
    //       //   // Failed or no file
    //       //   clearInterval(pollInterval);
    //       //   console.warn("Processing failed or no file found.");
    //       //   // Handle error accordingly
    //       // }
    //       // Else, continue polling (status 4 or 5)
    //     } catch (error) {
    //       clearInterval(pollInterval);
    //       console.error("Polling failed with error:", error);
    //     }
    //   }, 5000); // 5 seconds
    // };

    // Call this function to start polling
    // startPolling();

    // Step 3: Save call
    const newCall = new Call({
      userId,
      astrologerId,
      channelName,
      startedAt: formatDateToTimeString(new Date()),
      resourceId,
      sid,
      recordingUID,
      recordingToken: newToken,
      callType,
      recordingStarted: true,
      totalAmount: pricePerMinute,
    });

    await Promise.all([
      user.save(),
      astrologer.save(),
      admin.save(),
      newCall.save(),
    ]);

    // Step 4: Schedule billing
    agenda.every("1 minute", `charge_call_${newCall._id}`, {
      callId: newCall._id,
      userId,
      astrologerId,
    });

    return {
      success: true,
      recordingUID,
      callId: newCall._id,
      initialCharge: pricePerMinute,
    };
  } catch (error) {
    console.error("Call start failed:", error.message);
    throw error;
  }
};

// Set to track processed callIds
const processedCallIds = new Set();

// Helper function to parse your custom date string format
// Convert to a parseable ISO-like string:
export const endCallAndLogTransaction = async (callId, calltype) => {
  console.log("📞 Ending call...");

  try {
    if (processedCallIds.has(callId)) {
      console.log(`Call ${callId} already processed. Skipping.`);
      return { message: "Call already processed" };
    }
    processedCallIds.add(callId);

    const call = await Call.findById(callId).populate("userId astrologerId");
    if (!call || !call.startedAt) {
      return { error: "Call or startedAt not found" };
    }

    const now = new Date();

    // Use raw UTC values for calculations
    const startedAt = new Date(call.createdAt);
    const endedAt = now;

    // Calculate duration
    const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

    // Calculate billing
    let chargedMinutes, chargedDurationSeconds;
    if (durationSeconds < 60) {
      chargedMinutes = 1;
      chargedDurationSeconds = 60;
    } else {
      chargedMinutes = Math.ceil(durationSeconds / 60);
      chargedDurationSeconds = chargedMinutes * 60;
    }

    // Set values
    call.endedAt = formatDateToTimeString(now); // for UI display
    call.duration = chargedDurationSeconds;

    console.log({
      startedAt,
      endedAt,
      durationSeconds,
      chargedMinutes,
      chargedDurationSeconds,
    });

    // Price calculation based on call type
    console.log("11111111111111111111111111111111111111");
    console.log({ calltype });
    console.log("11111111111111111111111111111111111111");
    const pricePerMinute =
      calltype === "video"
        ? call.astrologerId.pricePerVideoCallMinute || 15
        : call.astrologerId.pricePerCallMinute || 10;

    const totalAmount = chargedMinutes * pricePerMinute;
    call.totalAmount = totalAmount;

    const adminCommissionAmount =
      calltype === "video"
        ? Math.ceil(chargedMinutes * call.astrologerId.videoCallCommission)
        : Math.ceil(chargedMinutes * call.astrologerId.callCommission);
    const astrologerCreditAmount = totalAmount - adminCommissionAmount;

    await call.save();
    if (call.intervalId) clearInterval(call.intervalId);

    const user = await User.findById(call.userId);
    const astrologer = await Astrologer.findById(call.astrologerId);
    const admins = await Admin.find({});
    if (!user || !astrologer || admins.length === 0)
      throw new Error("User/Astrologer/Admin not found");

    // Wallet entries based on call type
    const walletType = calltype === "video" ? "video" : "audio";

    await AdminWallet.create({
      amount: adminCommissionAmount,
      transaction_id: `ADMIN_TXN_${Date.now()}`,
      transaction_type: "credit",
      credit_type: walletType,
      service_id: call._id,
      userId: call.userId,
    });
    const lastAdmin = admins[admins.length - 1];

    if (lastAdmin) {
      await Admin.findByIdAndUpdate(lastAdmin._id, {
        $inc: { adminWalletBalance: adminCommissionAmount },
      });
    } else {
      console.warn("⚠️ No admin found to update wallet balance.");
    }

    await Wallet.create({
      user_id: call.userId,
      amount: totalAmount,
      transaction_id: `CALL-${call._id}+${Date.now()}`,
      transaction_type: "debit",
      debit_type: walletType,
      service_reference_id: call._id,
    });

    await Wallet.create({
      astrologer_id: call.astrologerId,
      amount: astrologerCreditAmount,
      transaction_id: `CALL-${call._id}+${Date.now()}`,
      transaction_type: "credit",
      credit_type: walletType,
      service_reference_id: call._id,
    });

    await new Notification({
      userId: call.userId,
      message: [
        {
          title: "Coin Deducted",
          desc: `${totalAmount} has been deducted from your wallet for the call with ${astrologer.name}`,
        },
      ],
    }).save();

    await new Notification({
      userId: call.astrologerId,
      message: [
        {
          title: "Coin Credited",
          desc: `${astrologerCreditAmount} has been credited to your wallet for the call with ${user.name}`,
        },
      ],
    }).save();

    console.log(
      `✅ Call ended. Duration: ${chargedDurationSeconds}s | Charged: ${chargedMinutes} min | Amount: ₹${totalAmount}`
    );

    return { message: "Call ended successfully" };
  } catch (error) {
    console.error("❌ Error ending the call:", error);
    throw error;
  }
};

// Helper function to parse your custom date string
function parseCustomDate(dateString) {
  // Example: "May 23, 2025 at 1:53 AM"
  const parts = dateString.split(" at ");
  const datePart = parts[0]; // "May 23, 2025"
  const timePart = parts[1]; // "1:53 AM"

  return new Date(`${datePart} ${timePart} GMT+0530`);
}

// Function to stop the recording and log the transaction
