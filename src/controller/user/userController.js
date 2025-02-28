import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { User } from "../../models/user.model.js";
import bcrypt from "bcrypt";
import { validatePhoneNumber } from "../../utils/validatePhoneNumber.js";
import { sendOTP } from "../../utils/sendOtp.js";
import { validateOTP } from "../../utils/validateOtp.js";
import { Astrologer } from "../../models/astrologer.model.js";
import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import fs from "fs";

export const registerUser = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      password,
      photo,
    } = req.body;

    if (!phone) {
      return res
        .status(201)
        .json(new ApiResponse(201, null, "Phone number is required"));
    }

    if (!validatePhoneNumber(phone)) {
      return res
        .status(201)
        .json(new ApiResponse(201, null, "Invalid phone number format."));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(201)
        .json(new ApiResponse(201, null, "User already registered"));
    }
    const existingAstrologer = await Astrologer.findOne({ phone });
    if (existingAstrologer) {
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            null,
            "This number is already used by an astrologer"
          )
        );
    }
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds); // Correct usage of bcrypt.hash

    // const avatarLocalPath = photo;

    // Upload new avatar to Cloudinary
    let avatarUrl = photo;
    // try {
    //   const uploadResult = await uploadOnCloudinary(avatarLocalPath);
    //   avatarUrl = uploadResult.url;

    //   // Delete the locally saved file after successful upload
    //   fs.unlinkSync(avatarLocalPath);
    // } catch (error) {
    //   console.log(error)
    //   return res.status(500).json(new ApiResponse(500, null, "Failed to upload photo."));
    // }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      phone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      photo: avatarUrl,
      password: hashedPassword, // Save hashed password
    });

    // Generate tokens
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken, newUser },
          "User registered successfully."
        )
      );
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Something went wrong. Please try again.")
      );
  }
});

export const userLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if both fields are provided
    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required." });
    }
    if (!validatePhoneNumber(phone)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid phone number format."));
    }

    // Find astrologer by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Set available to true on login
    user.available = true;

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the database (optional but recommended)
    user.refreshToken = refreshToken;
    user.photo = "https://www.google.com/";

    await user.save();

    // Respond with tokens and success message
    res.status(200).json(
      new ApiResponse(
        200,
        {
          data: {
            accessToken,
            user,
          },
        },
        "User Login Successfully"
      )
    );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error. Please try again later."));
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params; // assuming the astrologer's ID is passed as a route parameter
    const { currentPassword, newPassword } = req.body;

    // Check if both current and new passwords are provided
    if (!currentPassword || !newPassword) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "Both current and new passwords are required.."
          )
        );
    }

    // Check if both current and new passwords are the same
    if (currentPassword === newPassword) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "New password must be different from the current password."
          )
        );
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Current password is incorrect."));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the astrologer's password
    user.password = hashedPassword;
    await user.save();

    // Respond with success message
    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Password changed successfully."));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Something went wrong. Please try again.")
      );
  }
};

export const forgetPassword = asyncHandler(async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (role !== "user") {
      return res.status(400).json(new ApiResponse(400, null, "Invalid user"));
    }
    // Validate the phone number
    if (!validatePhoneNumber(phone)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid phone number format."));
    }

    // Check if an astrologer exists with the given phone number
    const user = await User.findOne({ phone });

    if (!user) {
      return res
        .status(201)
        .json(
          new ApiResponse(201, null, "No User found with this phone number.")
        );
    }

    // If astrologer exists, send OTP
    const otpResponse = await sendOTP(phone);

    if (!otpResponse) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to send OTP."));
    }

    // console.log(otpResponse)

    // Return success response with ApiResponse
    return res
      .status(200)
      .json(
        new ApiResponse(
          otpResponse.data.responseCode,
          otpResponse.data,
          otpResponse.data.message
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "An error occurred while processing the request."
        )
      );
  }
});

export const validateloginOtp = asyncHandler(async (req, res) => {
  try {
    const { phone, verificationId, code } = req.body;

    // Ensure all necessary data is provided
    if (!phone || !verificationId || !code) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Phone, verificationId, and code are required."
          )
        );
    }

    // Call the validateOTP function
    const response = await validateOTP(phone, verificationId, code);

    // Find astrologer by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Set available to true on login
    user.available = true;

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the database (optional but recommended)
    user.refreshToken = refreshToken;

    user.save();

    // Check the response and return appropriate message
    if (response.success) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
              id: user._id,
              name: user.name,
              phone: user.phone,
              Free_Chat_Available: user.Free_Chat_Available,
              // Include other public details if necessary
            },
          },
          "User Login Successfully"
        )
      );
    } else {
      return res
        .status(201)
        .json(new ApiResponse(201, response.data, "OTP validation failed."));
    }
  } catch (error) {
    console.error("Error in OTP validation controller:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "An error occurred while validating OTP.")
      );
  }
});

export const validateOtp = asyncHandler(async (req, res) => {
  try {
    const { phone, verificationId, code } = req.body;

    // Ensure all necessary data is provided
    if (!phone || !verificationId || !code) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Phone, verificationId, and code are required."
          )
        );
    }

    // Call the validateOTP function
    const response = await validateOTP(phone, verificationId, code);

    // Check the response and return appropriate message
    if (response.success) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, response.data, "OTP validated successfully.")
        );
    } else {
      return res
        .status(201)
        .json(new ApiResponse(201, response.data, "OTP validation failed."));
    }
  } catch (error) {
    console.error("Error in OTP validation controller:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "An error occurred while validating OTP.")
      );
  }
});

export const updatePassword_user = asyncHandler(async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    // Check if phone and newPassword are provided
    if (!phone || !newPassword) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Phone number and new password are required."
          )
        );
    }

    // Find astrologer by phone number
    const user = await User.findOne({ phone });
    // If astrologer not found
    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "User not found."));
    }

    // Check if the new password is the same as the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "New password cannot be the same as the old0 password."
          )
        );
    }

    // Hash the new password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update astrologer's password with the hashed password
    user.password = hashedPassword;

    // Save the updated astrologer
    await user.save();

    // Send success response
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password updated successfully."));
  } catch (error) {
    console.error("Error updating password:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "An error occurred while updating the password."
        )
      );
  }
});

export const getuserById = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if both fields are provided
    if (!userId) {
      return res.status(400).json({ message: "userId  are required." });
    }

    // Find astrologer by phone
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Respond with tokens and success message
    res.status(200).json(new ApiResponse(200, user, "User Login Successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error. Please try again later."));
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { userId } = req.body;
    const updates = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    // Ensure phone number is not updated
    if (updates.phone) {
      return res
        .status(400)
        .json({ message: "Phone number cannot be updated." });
    }

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the updates follow the schema's validation rules
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully."));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error. Please try again later."));
  }
};
