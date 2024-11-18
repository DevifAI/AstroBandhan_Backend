import { Astrologer } from "../../models/astrologer.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateAstrologerFields = asyncHandler(async (req, res, next) => {
    const { astrologerId, ...fieldsToUpdate } = req.body;
    // Check if astrologerId is provided
    if (!astrologerId) {
        return res.status(400).json(new ApiResponse(400, null, "Astrologer ID is required."));
    }

    try {
        // Directly update fields provided in fieldsToUpdate
        const updateFields = {};

        // Add fields dynamically based on provided payload
        if (fieldsToUpdate.isVerified !== undefined) updateFields.isVerified = fieldsToUpdate.isVerified;
        if (fieldsToUpdate.isFeatured !== undefined) updateFields.isFeatured = fieldsToUpdate.isFeatured;
        if (fieldsToUpdate.pricePerCallMinute !== undefined) updateFields.pricePerCallMinute = fieldsToUpdate.pricePerCallMinute;
        if (fieldsToUpdate.pricePerChatMinute !== undefined) updateFields.pricePerChatMinute = fieldsToUpdate.pricePerChatMinute;
        if (fieldsToUpdate.experience !== undefined) updateFields.experience = fieldsToUpdate.experience;
        if (fieldsToUpdate.languages) updateFields.languages = fieldsToUpdate.languages;
        if (fieldsToUpdate.specialities) updateFields.specialities = fieldsToUpdate.specialities;

        // Update the astrologer with the specified ID
        const updatedAstrologer = await Astrologer.findByIdAndUpdate(
            astrologerId,
            { $set: updateFields },
            { new: true } // Return the updated document
        );

        // Check if astrologer was found and updated
        if (!updatedAstrologer) {
            return res.status(404).json(new ApiResponse(404, null, "Astrologer not found."));
        }

        // Return success response with updated astrologer data
        return res.status(200).json(
            new ApiResponse(200, updatedAstrologer, "Astrologer updated successfully.")
        );
    } catch (error) {
        // Handle any errors and return a 500 error response
        return res.status(500).json(new ApiResponse(500, null, "An error occurred while updating the astrologer."));
    }
});


