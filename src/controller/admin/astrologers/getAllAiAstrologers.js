import { AI_Astrologer } from "../../../models/ai_astrologer_model.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const fetch_all_ai_astrologers_admin = asyncHandler(async (req, res) => {
    try {
        // Fetch all astrologers from the database
        const astrologers = await AI_Astrologer.find({});

        // Check if any records were fetched
        if (!astrologers || astrologers.length === 0) {
            return res.status(200).json(new ApiResponse(404, null, "No astrologers found."));
        }

        // Return the list of astrologers
        return res.json(new ApiResponse(200, astrologers, "Astrologers fetched successfully."));

    } catch (error) {
        console.error("Error fetching astrologers:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch astrologers."));
    }
});
