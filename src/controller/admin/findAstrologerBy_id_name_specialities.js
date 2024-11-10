import mongoose from "mongoose";
import { Astrologer } from "../../models/astrologer.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Controller function to fetch astrologers by specialty, id, or name from the payload
export const getAstrologers = asyncHandler(async (req, res) => {
    try {
        const { speciality, id, name } = req.body;  // Get parameters from the body

        // Build query object based on provided parameters
        let query = {};

        // Search by specialty if provided
        if (speciality) {
            query.specialities = { $in: [new RegExp(speciality, 'i')] };
        }

        // If id is provided, convert it to ObjectId (MongoDB's default type for _id)
        if (id) {
            if (mongoose.Types.ObjectId.isValid(id)) {
                query._id = id;  // Use _id for searching
            } else {
                return res.status(400).json(new ApiResponse(400, null, "Invalid ID format."));
            }
        }

        // Search by name (case-insensitive) if provided
        if (name) {
            query.name = new RegExp(name, 'i');  // Case-insensitive search for name
        }

        // Fetch astrologers from the database
        const astrologers = await Astrologer.find(query); // Only return id, name, and specialty fields

        if (astrologers.length === 0) {
            return res.status(400).json(new ApiResponse(400, null, "No astrologers found"));

        }

        return res.status(400).json(new ApiResponse(200, astrologers, `Total Astrologers found : ${astrologers.length}`));
    } catch (error) {
        console.error(error);
        return res.status(400).json(new ApiResponse(400, null, "Server error while fetching astrologers."));
    }
})
