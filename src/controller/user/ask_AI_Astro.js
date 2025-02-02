import { asyncHandler } from "../../utils/asyncHandler.js";
import { chat_with_ai_astro } from "../../utils/chat_with_ai_astro.js";
import { AI_Astro_Chat } from "../../models/ai_astro_chat.model.js"
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AI_Astrologer } from "../../models/ai_astrologer_model.js";
import moment from "moment-timezone";

// import { sendNotificationToUser } from "../../utils/sockets/sendNotifications.js";

export const deductFromUserWallet = async (userId, amount) => {
    try {
        // Fetch the user by ID
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        // Check if the user has sufficient balance
        if (user.walletBalance < amount) {
            throw new Error("Insufficient wallet balance.");
        }

        // Deduct the amount
        user.walletBalance -= amount;

        // Save the updated user data
        await user.save();

        return new ApiResponse(200, user, "Amount successfully deducted from wallet.");
    } catch (error) {
        console.error("Error deducting from wallet:", error);
        throw new Error(error.message || "Failed to deduct wallet balance.");
    }
};

export const addToAstroWallet = async (userId, amount) => {
    try {
        if (amount <= 0) {
            throw new Error("Amount must be greater than zero.");
        }

        const user = await User.findById(userId);

        if (!user) {
            return new ApiResponse(404, "User not found.");
        }

        user.walletBalance += amount;
        await user.save();

        return new ApiResponse(200, "Amount successfully added to astro wallet.");
    } catch (error) {
        console.error("Error adding to astro wallet:", error);
        return new ApiResponse(500, "Failed to add amount to astro wallet.");
    }
};

async function getUserDetails(userId) {
    try {
        const user = await User.findById(userId).select('dateOfBirth timeOfBirth name placeOfBirth'); // Fetch dateofbirth and timeofbirth
        return user; // Return the user details (you can customize this based on what is returned)
    } catch (error) {
        console.error("Error fetching user details:", error);
        return null;
    }
}

export const ask_ai_astro = asyncHandler(async (req, res) => {
    const { question, userId, astroId, isFreeChat, isChatEnded } = req.body;
    console.log(req.body);

    // Fetch user details
    const userDetails = await getUserDetails(userId);
    if (!userDetails) {
        return res.status(404).json({ error: "User not found." });
    }

    // Get astrologer details
    const astroDetails = await AI_Astrologer.findById(astroId);
    if (!astroDetails) {
        return res.status(404).json({ error: "Astrologer not found." });
    }

    // Get AI-generated answer
    let answer = null;
    if (question) {
        answer = await chat_with_ai_astro(question, "vedic", userDetails);
    }

    try {
        // Find existing chat document
        let chatRecord = await AI_Astro_Chat.findOne({
            aiAstroId: astroId,
            userId: userId,
        });

        const currentTime = new Date();
        const currentTimeString = currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        if (chatRecord) {
            if (!chatRecord.isChatStarted) {
                chatRecord.isChatStarted = true;
                chatRecord.startTime = currentTimeString;
                chatRecord.duration = "1 minute";
            } else {
                // Calculate duration in minutes
                const startTime = new Date(chatRecord.createdAt);
                const elapsedMinutes = Math.ceil((currentTime - startTime) / 60000);
                chatRecord.duration = `${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"}`;
            }

            if (question && answer) {
                chatRecord.messages.push({ question, answer, timestamp: currentTime });
            }

            if (isChatEnded) {
                chatRecord.isChatEnded = true;
            }

            await chatRecord.save();
            return res.json(new ApiResponse(200, answer, "Message added to existing chat."));
        } else {
            // Create new chat record
            const newChatRecord = new AI_Astro_Chat({
                aiAstroId: astroId,
                userId,
                messages: [{ question, answer, timestamp: currentTime }],
                amount: isFreeChat ? 0 : astroDetails.pricePerChatMinute,
                isChatStarted: true,
                startTime: currentTimeString,
                duration: "1 minute",
                isChatEnded,
            });

            await newChatRecord.save();
            return res.json(new ApiResponse(200, answer, "New chat record created successfully."));
        }
    } catch (error) {
        console.error("Error saving chat to MongoDB:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to save chat record."));
    }
});



// Helper function to format time as "10:44 AM"
const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

// Helper function to calculate duration as "HH:MM"
const calculateDuration = (startTime, endTime) => {
    const durationInMilliseconds = endTime - startTime;
    const durationInMinutes = Math.floor(durationInMilliseconds / (1000 * 60));
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};



export const fetch_ai_astro_chat = asyncHandler(async (req, res) => {
    const { userId, page, size } = req.body;

    if (!userId) {
        return res.status(400).json(new ApiResponse(400, null, "Please provide User Information."));
    }

    const limit = parseInt(size); // Number of records per page
    const skip = (parseInt(page) - 1) * limit; // Number of records to skip

    try {


        const user_chats = await AI_Astro_Chat.find({ userId })
            .skip(skip)
            .limit(limit);

        // Check if any records were fetched
        if (!user_chats || user_chats.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Chat record not found."));
        }



        // sendNotificationToUser(userId, 'You have successfully fetched chats of AI!'); // Send notification t
        // Optional: Get total count for pagination info
        const totalRecords = await AI_Astro_Chat.countDocuments({ userId });
        const totalPages = Math.ceil(totalRecords / limit);

        return res.json(new ApiResponse(200, {
            user_chats,
            pagination: {
                currentPage: parseInt(page),
                pageSize: limit,
                totalRecords,
                totalPages
            }
        }, "Chat record fetched successfully."));
    } catch (error) {
        console.error("Error fetching chat record:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch chat record."));
    }
});

export const toggleFreeChat = asyncHandler(async (req, res) => {
    const { userId, isFreeChat } = req.body;
    console.log({ userId, isFreeChat });
    if (!userId || isFreeChat === undefined) {
        return res.status(400).json(new ApiResponse(400, null, "Please provide UserId and isFreeChat value."));
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found."));
        }

        user.Free_Chat_Available = isFreeChat;
        await user.save();

        return res.json(new ApiResponse(200, user, "User FreeChat status updated."));
    } catch (error) {
        console.error("Error updating FreeChat status:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to update FreeChat status."));
    }
});
