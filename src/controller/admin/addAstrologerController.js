import bcrypt from 'bcrypt';
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { getDefaultLanguageId } from '../../utils/assistingFunction.js';
import { User } from '../../models/user.model.js';
import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import PendingAstrologerRequest from '../../models/pendingAstrologerRequest.js';
import { validatePhoneNumber } from '../../utils/validatePhoneNumber.js';

// Register Astrologer Controller
export const registerAstrologer = asyncHandler(async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      name,
      experience,
      specialities,
      languages,
      pricePerCallMinute,
      pricePerVideoCallMinute,
      pricePerChatMinute,
      gender,
      phone,
      password,
      isFeatured,
      isVerified,
      chatCommission,
      callCommission,
      videoCallCommission,
      available,  // directly destructure available object from the payload
    } = req.body;

    // Validate required fields
    if (!name || !experience || !pricePerCallMinute || !pricePerChatMinute || !phone || !password || !gender || !isFeatured || !isVerified || !available) {
      return res.status(201).json(new ApiResponse(201, null, "Please provide all required fields."));
    }

    // Check if astrologer already exists with the same phone number
    const existingAstrologer = await Astrologer.findOne({ phone });
    if (existingAstrologer) {
      return res.status(201).json(new ApiResponse(201, null, "Astrologer already registered with this phone number."));
    }

    // Check if phone number exists in User model
    const Check_Phone_Exist_In_User = await User.findOne({ phone });
    if (Check_Phone_Exist_In_User) {
      return res.status(201).json(new ApiResponse(201, null, "User already registered with this phone number."));
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(201).json(new ApiResponse(201, null, 'Invalid phone number format.'));
    }

    // Hash the password
    const saltRounds = 10;
    if (!password) {
      return res.status(400).json(new ApiResponse(400, null, "Password is required."));
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Default language (English) will be assigned if no languages are provided
    const languageId = languages && languages.length > 0 ? languages : [await getDefaultLanguageId()];
    
    const pendingRequest = await PendingAstrologerRequest.findOne({ phoneNumber: phone, isApproved: false });
    if (pendingRequest) {
      // Approve the pending astrologer request by calling the method
      await pendingRequest.updateOne({ isApproved: true });
      console.log("Pending astrologer request approved for phone number:", phone);
    }
    
    // Create a new astrologer document
    const newAstrologer = new Astrologer({
      name,
      experience,
      specialities,
      languages,
      pricePerCallMinute,
      pricePerVideoCallMinute,
      pricePerChatMinute,
      gender,
      phone,
      isFeatured,
      isVerified,
      chatCommission,
      callCommission,
      videoCallCommission,
      password: hashedPassword,
    });

    // Save the astrologer
    await newAstrologer.save();

    // Respond with success
    return res.status(200).json(new ApiResponse(201, newAstrologer, "Astrologer registered successfully."));
  } catch (error) {
    console.error("Error during astrologer registration:", error);
    return res.status(201).json(new ApiResponse(201, null, "An error occurred during the registration process."));
  }
});


