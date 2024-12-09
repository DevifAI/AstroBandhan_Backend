import { Server as socketIo } from "socket.io"; // Named import for socket.io
import { createChatRoom, deductMoney, joinChatRoom, saveChatMessage } from "./chatHelper.js";
import ChatRoom from "../../models/chatRoomSchema.js";
import { ObjectId } from "bson";
import Chat from "../../models/chatSchema.js";
import moment from "moment-timezone";
import { User } from "../../models/user.model.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { Wallet } from "../../models/walletSchema.model.js";

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
        socket.on('startChat', async ({ userId, role, astrologerId }) => {
            console.log({ astrologerId, userId, role })
            try {
                const result = await createChatRoom(userId, role, astrologerId);
                // console.log({ result })
                if (result.success) {
                    console.log(result.chatRoomId)
                    socket.join(result.chatRoomId); // Join the chat room
                    socket.emit('chatRoomCreated', result.chatRoomId); // Notify client that the room is created
                    if (!chatRoomParticipants[result.chatRoomId]) {
                        chatRoomParticipants[result.chatRoomId] = new Set(); // Initialize the set for new chat room
                    }
                    chatRoomParticipants[result.chatRoomId].add(userId);

                } else {
                    socket.emit('error', result.message); // Send error message if astrologer is busy
                }
            } catch (error) {
                console.error("Error starting chat:", error);
                socket.emit('error', 'An error occurred while starting the chat.');
            }
        });
        // Event for when a user wants to resume/join a chat
        socket.on('joinChat', async ({ userId, astrologerId, chatRoomId, hitBy }) => {
            console.log({ userId, astrologerId, chatRoomId, hitBy });

            const isJoinedChat = await joinChatRoom(userId, astrologerId, chatRoomId, hitBy);

            try {
                if (isJoinedChat) {
                    // Join the chat room
                    socket.join(chatRoomId);
                    socket.emit('chatRoomJoined', { chatRoomId, message: 'Successfully joined the chat room.' });

                    // Initialize participants if it's a new chat room
                    if (!chatRoomParticipants[chatRoomId]) {
                        chatRoomParticipants[chatRoomId] = new Set();
                    }
                    chatRoomParticipants[chatRoomId].add(astrologerId);
                    chatRoomParticipants[chatRoomId].add(userId);

                    // Track if both the user and astrologer are in the room
                    if (isAllUsersJoined(chatRoomId, userId, astrologerId)) {
                        console.log("Both users are in the chat room:", chatRoomParticipants);

                        // Store start time of the chat session for calculating time and deducting cost
                        chatStartTimes[chatRoomId] = Date.now();

                        // Create a new chat document
                        const newChat = new Chat({
                            chatRoomId,
                            duration: "0:00",  // Initially set duration to 0:00
                        });
                        await newChat.save();

                        // Deduct the cost for the first minute immediately
                        const user = await User.findById(userId);
                        const astrologer = await Astrologer.findById(astrologerId);

                        if (!user || !astrologer) {
                            console.error('User or astrologer not found.');
                            return;
                        }

                        const minuteCost = astrologer.pricePerChatMinute; // Assuming `pricePerMinute` is stored in astrologer schema

                        if (user.walletBalance < minuteCost) {
                            // Send a low balance warning and check after 1 minute
                            socket.emit('warning', 'Your balance is low. Please recharge before the next minute.');

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
                            // Deduct the cost for the first minute from the user
                            user.walletBalance -= minuteCost;
                            await user.save();

                            // Add the transaction for the user to the wallet
                            const userTransaction = new Wallet({
                                user_id: userId,
                                amount: minuteCost,
                                transaction_id: `TXN-${Date.now()}`, // Generate a unique transaction ID
                                amount_type: 'debit',
                                debit_type: 'chat',
                                chatRoomId: chatRoomId, // Link the transaction to the chat room
                            });
                            await userTransaction.save();

                            socket.emit('intervalMessage', { chatRoomId, message: `Deducted ${minuteCost} from user's wallet. Remaining balance: ${user.walletBalance}` });
                            console.log(`Deducted ${minuteCost} from user's wallet. Remaining balance: ${user.walletBalance}`);
                        }

                        // Increment the astrologer's wallet balance
                        astrologer.walletBalance += minuteCost;
                        await astrologer.save();

                        // Create a transaction for the astrologer
                        const astrologerTransaction = new Wallet({
                            user_id: astrologerId,
                            amount: minuteCost,
                            transaction_id: `TXN-${Date.now()}`, // Generate a unique transaction ID
                            amount_type: 'credit',
                            debit_type: 'chat',
                            chatRoomId: chatRoomId, // Link the transaction to the chat room
                        });
                        await astrologerTransaction.save();

                        console.log(`Added ${minuteCost} to astrologer's wallet. Total balance: ${astrologer.walletBalance}`);

                        // Start emitting every 1 minute
                        chatIntervals[chatRoomId] = setInterval(async () => {
                            try {
                                const currentTime = Date.now();
                                const startTime = chatStartTimes[chatRoomId];
                                const elapsedSeconds = Math.floor((currentTime - startTime) / 1000); // Elapsed time in seconds
                                const minutes = Math.floor(elapsedSeconds / 60); // Calculate the number of minutes
                                const seconds = elapsedSeconds % 60; // Calculate the remaining seconds

                                // Format the time in `minutes:seconds` format (e.g., 1:05 or 0:45)
                                const elapsedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

                                // Check if there's enough balance to deduct for the current minute
                                const user = await User.findById(userId); // Get user details
                                const astrologer = await Astrologer.findById(astrologerId); // Get astrologer details

                                if (!user || !astrologer) {
                                    console.error('User or astrologer not found.');
                                    return;
                                }

                                const minuteCost = astrologer.pricePerChatMinute; // Assuming `pricePerMinute` is stored in astrologer schema

                                if (user.walletBalance < minuteCost) {
                                    // Send a low balance warning before the last minute
                                    if (minutes >= (Math.floor((currentTime - chatStartTimes[chatRoomId]) / 60000) - 1)) {
                                        socket.emit('warning', 'Your balance is low. Please recharge before the next minute.');

                                        // After 1 minute, end the chat if balance is still low
                                        setTimeout(() => {
                                            if (user.walletBalance < minuteCost) {
                                                socket.emit('error', 'Insufficient balance. Chat session is ending.');
                                                socket.leave(chatRoomId); // Force leave the chat room
                                                // Update the chat session in the database to reflect the total duration
                                                Chat.findOneAndUpdate(
                                                    { chatRoomId },
                                                    { $set: { duration: elapsedTime } },
                                                    { new: true }
                                                );
                                                clearInterval(chatIntervals[chatRoomId]); // Stop the interval
                                            }
                                        }, 60000); // Wait for 1 more minute before forcibly ending the session
                                    }
                                } else {
                                    // Deduct the cost for the current minute
                                    user.walletBalance -= minuteCost;
                                    await user.save();

                                    // Create a transaction for the user
                                    const userTransaction = new Wallet({
                                        user_id: userId,
                                        amount: minuteCost,
                                        transaction_id: `TXN-${Date.now()}`,
                                        amount_type: 'debit',
                                        debit_type: 'chat',
                                        chatRoomId: chatRoomId,
                                    });
                                    await userTransaction.save();

                                    // Add the cost to astrologer's wallet
                                    astrologer.walletBalance += minuteCost;
                                    await astrologer.save();

                                    // Create a transaction for the astrologer
                                    const astrologerTransaction = new Wallet({
                                        user_id: astrologerId,
                                        amount: minuteCost,
                                        transaction_id: `TXN-${Date.now()}`,
                                        amount_type: 'credit',
                                        debit_type: 'chat',
                                        chatRoomId: chatRoomId,
                                    });
                                    await astrologerTransaction.save();

                                    console.log(`Deducted ${minuteCost} from user's wallet and added to astrologer's wallet.`);

                                    // Update the chat duration in the database
                                    await Chat.findOneAndUpdate(
                                        { chatRoomId },
                                        { $set: { duration: elapsedTime } },
                                        { new: true }
                                    );
                                }

                                // Emit message periodically (every minute)
                                socket.emit('intervalMessage', { message: 'This is a periodic message from the server.' });

                            } catch (error) {
                                console.error("Error during interval message or money deduction:", error);
                                clearInterval(chatIntervals[chatRoomId]); // Stop the interval
                                socket.emit('error', 'An error occurred while processing the chat.');
                            }
                        }, 60000); // 1 minute interval for checking and deducting money

                    }
                } else {
                    socket.emit('error', 'Chat room not found or inactive.');
                }
            } catch (error) {
                console.error("Error joining chat:", error);
                socket.emit('error', 'An error occurred while joining the chat.');
            }
        });


        // Event for when a user wants to ends a chat
        socket.on('endChat', async ({ userId, astrologerId, chatRoomId }) => {
            console.log({ userId, astrologerId, chatRoomId });

            try {
                // Find the chat room and ensure the user/astrologer is part of it, then update status to 'inactive'
                const chatRoom = await ChatRoom.findOneAndUpdate(
                    {
                        _id: chatRoomId,
                        $or: [
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
                    socket.emit('chatEnded', { chatRoomId, message: 'Chat has ended.' });
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
        socket.on('sendMessage', async ({ message, chatRoomId }) => {
            try {
                const chatMessage = {
                    senderType: message[0].senderType,
                    senderId: ObjectId.createFromHexString(message[0].senderId),
                    message: message[0].message,
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
