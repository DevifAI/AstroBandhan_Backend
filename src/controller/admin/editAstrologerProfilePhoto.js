
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import fs from "fs";

export const editProfilePhoto = asyncHandler(async (req, res) => {
    const { astrologerId } = req.params;

    try {
        // Find the astrologer by ID
        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json(new ApiResponse(404, null, "Astrologer not found."));
        }

        // Check if a new avatar file is provided
        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, null, "Please upload a profile photo."));
        }

        const avatarLocalPath = req.file.path;

        // Upload new avatar to Cloudinary
        let avatarUrl;
        try {
            const uploadResult = await uploadOnCloudinary(avatarLocalPath);
            avatarUrl = uploadResult.url;

            // Delete the locally saved file after successful upload
            fs.unlinkSync(avatarLocalPath);
        } catch (error) {
            console.log(error)
            return res.status(500).json(new ApiResponse(500, null, "Failed to upload photo."));
        }

        // Update the astrologer's avatar URL
        astrologer.avatar = avatarUrl;
        await astrologer.save();

        return res.status(200).json(new ApiResponse(200, astrologer, "Profile photo updated successfully."));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "An error occurred while updating the profile photo."));
    }
});