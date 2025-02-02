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
      category,
      avatar,
      isAvailable,  // directly destructure available object from the payload
    } = req.body;

    // Validate required fields
    const missingFields = [];

    if (category?.length === 0 || !category) missingFields.push("category");
    if (!name) missingFields.push("name");
    if (experience === undefined || experience === null) missingFields.push("experience");
    if (pricePerCallMinute === undefined || pricePerCallMinute === null) missingFields.push("pricePerCallMinute");
    if (pricePerChatMinute === undefined || pricePerChatMinute === null) missingFields.push("pricePerChatMinute");
    if (!phone) missingFields.push("phone");
    if (!password) missingFields.push("password");
    if (!gender) missingFields.push("gender");
    if (typeof isFeatured !== "boolean") missingFields.push("isFeatured");
    if (typeof isVerified !== "boolean") missingFields.push("isVerified");
    if (typeof isAvailable !== "boolean") missingFields.push("isAvailable");

    if (missingFields.length > 0) {
      return res.status(200).json(
        new ApiResponse(500, null, `Please provide all required fields: ${missingFields.join(", ")}`)
      );
    }




    // Check if astrologer already exists with the same phone number
    const existingAstrologer = await Astrologer.findOne({ phone });
    if (existingAstrologer) {
      return res.status(201).json(new ApiResponse(500, null, "Astrologer already registered with this phone number."));
    }

    // Check if phone number exists in User model
    const Check_Phone_Exist_In_User = await User.findOne({ phone });
    if (Check_Phone_Exist_In_User) {
      return res.status(201).json(new ApiResponse(500, null, "User already registered with this phone number."));
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(201).json(new ApiResponse(500, null, 'Invalid phone number format.'));
    }

    // Hash the password
    const saltRounds = 10;
    if (!password) {
      return res.status(400).json(new ApiResponse(500, null, "Password is required."));
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

    const available = {
      isAvailable: isAvailable,
      isCallAvailable: isAvailable,
      isVideoCallAvailable: isAvailable
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
      category,
      password: hashedPassword,
      avatar,
      available
    });

    // Save the astrologer
    await newAstrologer.save();

    // Respond with success
    return res.status(200).json(new ApiResponse(201, newAstrologer, "Astrologer registered successfully."));
  } catch (error) {
    console.error("Error during astrologer registration:", error);
    return res.status(201).json(new ApiResponse(500, null, "An error occurred during the registration process."));
  }
});


