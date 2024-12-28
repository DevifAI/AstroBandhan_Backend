import { Server as socketIo } from "socket.io"; // Named import for socket.io
import { createChatRoom, deductMoney, joinChatRoom, saveChatMessage } from "./chatHelper.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import { ObjectId } from "bson";
import Chat from "../../models/chatSchema.js";
import moment from "moment-timezone";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { AdminWallet } from "../../models/adminWallet.js";

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
                    // Step 4: Store the start time of the chat session
                    chatStartTimes[chatRoomId] = Date.now();

                    // Step 5: Fetch user and astrologer details
                    const user = await User.findById(userId);
                    const astrologer = await Astrologer.findById(astrologerId);

                    if (!user || !astrologer) {
                        socket.emit('error', 'User or astrologer not found.');
                        return;
                    }

                    const minuteCost = astrologer.pricePerChatMinute;
                    const chat_commission = astrologer.chatCommission;

                    // Step 6: Check user's wallet balance
                    if (user.walletBalance < minuteCost) {
                        socket.emit('warning', 'Your balance is low. Please recharge your wallet');
                        setTimeout(async () => {
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
                        }, 60000); // Wait for 1 minute before forcibly ending the session
                    } else {
                        // Deduct the cost for 1 minute
                        user.walletBalance -= minuteCost;
                        await user.save();

                        // Increment astrologer's wallet balance
                        astrologer.walletBalance += minuteCost - chat_commission;
                        await astrologer.save();



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

                    const chat = Chat.findOne({ chatRoomId })
                    const totalDuration = chat.duration
                    const astrologer = Astrologer.findOne({ astrologerId })
                    const minuteCost = astrologer.pricePerChatMinute;
                    const chat_commission = astrologer.chatCommission;

                    // Calculate the total amounts
                    const userAmount = minuteCost * totalDuration;
                    const astrologerAmount = (minuteCost - chat_commission) * totalDuration;
                    // Log the transaction
                    if (totalDuration !== "Not Started") {
                        const userTransaction = new Wallet({
                            user_id: userId,
                            amount: userAmount,
                            transaction_id: `TXN-+${chatRoomId}+${Date.now()}`,
                            transaction_type: 'debit',
                            debit_type: 'chat',
                            service_reference_id: chatRoomId,
                        });
                        await userTransaction.save();

                        const astrologerTransaction = new Wallet({
                            user_id: astrologerId,
                            amount: astrologerAmount,
                            transaction_id: `TXN-+${chatRoomId}+${Date.now()}`,
                            transaction_type: 'credit',
                            credit_type: 'chat',
                            service_reference_id: chatRoomId,
                        });
                        await astrologerTransaction.save();

                        const admin_wallet = new AdminWallet({
                            amount: chat_commission * totalDuration,
                            transaction_id: `TXN-+${chatRoomId}+${Date.now()}`,
                            transaction_type: 'credit',
                            credit_type: 'chat',
                            service_reference_id: chatRoomId,
                        });
                        await admin_wallet.save();
                    }
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
        socket.on('sendMessage', async ({ message, senderId, chatRoomId, senderType }) => {
            try {

                const chatMessage = {
                    senderType: senderType,
                    senderId: ObjectId.createFromHexString(senderId),
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