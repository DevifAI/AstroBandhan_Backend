import { Astrologer } from "../../models/astrologer.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const update_availability = asyncHandler(async (req, res) => {
    try {
        // Get astrologerId from the request parameters
        const { astrologerId } = req.params;

        // Get the fields to update from the request body
        const { isAvailable, isCallAvailable, isChatAvailable, isVideoCallAvailable } = req.body;

        // Find the astrologer by the given astrologerId
        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json(new ApiResponse(404, null, "Astrologer not found."));
        }

        // Update the availability fields if provided in the request body
        if (isAvailable !== undefined) astrologer.available.isAvailable = isAvailable;
        if (isCallAvailable !== undefined) astrologer.available.isCallAvailable = isCallAvailable;
        if (isChatAvailable !== undefined) astrologer.available.isChatAvailable = isChatAvailable;
        if (isVideoCallAvailable !== undefined) astrologer.available.isVideoCallAvailable = isVideoCallAvailable;

        // Save the updated astrologer document
        await astrologer.save();

        // Respond with success
        return res.status(200).json(new ApiResponse(200, astrologer, "Astrologer's availability updated successfully."));
    } catch (error) {
        console.error("Error updating astrologer availability:", error);
        return res.status(500).json(new ApiResponse(500, null, "An error occurred while updating availability."));
    }
});


