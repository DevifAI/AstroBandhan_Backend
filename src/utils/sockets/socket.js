import { Server as socketIo } from "socket.io"; // Named import for socket.io
import { createChatRoom, deductMoney, joinChatRoom, saveChatMessage } from "./chatHelper.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import { ObjectId } from "bson";
import Chat from "../../models/chatSchema.js";
import moment from "moment-timezone";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { start_call } from "../../controller/user/callController.js";
import axios from "axios";
import AgoraAccessToken from 'agora-access-token';
import { AdminWallet } from "../../models/adminWallet.js";
import { Admin } from "../../models/adminModel.js";

// Store connected users (active users map)
export let activeUsers = {};  // Store users by userId and socketId

let io; // Declare io variable to be initialized later

let chatIntervals = {}; // Store intervals for each chat room
let chatRoomParticipants = {}; // Store users in chat rooms
const chatStartTimes = {}; // To store start time of each chat room

// Helper function to check if both the user and astrologer are in the chat room
const isAllUsersJoined = (chatRoomId, userId, astrologerId) => {
    const participants = chatRoomParticipants[chatRoomId];
    console.log({ userId, astrologerId, chatRoomId })
    // Check if both user and astrologer are in the chat room
    return participants.size === 2 && participants.has(userId) && participants.has(astrologerId);
};

