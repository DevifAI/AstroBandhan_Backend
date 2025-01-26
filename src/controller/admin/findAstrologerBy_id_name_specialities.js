import mongoose from "mongoose";
import { Astrologer } from "../../models/astrologer.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Controller function to fetch astrologers by specialty, id, or name from the payload
export const getAstrologers = asyncHandler(async (req, res) => {
    try {
        const { speciality, id, name, page = 1, limit = 10 } = req.query;  // Get parameters from the query

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

        // Count total number of astrologers matching the query (for pagination info)
        const totalAstrologers = await Astrologer.countDocuments(query);

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Get astrologers based on pagination and query
        const astrologers = await Astrologer.aggregate([
            { $match: query },  // Match query parameters
            { $skip: skip },     // Skip documents based on pagination
            { $limit: Number(limit) },   // Limit the results based on pagination
            {
                $addFields: {
                    // Add a 'tag' field based on 'isFeatured' flag
                    tag: {
                        $cond: {
                            if: { $eq: ["$isFeatured", true] },
                            then: {
                                $switch: {
                                    branches: [
                                        { case: { $gt: [{ $rand: {} }, 0.9] }, then: "Celebrity" },
                                        { case: { $gt: [{ $rand: {} }, 0.7] }, then: "Top Choice" },
                                        { case: { $gt: [{ $rand: {} }, 0.5] }, then: "Premium" },
                                        { case: { $gt: [{ $rand: {} }, 0.2] }, then: "Prime" },
                                    ],
                                    default: "Standard"  // Default tag for astrologers not falling into the above categories
                                }
                            },
                            else: "Regular"  // For non-featured astrologers
                        }
                    }
                }
            }
        ]);

        if (astrologers.length === 0) {
            return res.status(400).json(new ApiResponse(400, null, "No astrologers found"));
        }

        // Shuffle the astrologers array
        const shuffledAstrologers = astrologers.sort(() => Math.random() - 0.5);

        return res.status(200).json(new ApiResponse(200, {
            astrologers: shuffledAstrologers,
            total: totalAstrologers,
            page,
            totalPages: Math.ceil(totalAstrologers / limit),
        }, `Total Astrologers found: ${astrologers.length}`));
    } catch (error) {
        console.error(error);
        return res.status(400).json(new ApiResponse(400, null, "Server error while fetching astrologers."));
    }
});


export const editAstrologer_original = asyncHandler(async (req, res) => {
    const { _id, ...updateData } = req.body; // Extract _id and the rest of the payload

    // Validate the presence of _id
    if (!_id) {
        throw new ApiError(400, 'Astrologer ID is required');
    }

    // Check if the astrologer exists
    const existingAstrologer = await Astrologer.findById(_id);
    if (!existingAstrologer) {
        throw new ApiError(404, 'Astrologer not found');
    }

    // Validate and update the astrologer data
    const updatedAstrologer = await Astrologer.findByIdAndUpdate(
        _id,
        { $set: updateData }, // Use $set to update only the provided fields
        { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedAstrologer) {
        throw new ApiError(500, 'Failed to update astrologer');
    }

    // Send success response with the updated astrologer data
    res.status(200).json(
        new ApiResponse(200, updatedAstrologer, 'Astrologer updated successfully')
    );
});


export const deleteAstrologer_original = asyncHandler(async (req, res) => {
    const { astrologer_id } = req.body; // Extract _id from the request body

    // Validate the presence of _id
    if (!astrologer_id) {
        new ApiResponse(200, null, 'invalid astrologer details')
    }

    // Check if the astrologer exists
    const existingAstrologer = await Astrologer.findById(astrologer_id);
    if (!existingAstrologer) {
        new ApiResponse(200, null, 'Astrologer not foud')
    }

    // Delete the astrologer
    const deletedAstrologer = await Astrologer.findByIdAndDelete(astrologer_id);

    if (!deletedAstrologer) {
        new ApiResponse(200, null, 'Failed to deleted successfully')
    }

    // Send success response
    res.status(200).json(
        new ApiResponse(200, null, 'Astrologer deleted successfully')
    );
});


