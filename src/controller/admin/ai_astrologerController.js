import AI_Astrologer from '../../models/ai_astrologer_model';
import { ApiResponse } from '../../utils/apiResponse';

// Controller to add a new astrologer
export const addAstrologer = async (req, res) => {
    try {
        const { name, experience, specialities, languages, pricePerCallMinute, pricePerChatMinute, gender } = req.body;

        const astrologer = new AI_Astrologer({
            name,
            experience,
            specialities,
            languages,
            pricePerCallMinute,
            pricePerChatMinute,
            gender,
        });

        await astrologer.save();
        return res.status(200).json(new ApiResponse(404, astrologer, "Astrologer added successfully"));
    } catch (error) {
        return res.status(400).json(new ApiResponse(404, error.message, "Error adding astrologer"));
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
            return res.status(400).json(new ApiResponse(200, {}, "Astrologer not found"));
        }
        return res.status(200).json(new ApiResponse(404, updatedAstrologer, "Astrologer updated successfully"));
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
            return res.status(200).json(new ApiResponse(404, {}, "Astrologer not found"));
        }
        return res.status(200).json(new ApiResponse(200, astrologer, "Astrologer deleted successfully"));
    } catch (error) {
        return res.status(400).json(new ApiResponse(404, error.message, "Error deleting astrologer"));
    }
};
