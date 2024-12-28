import AgoraAccessToken from 'agora-access-token';
import axios from 'axios';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/user.model.js';
import { Astrologer } from "../../models/astrologer.model.js";
import Call from '../../models/call.model.js';
import { Wallet } from '../../models/walletSchema.model.js';

// key：608f211d904e4ee8bd7fa43571906fba
// secret：cdd5b28810f245e08d1ed395c2c3f3d1

// Define Agora credentials and configuration
const appID = "69779ffdb88442ecb348ae75b0b3963d";
const appCertificate = "e10b414d78c84ec9bcd1160d6fe0ef4c";

// Function to generate Agora token for starting the call
const generateAgoraToken = (channelName) => {
    const uid = Math.floor(Math.random() * 100); // Random user ID

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
const acquireRecordingResource = async (channelName, randomNumber, username, password) => {
    console.log({ randomNumber })
    const acquireParams = {
        cname: channelName,
        uid: "589517928",
        clientRequest: {}
    };

    // Encode the username and password to base64 for basic auth
    const authHeader = 'Basic ' + btoa("608f211d904e4ee8bd7fa43571906fba" + ':' + "cdd5b28810f245e08d1ed395c2c3f3d1");

    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/acquire`,
            acquireParams,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader, // Add the Authorization header
                }
            }
        );
        return response.data; // Return resourceId and sid
    } catch (error) {
        console.error("Error acquiring Agora recording resource:", error);
        throw new Error("Failed to acquire recording resource");
    }
};


// API to start the recording
const startRecording = async (resourceId, channelName, uid, token,publisherUid,JoinedId) => {
    const startParams = {
        cname: channelName,
        uid: "589517928",
        clientRequest: {
            token: token,
            "recordingConfig": {
                "maxIdleTime": 30,
                "streamTypes": 0,
                "streamMode": "original",
                "channelType": 0,
                "subscribeAudioUids": [
                    publisherUid,
                    JoinedId
                ],
                "subscribeUidGroup": 0
            },
            storageConfig: {
                vendor: 1, // Assume AWS for now
                region: 1, // Default region
                bucket: "astrobandhan", // Replace with actual bucket name
                accessKey: "AKIAWIJIUQXXXWRGG6VY", // Replace with actual access key
                secretKey: "8ginnGKGOGuaTj9Puh0STGQDcIsjpwZBCyFWqQJL" // Replace with actual secret key
            }
        }
    };

    const authHeader = 'Basic ' + btoa("608f211d904e4ee8bd7fa43571906fba" + ':' + "cdd5b28810f245e08d1ed395c2c3f3d1");

    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/individual/start`,
            startParams,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader, // Add the Authorization header
                }
            }
        );
        return response.data; // Return recording start data
    } catch (error) {
        console.error("Error starting Agora recording:", error);
        throw new Error("Failed to start recording");
    }
};

// API to stop the recording
const stopRecording = async (resourceId, sid, channelName, uid) => {

    const stopParams = {
        cname: channelName,
        uid: "589517928",
        clientRequest: {
            "async_stop": false
        }
    };
    const authHeader = 'Basic ' + btoa("608f211d904e4ee8bd7fa43571906fba" + ':' + "cdd5b28810f245e08d1ed395c2c3f3d1");
    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/individual/stop`,
            stopParams,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader, // Add the Authorization header
                }
            }
        );
        console.log({ response })
        return response.data; // Return stop recording data
    } catch (error) {
        console.log(`https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/individual/stop`,)
        console.log({ stopParams })
        console.error("Error stopping Agora recording:", error);
        throw new Error("Failed to stop recording");
    }
};

// Function to start the call and record it
export const start_call = asyncHandler(async (req, res) => {
    try {


        console.log("callComming");
        const { userId, astrologerId, channelName,publisherUid,JoinedId } = req.body;
        const user = await User.findById(userId);
        const astrologer = await Astrologer.findById(astrologerId);
        
        if (!user || !astrologer) {
            return res.status(404).json({ message: "User or Astrologer not found" });
        }

        const pricePerMinute = astrologer.pricePerCallMinute;
        // Check if user has enough balance to start the call
        if (user.walletBalance < pricePerMinute) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        // Deduct first minute from user's wallet and credit astrologer
        user.walletBalance -= pricePerMinute;
        astrologer.walletBalance += pricePerMinute;

        await user.save();
        await astrologer.save();

        // Generate Agora token
        const token = generateAgoraToken(channelName);
        const randomNumber = Number(Date.now().toString().slice(-9));
        // Acquire recording resource
        const { resourceId } = await acquireRecordingResource(channelName, randomNumber);

        // Start recording
        const resCall = await startRecording(resourceId, channelName, Math.floor(Math.random() * 100), token,publisherUid,JoinedId);

        // Create the Call document in the database
        const newCall = new Call({
            userId,
            astrologerId,
            channelName: resCall.cname,
            startedAt: new Date(),
            totalAmount: pricePerMinute,
            sid: resCall.sid,
            resourceId,
            recordingStarted: true, // Mark the recording as started
        });

        await newCall.save();

        // Start a timer to deduct money every minute
        const intervalId = setInterval(async () => {
            try {
                const updatedUser = await User.findById(userId);
                if (updatedUser.walletBalance < pricePerMinute) {
                    clearInterval(intervalId);
                    await endCallAndLogTransaction(newCall._id);
                } else {
                    updatedUser.walletBalance -= pricePerMinute;
                    astrologer.walletBalance += pricePerMinute;
                    newCall.totalAmount += pricePerMinute;

                    await updatedUser.save();
                    await astrologer.save();
                }
            } catch (error) {
                console.error("Error during per-minute deduction:", error);
                clearInterval(intervalId);
            }
        }, 60000);

        res.status(200).json({
            message: "Call started successfully",
            callId: newCall._id,
            token,
            channelName,
            resourceId,
            resCall
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



export const endCallAndLogTransaction = asyncHandler(async (req, res) => {

    try {
        const { callId } = req.body;
        const call = await Call.findById(callId).populate("userId astrologerId");
        if (!call || !call.startedAt) return;

        // Stop recording
        const { resourceId, sid } = call;
        const recordingData = await stopRecording(resourceId, sid, call.channelName, Math.floor(Math.random() * 100));

        // Update the call with recording URL
        call.endedAt = new Date();
        call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
        call.recordingUrl = recordingData.url; // Store the recording URL

        const user = await User.findById(call.userId);
        const astrologer = await Astrologer.findById(call.astrologerId);

        if (!user || !astrologer) {
            throw new Error("User or Astrologer not found during call end");
        }

        // Log wallet transactions
        await Wallet.create({
            user_id: call.userId,
            amount: call.totalAmount,
            transaction_id: `CALL-${call._id}+${Date.now()}`,
            transaction_type: "debit",
            debit_type: "call",
            service_reference_id: call._id
        });

        await Wallet.create({
            user_id: call.astrologerId,
            amount: call.totalAmount,
            transaction_id: `CALL-${call._id}+${Date.now()}`,
            transaction_type: "credit",
            credit_type: "call",
            service_reference_id: call._id
        });

        await call.save();
        console.log(`Call ended. Total duration: ${call.duration} seconds. Total amount: ${call.totalAmount}`);
    } catch (error) {
        console.error("Error ending the call:", error);
    }
});
 

// Function to stop the recording and log the transaction
 
