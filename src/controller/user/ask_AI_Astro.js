import { asyncHandler } from "../../utils/asyncHandler.js";
import { chat_with_ai_astro } from "../../utils/chat_with_ai_astro.js";
import { AI_Astro_Chat } from "../../models/AI_Astro_Chat.model.js"
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";

// import { sendNotificationToUser } from "../../utils/sockets/sendNotifications.js";



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
    const { question, astrologyType, userId, astroId, isFreeChat, isChatEnded } = req.body;

    // Validate required fields
    if (!question || !astrologyType || !userId || !astroId || isFreeChat === undefined || isChatEnded === undefined) {
        return res.status(400).json({
            error: "Please provide question, astrology type, userId, astroId, isFreeChat, and isChatEnded."
        });
    }

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
    const answer = await chat_with_ai_astro(question, astrologyType, userDetails);

    try {
        // Find existing chat document for this user and astrologer
        let chatRecord = await AI_Astro_Chat.findOne({
            aiAstroId: astroId,
            userId: userId,
        });

        const currentTime = new Date();
        const currentTimestamp = Math.ceil(currentTime / 60000); // Get current timestamp in minutes

        if (chatRecord) {
            // If chat record exists, update it
            if (!chatRecord.isChatStarted) {
                // If chat hasn't started, mark it as started and set the start time
                chatRecord.isChatStarted = true;
                chatRecord.startTime = currentTimestamp;
            }

            // Add the new message to the messages array
            chatRecord.messages.push({
                question,
                answer,
                timestamp: currentTime,
            });

            // // Handle periodic deduction if the chat hasn't ended yet
            // if (chatRecord.isChatStarted && !chatRecord.isChatEnded && !isFreeChat) {
            //     const duration = Math.ceil((currentTimestamp - chatRecord.startTime));

            //     // Deduct the amount every minute
            //     const totalAmount = astroDetails.pricePerChatMinute * duration;
            //     const user = User.findById(userId)
            //     user.wallet -= 
            //     // Deduct from user wallet and add to astrologer wallet
            //     await deductFromUserWallet(userId, totalAmount);
            //     await addToAstroWallet(astroId, totalAmount);

            //     // Schedule the deduction every minute
            //     if (!chatRecord.deductionTimer) {
            //         chatRecord.deductionTimer = setInterval(async () => {
            //             // Update duration
            //             const updatedDuration = Math.ceil((currentTimestamp - chatRecord.startTime));
            //             const updatedAmount = astroDetails.pricePerChatMinute * updatedDuration;

            //             // Deduct and add the money
            //             await deductFromUserWallet(userId, astroDetails.pricePerChatMinute);
            //             await addToAstroWallet(astroId, astroDetails.pricePerChatMinute);
            //         }, 60000); // Execute every minute
            //     }
            // }

            // If the chat has ended, stop the deduction timer and update duration
            if (isChatEnded) {
                // Calculate duration in minutes (round up)
                const duration = Math.ceil((currentTimestamp - chatRecord.startTime));
                chatRecord.duration = duration;
                chatRecord.isChatEnded = true;

                // Clear the deduction interval
                if (chatRecord.deductionTimer) {
                    clearInterval(chatRecord.deductionTimer);
                    chatRecord.deductionTimer = null;
                }

                // Handle wallet deductions if not a free chat
                if (!isFreeChat) {
                    const totalAmount = astroDetails.pricePerChatMinute * duration;
                    await deductFromUserWallet(userId, totalAmount);
                    await addToAstroWallet(astroId, totalAmount);
                }
            }

            // Save the updated chat record
            await chatRecord.save();
            return res.json(new ApiResponse(200, answer, "Message added to existing chat."));
        } else {
            // If no existing chat, create a new one
            const newChatRecord = new AI_Astro_Chat({
                aiAstroId: astroId,
                userId,
                messages: [{ question, answer }],
                amount: isFreeChat ? 0 : astroDetails.pricePerChatMinute,
                isChatStarted: true,
                startTime: currentTimestamp,
                isChatEnded,
                duration: isChatEnded ? 0 : undefined,  // Set 0 duration for initial chat
            });

            // Handle money deduction if it's not a free chat
            if (!isFreeChat) {
                const duration = 1; // Initial duration for the first minute
                const totalAmount = astroDetails.pricePerChatMinute * duration;
                await deductFromUserWallet(userId, totalAmount);
                await addToAstroWallet(astroId, totalAmount);
            }

            await newChatRecord.save();
            return res.json(new ApiResponse(200, answer, "New chat record created successfully."));
        }
    } catch (error) {
        console.error("Error saving chat to MongoDB:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to save chat record."));
    }
});



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
