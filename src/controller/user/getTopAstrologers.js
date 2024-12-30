import { Astrologer } from '../../models/astrologer.model.js';
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getTrendingAstrologer = asyncHandler(async (req, res) => {
    try {
        const topAstrologer_Acc = await Astrologer.find({ isFeatured: true, 'available.isAvailable': true, isOffline: false });
        return res.status(200).json(
            new ApiResponse(200, topAstrologer_Acc, "Top astrologers retrieved successfully.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while retrieving top astrologers.")
        );
    }
});

export const getAutoSuggestAstrologer = asyncHandler(async (req, res) => {
    try {
        const topAstrologer_Acc = await Astrologer.find({ isFeatured: true, 'available.isAvailable': true, isOffline: false });

        // Shuffle the array and get the first 5 elements
        const randomAstrologers = topAstrologer_Acc.sort(() => 0.5 - Math.random()).slice(0, 5);

        return res.status(200).json(
            new ApiResponse(200, randomAstrologers, "Top astrologers retrieved successfully.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while retrieving top astrologers.")
        );
    }
});

