import { ObjectId } from 'bson';
import ChatRoom from '../../models/chatRoomSchema.js'; // ChatRoom model
import Chat from '../../models/chatSchema.js'; // Chat message model
import { generateChatRoomId } from '../assistingFunction.js';


// Function to check if the astrologer is available for a new chat room
export const getAstrologerStatus = async (astrologerId) => {
    try {

        console.log('Astrologer ID:', astrologerId);
        console.log('ObjectId:', ObjectId.createFromHexString(astrologerId));
        // Validate astrologerId
        if (!ObjectId.isValid(astrologerId)) {
            throw new Error('Invalid astrologer ID');
        }

        // Create ObjectId using createFromHexString (for valid hexadecimal strings)
        const astrologerObjectId = ObjectId.createFromHexString(astrologerId);

        // Query the database
        const chatRoom = await ChatRoom.findOne({ astrologer: astrologerObjectId, status: 'active' });


        // Return a boolean value indicating if an active chat room is found
        return !!chatRoom;
    } catch (error) {
        console.error('Error finding astrologer status:', error);
        throw error;
    }
};

// Function to check if the user is in an active chat room
export const getUserStatus = async (userId) => {
    try {


        // Validate astrologerId
        if (!ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID');
        }

        // Create ObjectId using createFromHexString (for valid hexadecimal strings)
        const userObjectId = ObjectId.createFromHexString(userId);

        // Query the database
        const chatRoom = await ChatRoom.findOne({ user: userObjectId, status: 'active' });
        console.log({ chatRoom });

        // Return a boolean value indicating if an active chat room is found
        return !!chatRoom;
    } catch (error) {
        console.error('Error finding astrologer status:', error);
        throw error;
    }
};

export const joinChatRoom = async (userId, astrologerId, chatRoomId, hitBy) => {
    
    const chatRoom = await ChatRoom.findOne({
        chatRoomId: chatRoomId,  // Check for the provided chatRoomId
        user: ObjectId.createFromHexString(userId),            // Convert userId to ObjectId
        astrologer: ObjectId.createFromHexString(astrologerId),            // Convert userId to ObjectId
        status: 'active'         // Ensure the chat room status is 'active'
    });

    if (chatRoom) {
        // Update the 'isUserJoined' or 'isAstrologerJoined' field based on the 'hitBy' value
        if (hitBy === 'astrologer') {
            // If hitBy is 'astrologer' and astrologer is null, update the astrologerId
            chatRoom.astrologer = ObjectId.createFromHexString(astrologerId);
            chatRoom.isAstrologerJoined = true; // Mark astrologer as joined
        } else if (hitBy === 'user') {
            chatRoom.isUserJoined = true; // Mark user as joined
        }

        // Save the updated chat room
        await chatRoom.save();

        return true;
    } else {
        // No matching chat room found
        return false;
    }
};

// Function to create a new chat room or notify if astrologer or user is busy
// export const joinChatRoom = async (userId, astrologerId, chatRoomId, hitBy) => {
//     const chatRoom = await ChatRoom.findOne({
//         chatRoomId: chatRoomId,  // Check for the provided chatRoomId
//         user: ObjectId.createFromHexString(userId),            // Convert userId to ObjectId
//         status: 'active'         // Ensure the chat room status is 'active'
//     });

//     if (chatRoom) {
//         // Update the 'isUserJoined' or 'isAstrologerJoined' field based on the 'hitBy' value
//         if (hitBy === 'astrologer' && chatRoom.astrologer === null) {
//             // If hitBy is 'astrologer' and astrologer is null, update the astrologerId
//             chatRoom.astrologer = ObjectId.createFromHexString(astrologerId);
//             chatRoom.isAstrologerJoined = true; // Mark astrologer as joined
//         } else if (hitBy === 'user') {
//             chatRoom.isUserJoined = true; // Mark user as joined
//         }

//         // Save the updated chat room
//         await chatRoom.save();
        
//         return true;
//     } else {
//         // No matching chat room found
//         return false;
//     }
// };

// Function to create a new chat room
// Function to create a new chat room or notify if astrologer or user is busy
export const createChatRoom = async (userId, role, astrologerId) => {
    try {
        let room;

        // If the role is 'user', check if the user is already in an active chat
        if (role === 'user') {
            const userInActiveChat = await getUserStatus(userId);
            if (userInActiveChat) {
                return { success: false, message: 'You are already in another chat. Please finish that session first.' };
            }

            // Check if the astrologer is available
            const astrologerAvailable = await getAstrologerStatus(astrologerId);
            if (astrologerAvailable) {
                return { success: false, message: 'The astrologer is currently in another chat. Please wait.' };
            }

            // Generate a random 16-character chat room ID
            const chatRoomId = generateChatRoomId();

            // Create a new chat room for the user and assign the astrologer
            room = new ChatRoom({
                user: userId,  // Only one user in the chat room
                astrologer: astrologerId,  // Assign the astrologer to the chat room
                status: 'active',
                isUserJoined: true,
                isAstrologerJoined: false,
                chatRoomId: chatRoomId  // Store the generated chat room ID
            });
        } else {
            return { success: false, message: 'Invalid role specified.' };
        }

        // Save the chat room to the database
        await room.save();

        // Return the success response with the generated chat room ID
        return { success: true, chatRoomId: room.chatRoomId,astrologerId: astrologerId,userId: userId };  // Return the generated chatRoomId

    } catch (error) {
        console.error("Error creating chat room:", error);
        return { success: false, message: 'An error occurred while creating the chat room.' };
    }
};



// Function to save a chat message to the database
export const saveChatMessage = async ({ senderType, senderId, message, chatRoomId }) => {
    const newMessage = new Chat({
        senderType,
        senderId,
        message,
        chatRoomId
    });

    await newMessage.save();
    return newMessage;
};


export const deductMoney = async ({ userId, astrologerId }) => {

}

