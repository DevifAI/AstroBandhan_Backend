import { asyncHandler } from "../../utils/asyncHandler.js";
import { chat_with_ai_astro } from "../../utils/chat_with_ai_astro.js";
import { AI_Astro_Chat } from "../../models/ai_astro_chat.model.js"
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AI_Astrologer } from "../../models/ai_astrologer_model.js";


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


export const fetch_all_ai_astrologers = asyncHandler(async (req, res) => {
    try {
        // Fetch all astrologers from the database
        const astrologers = await AI_Astrologer.find({isVerified: true});

        // Check if any records were fetched
        if (!astrologers || astrologers.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "No astrologers found."));
        }

        // Return the list of astrologers
        return res.json(new ApiResponse(200, astrologers, "Astrologers fetched successfully."));

    } catch (error) {
        console.error("Error fetching astrologers:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch astrologers."));
    }
});

