import { Astrologer } from "../../models/astrologer.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const findAstrologerByVerified = asyncHandler(async (req, res, next) => {
    const { isVerified } = req.body;
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const size = parseInt(req.query.size) || 10; // Default to size 10 if not specified
    // Check if isVerified is provided in the payload
    if (typeof isVerified === 'undefined') {
        return res.status(400).json(new ApiResponse(400, null, "isVerified field is required."));
    }

    try {
        // Calculate the number of documents to skip
        const skip = (page - 1) * size;

        // Find astrologers based on the isVerified status with pagination
        const astrologers = await Astrologer.find({ isVerified })
            .skip(skip)
            .limit(size);

        // Get total count of astrologers with the given isVerified status
        const totalAstrologers = await Astrologer.countDocuments({ isVerified });

        // Create a success response using ApiResponse
        return res.status(200).json(
            new ApiResponse(200, {
                astrologers,
                total: totalAstrologers,
                page,
                size,
                totalPages: Math.ceil(totalAstrologers / size),
            }, `Found ${astrologers.length} astrologer(s) with isVerified status: ${isVerified}`)
        );
    } catch (error) {
        console.error("Error finding astrologers:", error);
        return res.status(500).json(new ApiResponse(500, null, "An error occurred while retrieving astrologers."));
    }
});
