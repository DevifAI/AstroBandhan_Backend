import AgoraAccessToken from 'agora-access-token';
import axios from 'axios';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/user.model.js';
import { Astrologer } from "../../models/astrologer.model.js";
import Call from '../../models/call.model.js';
import { Wallet } from '../../models/walletSchema.model.js';
import { Admin } from '../../models/adminModel.js';
import { AdminWallet } from '../../models/adminWallet.js';
import Notification from '../../models/notifications.model.js';


// key：608f211d904e4ee8bd7fa43571906fba
// secret：cdd5b28810f245e08d1ed395c2c3f3d1

const ACCESSKEYID = process.env.ACCESSKEYID
const SECRETACCESSKEY = process.env.SECRETACCESSKEY

const AGORAKEY = process.env.AGORAKEY
const AGORASECRET = process.env.AGORASECRET

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
const acquireRecordingResource = async (channelName, uid,) => {
    const acquireParams = {
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {}
    };

    // Encode the username and password to base64 for basic auth
    const authHeader = 'Basic ' + btoa(AGORAKEY + ':' + AGORASECRET);

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
const startRecording_video = async (resourceId, channleid, uid, token, publisherUid, JoinedId) => {


    const startParams = {
        cname: channleid,
        uid: uid.toString(),
        clientRequest: {
            token: token,
            recordingConfig: {
                maxIdleTime: 30, // Time in seconds to stop recording when no active streams
                streamTypes: 2, // 2 = Record both audio and video
                streamMode: "default",
                audioProfile: 1, // Default audio profile (1 = high quality)
                channelType: 0, // 0 = Communication channel
                videoStreamType: 0, // 0 = High video quality
                transcodingConfig: {
                    height: 640, // Height of the video in the transcoded file
                    width: 360,  // Width of the video in the transcoded file
                    bitrate: 500, // Video bitrate in Kbps
                    fps: 15, // Frames per second
                    mixedVideoLayout: 1, // Layout for mixed video streams
                    backgroundColor: "#FF0000" // Background color (Hex)
                },
                subscribeAudioUids: [publisherUid.toString(), JoinedId.toString()],
                subscribeVideoUids: [publisherUid.toString(), JoinedId.toString()],
                subscribeUidGroup: 0 // Group for subscribing to the UIDs
            },
            "recordingFileConfig": {
                "avFileType": [
                    "hls", "mp4"
                ]
            },
            storageConfig: {
                vendor: 1, // Assume AWS for now
                region: 14, // region AP_SOUTH_1
                bucket: "rudraganga2.0", // Replace with actual bucket name
                accessKey: ACCESSKEYID, // Replace with actual access key
                secretKey: SECRETACCESSKEY // Replace with actual secret key
            }
        }
    };



    // Encode the username and password to base64 for basic auth
    const authHeader = 'Basic ' + btoa(AGORAKEY + ':' + AGORASECRET);


    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
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

const startRecording_audio = async (resourceId, channleid, uid, token, publisherUid, JoinedId) => {


    const startParams = {
        cname: channleid,
        uid: uid.toString(),
        clientRequest: {
            token: token,
            recordingConfig: {
                maxIdleTime: 30, // Time in seconds to stop recording when no active streams
                streamTypes: 1, // 2 = Record both audio and video
                streamMode: "default",
                audioProfile: 1, // Default audio profile (1 = high quality)
                channelType: 0, // 0 = Communication channel
                videoStreamType: 0, // 0 = High video quality
                transcodingConfig: {
                    height: 640, // Height of the video in the transcoded file
                    width: 360,  // Width of the video in the transcoded file
                    bitrate: 500, // Video bitrate in Kbps
                    fps: 15, // Frames per second
                    mixedVideoLayout: 1, // Layout for mixed video streams
                    backgroundColor: "#FF0000" // Background color (Hex)
                },
                subscribeAudioUids: [publisherUid.toString(), JoinedId.toString()],
                subscribeVideoUids: [],
                subscribeUidGroup: 0 // Group for subscribing to the UIDs
            },
            "recordingFileConfig": {
                "avFileType": [
                    "hls", "mp4"
                ]
            },
            storageConfig: {
                vendor: 1, // Assume AWS for now
                region: 14, // region AP_SOUTH_1
                bucket: "astrobandhan", // Replace with actual bucket name
                accessKey: ACCESSKEYID, // Replace with actual access key
                secretKey: SECRETACCESSKEY // Replace with actual secret key
            }
        }
    };



    // Encode the username and password to base64 for basic auth
    const authHeader = 'Basic ' + btoa(AGORAKEY + ':' + AGORASECRET);


    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
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
const stopRecording = async (resourceId, sid, channelName, recordingUID) => {

    const stopParams = {
        cname: channelName,
        uid: recordingUID.toString(),
        clientRequest: {
            "async_stop": false
        }
    };
    // Encode the username and password to base64 for basic auth
    const authHeader = 'Basic ' + btoa(AGORAKEY + ':' + AGORASECRET);
    try {
        const response = await axios.post(
            `https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
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
        console.log(`https://api.agora.io/v1/apps/${appID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,)
        console.log({ stopParams })
        console.error("Error stopping Agora recording:", error);
        throw new Error("Failed to stop recording");
    }
};

// Function to start the call and record it
export const start_call = asyncHandler(async (req, res) => {
    try {


        // console.log("callComming");
        const { userId,        // Replace with actual userId
            astrologerId,  // Replace with actual astrologerId
            channleid,
            publisherUid,
            JoinedId, callType } = req.body;
        const user = await User.findById(userId);
        const astrologer = await Astrologer.findById(astrologerId);

        if (!user || !astrologer) {
            return res.status(404).json({ message: "User or Astrologer not found" });
        }

        const pricePerMinute = callType === "audio" ? astrologer.pricePerCallMinute : astrologer.pricePerVideoCallMinute;
        const commissionPerMinute = callType === "audio" ? astrologer.callCommission : astrologer.videoCallCommission;
        // Check if user has enough balance to start the call
        if (user.walletBalance < pricePerMinute) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        // Deduct first minute from user's wallet and credit astrologer
        user.walletBalance -= pricePerMinute;
        astrologer.walletBalance += (pricePerMinute - commissionPerMinute); // Add the balance after commission

        const admins = await Admin.find({});  // Or Astrologer.findAll() if you're working with astrologers
        // console.log(admins);
        if (admins.length === 0) {
            return res.status(404).json({ message: "No Admin found" });
        }

        // Take the first user/astrologer document
        const adminUser = admins[0]; // Change this to astrologer if working with astrologers
        // adminUser.adminWalletBalance += commissionPerMinute;

        await user.save();
        await astrologer.save();
        await adminUser.save()
        const uid = Math.floor(Math.random() * 100000); // Random unique UID for the recording bot
        // Generate Agora token
        const token = generateAgoraToken(channleid, uid);
        // Acquire recording resource
        const { resourceId } = await acquireRecordingResource(channleid, uid,);
        // console.log({resourceId});
        // console.log({token});
        const resCall = await startRecording_video(resourceId, channleid, uid, token, publisherUid, JoinedId,);

        const abc = {
            userId, // Log as key-value pair in an object
            astrologerId,
            channelName: resCall['cname'],
            startedAt: new Date(),
            totalAmount: pricePerMinute,
            sid: resCall['sid'],
            resourceId,
            recordingUID: uid.toString(),
            recordingToken: token, // Proper key-value pair
            recordingStarted: true, // Proper key-value pair
            callType,
        };

        // if(!resCall){
        //     return true;
        // }
        // // // Create the Call document in the database
        const newCall = new Call(abc);
        await newCall.save();
        console.log({ newCall });
        // Start a timer to deduct money every minute
        const intervalId = setInterval(async () => {
            // console.log("testingcccc");
            try {
                const updatedUser = await User.findById(userId);
                console.log({ updatedUser, pricePerMinute });
                if (updatedUser.walletBalance < pricePerMinute) {
                    clearInterval(intervalId);
                    const payload = {
                        callId: newCall._id
                    }
                    await axios.post('http://localhost:6000/astrobandhan/v1/user/end/call', payload);
                } else {
                    // console.log({newCall});
                    updatedUser.walletBalance -= pricePerMinute;
                    astrologer.walletBalance += (pricePerMinute - commissionPerMinute); // Add the balance after commission
                    // adminUser.adminWalletBalance += commissionPerMinute;
                    newCall.totalAmount += pricePerMinute;
                    await updatedUser.save();
                    await newCall.save();
                    await astrologer.save();
                    await adminUser.save()

                }
            } catch (error) {
                console.error("Error during per-minute deduction:", error);
                clearInterval(intervalId);
            }
        }, 60000);
        newCall.intervalId = intervalId;
        await newCall.save();

        res.status(200).json({
            message: "Call started successfully",
            callId: newCall._id,
            token,
            channelName: channleid,
            resourceId,
            resCall
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
});



export const endCallAndLogTransaction = asyncHandler(async (req, res) => {

    try {
        const { callId } = req.body;
        const call = await Call.findById(callId).populate("userId astrologerId");
        if (!call || !call.startedAt) return;

        // Stop recording
        const { resourceId, sid, recordingUID, channelName, userId, astrologerId } = call;
        const recordingData = await stopRecording(resourceId, sid, channelName, recordingUID);

        // Update the call with recording URL
        call.endedAt = new Date();
        call.duration = Math.ceil((call.endedAt - call.startedAt) / 1000);
        call.recordingData = recordingData; // Store the recording URL

        console.log({ recordingData });
        // Stop the interval
        if (call.intervalId) {
            clearInterval(call.intervalId);
        }
        const user = await User.findById(userId);
        const astrologer = await Astrologer.findById(astrologerId);

        const admins = await Admin.find({});  // Fetch all admins

        if (admins.length === 0) {
            return res.status(404).json({ message: "No Admin found" });
        }


        if (!user || !astrologer) {
            throw new Error("User or Astrologer not found during call end");
        }

        console.log("duration", call.duration);
        console.log("admin", Math.ceil((call.duration / 60) * astrologer.callCommission));
        console.log("astrologer", Math.ceil(astrologer.callCommission * (call.duration / 60)));

        await AdminWallet.create({
            amount: Math.ceil((call.duration / 60) * astrologer.callCommission), // Convert duration to minutes and round off
            transaction_id: `ADMIN_TXN_${Date.now()}`,
            transaction_type: "credit",
            credit_type: "call",
            service_id: call._id,
            userId,
        });

        const userDebit = await Wallet.create({
            user_id: call.userId,
            amount: call.totalAmount,
            transaction_id: `CALL-${call._id}+${Date.now()}`,
            transaction_type: "debit",
            debit_type: "call",
            service_reference_id: call._id
        });

        const astrologerCredit = await Wallet.create({
            astrologer_id: call.astrologerId,
            amount: call.totalAmount - Math.ceil(astrologer.callCommission * (call.duration / 60)),
            transaction_id: `CALL-${call._id}+${Date.now()}`,
            transaction_type: "credit",
            credit_type: "call",
            service_reference_id: call._id
        });


        const astrologerAcc = Astrologer.findById(call.astrologerId);
        const userAcc = User.findById(call.userId);

        await call.save();


        const newNotification = new Notification({
            userId: call.userId,
            message: [
                {
                    title: 'Coin Deducted',
                    desc: `${call.totalAmount} has been deducted from your wallet for the call with ${astrologerAcc.name}`,
                }
            ]
        });

        // Save the notification to the database
        newNotification.save()

        const newNotification_astrologer = new Notification({
            userId: call.userId,
            message: [
                {
                    title: 'Coin Credited',
                    desc: `${call.totalAmount - Math.ceil(astrologer.callCommission * (call.duration / 60))} has been credited to your wallet for the call with ${userAcc.name}`,
                }
            ]
        });

        // Save the notification to the database
        // newNotification.save()
        newNotification_astrologer.save()


        res.status(200).json({
            message: "Call ended successfully",
            astrologerCredit,
            userDebit
        });
        console.log(`Call ended. Total duration: ${call.duration} seconds. Total amount: ${call.totalAmount}`);
    } catch (error) {
        console.error("Error ending the call:", error);
    }
});


// Function to stop the recording and log the transaction