// Function to handle socket connections and events
export const initSocket = (server) => {
    // console.log({ server });

    // Initialize socket.io with the provided server
    io = new socketIo(server, {
        cors: {
            origin: "https://localhost:6000", // Adjust based on where your client is hosted
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // Event listener for a new connection
    io.on('connection', (socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        // When the user sends their userId to the server (after logging in, for example)
        socket.on('set_user_id', (userId) => {
            activeUsers[userId] = socket.id;  // Store the socketId associated with the userId
            console.log(`User ID ${userId} is connected with socket ID: ${socket.id}`);
        });

        // Event for when a user wants to start a chat
        // Event for when a user wants to start a chat

        socket.on('startChat', async ({ userId, role, astrologerId }) => {
            const user = await User.findById(userId);
            const astrologer = await Astrologer.findById(astrologerId);

            if (!user || !astrologer) {
                console.error('User or astrologer not found.');
                return;
            }

            const per_min_cost = astrologer.pricePerChatMinute;
            if (user.walletBalance < per_min_cost) {
                return socket.emit('error', "Insufficient Funds, Please Recharge");
            }

            const totalSeconds = Math.floor((user.walletBalance / per_min_cost) * 60);
            const totalMinutes = Math.floor(totalSeconds / 60);
            const remainingSeconds = totalSeconds % 60;
            const totalTime = `${totalMinutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;

            try {
                const result = await createChatRoom(userId, role, astrologerId);
                if (result.success) {

                    const chatRoomId = result.chatRoomId;
                    socket.join(chatRoomId);
                    socket.emit('chatRoomCreated', { "success": true, chatRoomId, astrologerId: astrologerId, userId: userId, totalChatDuration: totalTime });
                    if (!chatRoomParticipants[result.chatRoomId]) {
                        chatRoomParticipants[result.chatRoomId] = new Set(); // Initialize the set for new chat room
                    }
                    chatRoomParticipants[result.chatRoomId].add(userId);

                    socket.to(chatRoomId).emit('system_message', `Astrologer will join soon !`);

                    const astrologerSocketId = activeUsers[astrologerId];
                    if (astrologerSocketId) {
                        io.to(astrologerSocketId).emit('newChatRoom', {
                            chatRoomId: result.chatRoomId,
                            userId,
                            astrologerId,
                            message: `A user has created a chat room with you.`,
                        });
                    }

                    // Notify the astrologer of the incoming chat request
                    socket.to(astrologer.socketId).emit('incomingChatRequest', {
                        userId,
                        chatRoomId,
                        message: 'Incoming chat request',
                    });

                    // Handle astrologer's response
                    socket.on('astrologerResponse', async ({ chatRoomId, response }) => {
                        if (response === 'approve') {
                            console.log('Astrologer approved the chat');
                            socket.emit('chatApproved', { chatRoomId, message: 'Chat approved by astrologer' });
                        } else if (response === 'deny') {
                            console.log('Astrologer denied the chat');

                            // Notify the user and force them to leave the chat room
                            socket.to(chatRoomId).emit('chatDenied', { message: 'Chat request denied by astrologer' });
                            socket.leave(chatRoomId);
                            // Remove the chat room from active sessions
                            delete chatRoomParticipants[chatRoomId];
                            // Optionally clean up the chat room data in the database
                            await ChatRoom.findByIdAndUpdate(chatRoomId, { status: 'inactive' });
                        }
                    });
                } else {
                    socket.emit('error', result.message);
                }
            } catch (error) {
                console.error("Error starting chat:", error);
                socket.emit('error', 'An error occurred while starting the chat.');
            }
        });

        socket.on('startaudiocall', async ({ userId, channleid, astrologerId }) => {
            const appID = "69779ffdb88442ecb348ae75b0b3963d";
            const appCertificate = "e10b414d78c84ec9bcd1160d6fe0ef4c";

            // Generate unique UIDs for both client and astrologer
            const userUid = Math.floor(Math.random() * 100000); // Unique UID for the client
            const astrologerUid = Math.floor(Math.random() * 100000); // Unique UID for the astrologer

            // Function to generate Agora token with provided role (PUBLISHER or SUBSCRIBER)
            const generateAgoraToken = (channelName, appID, appCertificate, uid, role) => {
                const token = AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
                    appID,
                    appCertificate,
                    channelName,
                    uid,
                    role,
                    Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
                );
                return token;
            };

            // Define the channel name from the passed `channleid`
            let channelName = channleid;

            // Generate tokens for both client (PUBLISHER) and astrologer (SUBSCRIBER)
            const clientToken = generateAgoraToken(channelName, appID, appCertificate, userUid, AgoraAccessToken.RtcRole.PUBLISHER);
            const astrologerToken = generateAgoraToken(channelName, appID, appCertificate, astrologerUid, AgoraAccessToken.RtcRole.PUBLISHER);

            // Get the active socket IDs for astrologer and client
            const astrologerSocketId = activeUsers[astrologerId];
            const userSocketId = activeUsers[userId];
            
            // Emit the start call event to both users with their tokens and UIDs
            io.to(astrologerSocketId).emit('startaudiocall', {
                channleid: channelName,
                userId,
                astrologerId,
                token: astrologerToken, // Token for astrologer (SUBSCRIBER)
                uid: astrologerUid,     // UID for astrologer
                message: `A user has created a chat room with you.`
            });

            io.to(userSocketId).emit('startaudiocall', {
                channleid: channelName,
                userId,
                astrologerId,
                token: clientToken,     // Token for client (PUBLISHER)
                uid: userUid,          // UID for client
                message: `A user has created a chat room with you.`
            });
        });

        // socket.on('startaudiocall', async ({ userId, channleid, astrologerId }) => {
        //     const appID = "69779ffdb88442ecb348ae75b0b3963d";
        //     const appCertificate = "e10b414d78c84ec9bcd1160d6fe0ef4c";
        //     const uid = Math.floor(Math.random() * 100000); // Random user ID

        //     // Function to generate token for user (PUBLISHER role)
        //     const generateAgoraToken = (channelName, appID, appCertificate, uid) => {
        //         return AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
        //             appID,
        //             appCertificate,
        //             channelName,
        //             uid,
        //             AgoraAccessToken.RtcRole.PUBLISHER,
        //             Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
        //         );
        //     };

        //     // Function to generate token for astrologer (SUBSCRIBER role)
        //     const generateAstrologerToken = (channelName, appID, appCertificate, uid) => {
        //         return AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
        //             appID,
        //             appCertificate,
        //             channelName,
        //             uid,
        //             AgoraAccessToken.RtcRole.SUBSCRIBER,
        //             Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
        //         );
        //     };

        //     let channelName = channleid;

        //     const userToken = generateAgoraToken(channelName, appID, appCertificate, uid);
        //     const astrologerToken = generateAstrologerToken(channelName, appID, appCertificate, uid + 1); // Different UID for astrologer

        //     const astrologerSocketId = activeUsers[astrologerId];
        //     const userSocketId = activeUsers[userId];

        //     console.log("Logs:");
        //     console.log({ astrologerId, userId, channelName, uid, userToken, astrologerSocketId, userSocketId });

        //     // Emit event to astrologer with their unique token
        //     if (astrologerSocketId) {
        //         io.to(astrologerSocketId).emit('startaudiocall', {
        //             channleid: channleid,
        //             userId,
        //             astrologerId,
        //             token: astrologerToken,
        //             uid: uid + 1,
        //             message: `A user has created a chat room with you.`
        //         });
        //     } else {
        //         console.log(`Astrologer ${astrologerId} is not connected.`);
        //     }

        //     // Emit event to user with their unique token
        //     if (userSocketId) {
        //         io.to(userSocketId).emit('startaudiocall', {
        //             channleid: channleid,
        //             userId,
        //             astrologerId,
        //             token: userToken,
        //             uid,
        //             message: `A chat room has been created with the astrologer.`
        //         });
        //     } else {
        //         console.log(`User ${userId} is not connected.`);
        //     }
        // });

        socket.on('joinedaudiocall', async ({ userId, channleid, astrologerId, publisherUid, JoinedId }) => {

            console.log({ publisherUid, JoinedId });
            const payload = {
                userId,        // Replace with actual userId
                astrologerId,  // Replace with actual astrologerId
                channleid,
                publisherUid,
                JoinedId,
            };

            console.log("payload");
            console.log(payload);

            // Send POST request using axios
            const response = await axios.post('http://localhost:6000/astrobandhan/v1/user/start/call', payload);
            console.log(response);

            const astrologerSocketId = activeUsers[astrologerId];
            const userSocketId = activeUsers[userId];

            io.to(astrologerSocketId).emit('callid_audiocall', {
                callId:response.data["callId"],
                response:response.data,
                message: `A user has created a chat room with you.`,
            });
            
            io.to(userSocketId).emit('callid_audiocall', {
                callId:response.data["callId"],
                response:response.data,
                message: `A user has created a chat room with you.`,
            });

        });
        
        socket.on('endaudiocall', async ({ callId,astrologerId,userId }) => {

            const payload = {
                callId  // Replace with actual channelName
            };
            const response = await axios.post('http://localhost:6000/astrobandhan/v1/user/end/call', payload);
            console.log(response);

            const astrologerSocketId = activeUsers[astrologerId];

            io.to(astrologerSocketId).emit('endaudiocall', {
                userId,
                astrologerId,
                message: `Audio Call Ended.`,
            });
        });


        // Event for when a user wants to resume/join a chat
        socket.on('joinChatFirstTime', async ({ userId, astrologerId, chatRoomId, hitBy }) => {
            try {
                console.log(`First time joining:`, { userId, astrologerId, chatRoomId, hitBy });

                // Step 1: Ensure the chat room is initialized
                if (!chatRoomParticipants[chatRoomId]) {
                    chatRoomParticipants[chatRoomId] = new Set();
                }

                // Step 2: Add the participant based on `hitBy`
                if (hitBy === "user") {
                    chatRoomParticipants[chatRoomId].add(userId);
                } else {
                    chatRoomParticipants[chatRoomId].add(astrologerId);
                }

                // Step 3: Check if both participants have joined
                if (isAllUsersJoined(chatRoomId, userId, astrologerId)) {
                    joinChatRoom(userId, astrologerId, chatRoomId, hitBy);
                    console.log("Both users are in the chat room:", chatRoomParticipants);
                    socket.to(chatRoomId).emit('system_message', `Astrologer Joined !`);

                    // Step 5: Fetch user and astrologer details
                    const user = await User.findById(userId);
                    const astrologer = await Astrologer.findById(astrologerId);

                    if (!user || !astrologer) {
                        socket.emit('error', 'User or astrologer not found.');
                        return;
                    }

                    const minuteCost = astrologer.pricePerChatMinute;
                    const minuteComission = astrologer.chatCommission;

                    // Step 6: Check user's wallet balance
                    if (user.walletBalance < minuteCost) {
                        socket.emit('warning', 'Your balance is low. Please recharge your wallet');
                        const updatedUser = await User.findById(userId);
                        if (updatedUser.walletBalance < minuteCost) {
                            socket.emit('error', 'Insufficient balance. Chat session is ending.');
                            socket.leave(chatRoomId); // Force leave the chat room
                            await Chat.findOneAndUpdate(
                                { chatRoomId },
                                { $set: { duration: "0:00" } },
                                { new: true }
                            );
                            clearInterval(chatIntervals[chatRoomId]); // Stop the interval
                        }
                    } else {
                        // Step 4: Store the start time of the chat session
                        chatStartTimes[chatRoomId] = Date.now();

                        const admins = await Admin.findAll();  // Or Astrologer.findAll() if you're working with astrologers

                        if (admins.length === 0) {
                            return res.status(404).json({ message: "No Admin found" });
                        }

                        // Take the first user/astrologer document
                        const adminUser = admins[0]; // Change this to astrologer if working with astrologers
                        adminUser.walletBalance += minuteComission;
                        await adminUser.save()

                        // Deduct the cost for 1 minute
                        user.walletBalance -= minuteCost;
                        await user.save();

                        // Increment astrologer's wallet balance
                        astrologer.walletBalance += (minuteCost - minuteComission);
                        await astrologer.save();

                        const adminWalletTransaction = new AdminWallet.create({
                            amount: minuteComission,
                            transaction_id: `ADMIN_TXN_${Date.now()}`,
                            transaction_type: "credit",
                            credit_type: "chat",
                            service_id: chatRoomId
                        })
                        await adminWalletTransaction.save()
                        // Log the transaction
                        const userTransaction = new Wallet({
                            user_id: userId,
                            amount: minuteCost,
                            transaction_id: `TXN-${Date.now()}`,
                            amount_type: 'debit',
                            debit_type: 'chat',
                            service_reference_id: chatRoomId,
                        });
                        await userTransaction.save();

                        const astrologerTransaction = new Wallet({
                            astrologer_id: astrologerId,
                            amount: minuteCost - minuteComission,
                            transaction_id: `TXN-${Date.now()}`,
                            amount_type: 'credit',
                            debit_type: 'chat',
                            service_reference_id: chatRoomId,
                        });
                        await astrologerTransaction.save();

                        // Emit success message
                        socket.emit('intervalMessage', { chatRoomId, message: `Total of ${minuteCost} deducted from user's wallet. Remaining balance: ${user.walletBalance}` });
                        console.log(`Total of ${minuteCost} deducted from user's wallet. Remaining balance: ${user.walletBalance}`);
                    }

                    // Step 7: Start emitting every 1 minute for chat duration updates
                    chatIntervals[chatRoomId] = setInterval(async () => {
                        try {
                            const currentTime = Date.now();
                            const startTime = chatStartTimes[chatRoomId];
                            const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                            const minutes = Math.floor(elapsedSeconds / 60);
                            const seconds = elapsedSeconds % 60;
                            const elapsedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

                            const user = await User.findById(userId);

                            if (!user) {
                                throw new Error('User not found.');
                            }

                            // Check if the user has enough balance each minute
                            if (user.walletBalance < minuteCost) {
                                socket.emit('warning', 'Your balance is low. Please recharge before the next minute.');
                                setTimeout(async () => {
                                    if (user.walletBalance < minuteCost) {
                                        socket.emit('error', 'Insufficient balance. Chat session is ending.');
                                        socket.leave(chatRoomId);
                                        await Chat.findOneAndUpdate(
                                            { chatRoomId },
                                            { $set: { duration: elapsedTime } },
                                            { new: true }
                                        );
                                        clearInterval(chatIntervals[chatRoomId]);
                                    }
                                }, 60000);
                            }


                            const userWallet = Wallet.findOne({ user_id: userId, amount_type: "debit", service_reference_id: chatRoomId })
                            const astrologerWallet = Wallet.findOne({ astrologer_id: astrologerId, amount_type: "credit", service_reference_id: chatRoomId })
                            const adminWallet = AdminWallet.findOne({ service_id: chatRoomId })
                            if (adminWallet) {
                                adminWallet.amount += minuteComission
                                adminUser.wallet += minuteComission

                                await adminUser.save()
                                await adminWallet.save()
                            }
                            if (userWallet) {
                                // Increment the wallet balance with the minuteCost
                                user.walletBalance -= minuteCost; // Adding the minute cost to the wallet balance
                                await user.save(); // Save the updated user balance

                                userWallet.amount += minuteCost

                                await userWallet.save()
                            }

                            if (astrologerWallet) {
                                astrologer.walletBalance += (minuteCost - minuteComission);
                                await astrologer.save();

                                astrologerWallet.amount += (minuteCost - minuteComission)
                                await astrologerWallet.save()
                            }



                            // Update the chat duration
                            await Chat.findOneAndUpdate(
                                { chatRoomId },
                                { $set: { duration: elapsedTime } },
                                { new: true }
                            );
                            socket.emit('intervalMessage', { message: `Chat duration: ${elapsedTime}` });

                        } catch (error) {
                            console.error("Error during interval message or money deduction:", error);
                            clearInterval(chatIntervals[chatRoomId]);
                            socket.emit('error', 'An error occurred while processing the chat.');
                        }
                    }, 60000); // 1-minute interval
                }

                // Step 8: Join the chat room
                socket.join(chatRoomId);
                socket.emit('chatRoomJoined', { chatRoomId, message: 'Successfully joined the chat room.' });

            } catch (error) {
                console.error("Error during first-time join:", error);
                socket.emit('error', 'An error occurred while joining the chat.');
            }
        });


        socket.on('resumeChat', async ({ chatRoomId, userId, astrologerId }) => {
            try {
                // Ensure the chat room exists in participants list
                if (!chatRoomParticipants[chatRoomId]) {
                    chatRoomParticipants[chatRoomId] = new Set();
                }

                // Add user and astrologer to the room
                chatRoomParticipants[chatRoomId].add(userId);
                chatRoomParticipants[chatRoomId].add(astrologerId);

                console.log(`User ${userId} and Astrologer ${astrologerId} have rejoined the chat room: ${chatRoomId}`);
                console.log("Current Participants:", Array.from(chatRoomParticipants[chatRoomId]));

                // Notify all participants in the room about resumption
                socket.to(chatRoomId).emit('resumeMessage', `Chat has been resumed for room ${chatRoomId}`);

                // Let the user and astrologer join the chat room (via socket.io)
                socket.join(chatRoomId);

                // Emit a confirmation to the client who triggered the event
                socket.emit('resumeSuccess', `You have successfully rejoined chat room ${chatRoomId}`);
            } catch (error) {
                console.error("Error during chat resumption:", error);
                socket.emit('error', 'An error occurred while resuming the chat.');
            }
        });



        // Event for when a user wants to ends a chat
        socket.on('endChat', async ({ userId, astrologerId, chatRoomId }) => {
            console.log("userId");
            console.log(userId);
            console.log(astrologerId);
            console.log(chatRoomId);

            try {
                // Find the chat room and ensure the user/astrologer is part of it, then update status to 'inactive'
                const chatRoom = await ChatRoom.findOneAndUpdate(
                    {
                        $and: [
                            { chatRoomId: chatRoomId },
                            { user: userId },
                            { astrologer: astrologerId }
                        ],
                        status: 'active' // Ensure the chat is active
                    },
                    {
                        $set: { status: 'inactive' } // Update the status to 'inactive'
                    },
                    { new: true } // Return the updated document
                );

                if (chatRoom) {
                    // Notify both the user and astrologer
                    clearInterval(chatIntervals[chatRoomId]);
                    socket.emit('chatEnded', { chatRoomId, message: 'Chat has ended.' });
                    const astrologerSocketId = activeUsers[astrologerId];
                    if (astrologerSocketId) {
                        io.to(astrologerSocketId).emit('chatEnded_XX', {
                            chatRoomId: chatRoomId,
                            userId,
                            astrologerId,
                            message: `A user has created a chat room with you.`,
                        });
                    }
                    socket.to(chatRoomId).emit('chatEnded', { chatRoomId, message: 'The chat has ended.' });

                    // Optionally, leave the chat room
                    socket.leave(chatRoomId);
                    // Remove the participants from the chat room
                    delete chatRoomParticipants[chatRoomId];
                } else {
                    socket.emit('error', 'Chat room not found or already inactive.');
                }
            } catch (error) {
                console.error("Error ending chat:", error);
                socket.emit('error', 'An error occurred while ending the chat.');
            }
        });

        // Handle sending a message from user or astrologer
        socket.on('sendMessage', async ({ message, senderId, chatRoomId, senderType, messageType }) => {
            try {

                const chatMessage = {
                    senderType: senderType,
                    senderId: ObjectId.createFromHexString(senderId),
                    messageType,
                    message: message,
                    timestamp: moment().tz('Asia/Kolkata').toDate()  // Correctly using moment for local timezone
                };

                // Find the existing chat room and update it, or create a new one if it doesn't exist
                const chat = await Chat.findOneAndUpdate(
                    { chatRoomId },  // Find chat by chatRoomId
                    { $push: { messages: chatMessage } },  // Push the new message to the 'messages' array
                    { new: true, upsert: true }  // If no chat found, create a new one; return the updated document
                );

                // Broadcast the message to everyone in the room
                socket.to(chatRoomId).emit('chatMessage', chat);
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit('error', 'Failed to send the message.');
            }
        });


        // Disconnect handler
        socket.on("disconnect", () => {
            for (let userId in activeUsers) {
                if (activeUsers[userId] === socket.id) {
                    delete activeUsers[userId];  // Remove the user from activeUsers map
                    console.log(`User ID ${userId} disconnected.`);
                    break;
                }
            }
        });
    });
};

// Export the `io` object for use elsewhere in the application
export { io };