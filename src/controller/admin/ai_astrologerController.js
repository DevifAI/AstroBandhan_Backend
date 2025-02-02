
import { ApiResponse } from '../../utils/apiResponse.js';
import { AI_Astrologer } from '../../models/ai_astrologer_model.js';

// Controller to add a new astrologer
export const addAstrologer = async (req, res) => {
    const { name, experience, specialities, pricePerChatMinute, gender, avatar, rating, isVerified, isFeatured, isAvailable
    } = req.body;
    experience

    // Input validation (optional but good practice)
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (experience < 0) missingFields.push("experience");
    if (!specialities) missingFields.push("specialities");
    if (!pricePerChatMinute) missingFields.push("pricePerChatMinute");
    if (!gender) missingFields.push("gender");

    if (missingFields.length > 0) {
        return res.status(400).json(
            new ApiResponse(400, {}, `The following fields are required: ${missingFields.join(", ")}`)
        );
    }

    try {
        // Check if the astrologer already exists by name
        const existingAstrologer = await AI_Astrologer.findOne({ name });

        if (existingAstrologer) {
            return res.status(400).json(new ApiResponse(400, {}, "Astrologer with this name already exists"));
        }

        // Create and save the new astrologer
        const astrologer = new AI_Astrologer({
            name,
            experience: Number(experience),
            specialities,

            pricePerChatMinute: Number(pricePerChatMinute),
            gender,
            avatar,
            isVerified,
            isFeatured,
            isAvailable,
            rating: Number(rating),

        });

        await astrologer.save();

        // Send a successful response with the created astrologer data
        return res.status(200).json(new ApiResponse(200, astrologer, "Astrologer added successfully"));
    } catch (error) {
        // Handle unexpected errors
        console.error('Error adding astrologer:', error); // For debugging purposes (logging error on server side)
        return res.status(500).json(new ApiResponse(500, error.message, "Error adding astrologer"));
    }
};

// Controller to edit an astrologer's details
export const editAstrologer = async (req, res) => {
    try {
        const { astrologerId } = req.params;
        const {
            name,
            experience,
            specialities,

            pricePerChatMinute,
            gender,
            isVerified,
            isFeatured,
            avatar,
            isAvailable,
        } = req.body;

        // Find the astrologer first
        const astrologer = await AI_Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json(new ApiResponse(404, {}, "Astrologer not found"));
        }

        console.log({ isAvailable }); // Log the value of isAvailable from the request body
        console.log(astrologer.isAvailable); // Log the current value of isAvailable in the database

        // Update only fields that exist in the request body
        if (name) astrologer.name = name;
        if (experience !== undefined) astrologer.experience = experience;
        if (specialities) astrologer.specialities = specialities;

        // ✅ Explicitly check if isAvailable is present in req.body (including false)
        if (req.body.hasOwnProperty("isAvailable")) {
            astrologer.isAvailable = isAvailable;
        }

        if (pricePerChatMinute !== undefined) astrologer.pricePerChatMinute = parseFloat(pricePerChatMinute);
        if (gender) astrologer.gender = gender;

        // ✅ Explicitly check if isVerified is present in req.body (including false)
        if (req.body.hasOwnProperty("isVerified")) {
            astrologer.isVerified = isVerified;
        }

        // ✅ Explicitly check if isFeatured is present in req.body (including false)
        if (req.body.hasOwnProperty("isFeatured")) {
            astrologer.isFeatured = isFeatured;
        }

        if (avatar) astrologer.avatar = avatar;

        // Save the updated astrologer
        const updatedAstrologer = await astrologer.save();

        console.log("Updated Astrologer:", updatedAstrologer);
        return res.status(200).json(new ApiResponse(200, updatedAstrologer, "Astrologer updated successfully"));
    } catch (error) {
        console.error("Update Error:", error);
        return res.status(400).json(new ApiResponse(400, error.message, "Error updating astrologer"));
    }
};


// Controller to delete an astrologer
export const deleteAstrologer = async (req, res) => {
    try {
        const { astrologer_ai_id } = req.body;
        if (!astrologer_ai_id) {
            return res.status(200).json(new ApiResponse(404, {}, "Astrologer Id not found"));

        }

        const astrologer = await AI_Astrologer.findByIdAndDelete(astrologer_ai_id);

        if (!astrologer) {
            return res.status(200).json(new ApiResponse(200, {}, "Astrologer not found"));
        }
        return res.status(200).json(new ApiResponse(200, astrologer, "Astrologer deleted successfully"));
    } catch (error) {
        return res.status(400).json(new ApiResponse(404, error.message, "Error deleting astrologer"));
    }
};
