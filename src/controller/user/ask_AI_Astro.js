import { asyncHandler } from "../../utils/asyncHandler.js";
import { chat_with_ai_astro } from "../../utils/chat_with_ai_astro.js";
import { ai_astro_chat } from "../../models/ai_astro_chat.model.js"
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
    const { question, astrologyType, userId } = req.body;
    if (!question || !astrologyType || !userId) {
        return res.status(400).json({ error: "Please provide question, astrology type, language and User Information." });
    }

    const userDetails = await getUserDetails(userId);

    if (!userDetails) {
        return "User not found.";
    }




    const answer = await chat_with_ai_astro(question, astrologyType, userDetails);

    // Save chat in MongoDB
    const chatRecord = new ai_astro_chat({
        question,
        answer,
        astrologyType,
        userId
    });

    try {
        await chatRecord.save();
       
        return res.json(new ApiResponse(200, answer, "Chat record saved successfully."));
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


        const user_chats = await ai_astro_chat.find({ userId })
            .skip(skip)
            .limit(limit);

        // Check if any records were fetched
        if (!user_chats || user_chats.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Chat record not found."));
        }



        // sendNotificationToUser(userId, 'You have successfully fetched chats of AI!'); // Send notification t
        // Optional: Get total count for pagination info
        const totalRecords = await ai_astro_chat.countDocuments({ userId });
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
