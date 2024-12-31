import {asyncHandler} from '../../utils/asyncHandler.js';
import PendingAstrologerRequest from '../../models/pendingAstrologerRequest.js';
import {ApiResponse} from '../../utils/apiResponse.js';  // Assuming ApiResponse is a custom class for standardizing responses

// Controller to add a new pending astrologer request
export const addPendingAstrologerRequest = asyncHandler(async (req, res) => {
  const { name, gender, phoneNumber, experience, city, state, language, bio } = req.body;

  // Check if all required fields are present
  if (!name || !gender || !phoneNumber || !experience || !city || !state || !language || !bio) {
    return res.status(400).json(new ApiResponse(400, null, "All fields are required."));
  }

  try {
    // Create a new astrologer request document
    const newAstrologerRequest = new PendingAstrologerRequest({
      name,
      gender,
      phoneNumber,
      experience,
      city,
      state,
      language,
      bio,
    });
    // Save the document to the database
    const savedRequest = await newAstrologerRequest.save();

    // Return success response
    return res.status(201).json(new ApiResponse(201, savedRequest, "Pending astrologer request added successfully."));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, null, "Server error while adding astrologer request."));
  }
});
