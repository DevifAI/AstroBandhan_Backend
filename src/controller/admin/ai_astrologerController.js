
import { ApiResponse } from '../../utils/apiResponse.js';
import { AI_Astrologer } from '../../models/ai_astrologer_model.js';

// Controller to add a new astrologer
export const addAstrologer = async (req, res) => {
    const { name, experience, specialities,  pricePerCallMinute, pricePerChatMinute, gender } = req.body;

    // Input validation (optional but good practice)
    if (!name || !experience || !specialities || !pricePerCallMinute || !pricePerChatMinute || !gender) {
        return res.status(400).json(new ApiResponse(400, {}, "All fields are required."));
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
            experience,
            specialities,
            pricePerCallMinute,
            pricePerChatMinute,
            gender,
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
        const { name, experience, specialities, languages, pricePerCallMinute, pricePerChatMinute, gender, isVerified, isFeatured } = req.body;

        const updatedAstrologer = await AI_Astrologer.findByIdAndUpdate(
            astrologerId,
            {
                name,
                experience,
                specialities,
                languages,
                pricePerCallMinute,
                pricePerChatMinute,
                gender,
                isVerified,
                isFeatured,
            },
            { new: true }
        );

        if (!updatedAstrologer) {
            return res.status(200).json(new ApiResponse(200, {}, "Astrologer not found"));
        }
        return res.status(200).json(new ApiResponse(200, updatedAstrologer, "Astrologer updated successfully"));
    } catch (error) {
        return res.status(400).json(new ApiResponse(404, error.message, "Error updating astrologer"));


    }
};

// Controller to delete an astrologer
export const deleteAstrologer = async (req, res) => {
    try {
        const { astrologerId } = req.params;

        const astrologer = await AI_Astrologer.findByIdAndDelete(astrologerId);

        if (!astrologer) {
            return res.status(200).json(new ApiResponse(200, {}, "Astrologer not found"));
        }
        return res.status(200).json(new ApiResponse(200, astrologer, "Astrologer deleted successfully"));
    } catch (error) {
        return res.status(400).json(new ApiResponse(404, error.message, "Error deleting astrologer"));
    }
};
