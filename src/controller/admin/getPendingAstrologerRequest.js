import { asyncHandler } from '../../utils/asyncHandler.js';
import PendingAstrologerRequest from '../../models/pendingAstrologerRequest.js';
import { ApiResponse } from '../../utils/apiResponse.js';  // Assuming ApiResponse is a custom class for standardizing responses


export const getPendingAstrologerRequests = asyncHandler(async (req, res) => {
    const { page = 1, size = 10 } = req.query; // Default to page 1, size 10 if not provided
    const skip = (page - 1) * size; // Calculate the skip value for pagination
    const limit = parseInt(size, 10); // Limit value

    try {
        // Fetch pending astrologer requests with pagination, filtering by isApproved: false
        const pendingRequests = await PendingAstrologerRequest.find({ isApproved: false })
            .skip(skip)
            .limit(limit)
            .populate('languages', 'name'); // Populate 'languages' field with the 'name' from the languages collection

        const totalCount = await PendingAstrologerRequest.countDocuments({ isApproved: false });
        const totalPages = Math.ceil(totalCount / limit);

        // Format response with pagination info
        const response = {
            totalCount,
            totalPages,
            currentPage: page,
            requests: pendingRequests,
        };

        return res.status(200).json(new ApiResponse(200, response, "Pending astrologer requests fetched successfully."));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, null, "Server error while fetching pending astrologer requests."));
    }
});