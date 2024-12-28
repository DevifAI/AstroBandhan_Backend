import bcrypt from "bcrypt";
import fs from "fs"; // For file handling (if you're uploading an avatar)
import { uploadOnCloudinary } from "../../middlewares/cloudinary.setup.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Admin } from "../../models/adminModel.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { validatePhoneNumber } from "../../utils/validatePhoneNumber.js";
import { sendOTP } from "../../utils/sendOtp.js";
import { validateOTP } from "./../../utils/validateOtp.js";

// Register Admin
export const registerAdmin = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, password, role, adminWalletBalance } = req.body;

    // Validate required fields
    if (!phone) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Phone number is required"));
    }

    // Check if phone number is valid using validatePhoneNumber function
    if (!validatePhoneNumber(phone)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid phone number format."));
    }

    // Check if admin already exists by phone or email
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "An admin with this email already exists")
        );
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const avatarLocalPath = req.file?.path; // If an avatar is provided

    let avatarUrl;
    // Upload new avatar to Cloudinary if provided
    if (avatarLocalPath) {
      try {
        const uploadResult = await uploadOnCloudinary(avatarLocalPath); // Assuming you have this function for Cloudinary
        avatarUrl = uploadResult.url;

        // Delete the locally saved file after successful upload
        fs.unlinkSync(avatarLocalPath);
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json(new ApiResponse(500, null, "Failed to upload avatar photo."));
      }
    }

    // Create new admin
    const newAdmin = await Admin.create({
      name,
      email,
      phone,
      password: hashedPassword, // Save hashed password
      role: role || "admin", // Default to "admin" if not provided
      adminWalletBalance: adminWalletBalance || 0, // Default to 0 if not provided
      photo: avatarUrl || null, // Avatar URL (if uploaded)
    });

    // Generate tokens
    const accessToken = newAdmin.generateAccessToken();
    const refreshToken = newAdmin.generateRefreshToken();

    // Save the refresh token
    newAdmin.refreshToken = refreshToken;
    await newAdmin.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { accessToken, refreshToken },
          "Admin registered successfully"
        )
      );
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(new ApiResponse(500, null, error.message));
  }
});

// Login Admin
export const loginAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Email and password are required"));
    }

    // Find admin by email
    const admin = await Admin.findOne({ email }).select("+password"); // Include password field in the query

    if (!admin) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid credentials"));
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid credentials"));
    }

    // Generate tokens
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    // Save refresh token in admin document
    admin.refreshToken = refreshToken;
    await admin.save();

    // Return response with tokens
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Admin logged in successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Something went wrong. Please try again.")
      );
  }
});

// Logout Admin
export const logout = asyncHandler(async (req, res) => {
  try {
    // Invalidate the JWT token
    res.clearCookie("token"); // Assuming you're using cookies to store the token

    // Send a successful response
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully."));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "An error occurred while logging out."));
  }
});

// Change Password
export const changePasswordAdmin = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { adminId } = req.params; // Extract admin ID from request params

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Old password and new password are required"
          )
        );
    }

    // Find admin by ID
    const admin = await Admin.findById(adminId).select("+password"); // Ensure password field is included

    if (!admin) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Admin not found"));
    }

    // Compare old password with stored hashed password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      admin.password
    );

    if (!isOldPasswordValid) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Old password is incorrect"));
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the admin's password
    admin.password = hashedPassword;

    // Save the admin document with the new password
    await admin.save();

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Something went wrong. Please try again.")
      );
  }
});

// Forgot Password: Send OTP to admin's phone number
export const forgotPasswordAdmin = asyncHandler(async (req, res) => {
  try {
    const { phone, role } = req.body;

    // Ensure role is 'admin'
    if (role !== "admin") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Invalid role, only admin can reset password."
          )
        );
    }

    // Validate the phone number format
    if (!validatePhoneNumber(phone)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid phone number format."));
    }

    // Check if the admin exists by phone number
    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No admin found with this phone number.")
        );
    }

    // Send OTP using the OTP service
    const otpResponse = await sendOTP(phone);
    // console.log(otpResponse);

    // Check for success based on responseCode instead of root-level success
    if (otpResponse.data.responseCode !== 200) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to send OTP."));
    }

    // Return success response with ApiResponse
    return res
      .status(200)
      .json(new ApiResponse(200, otpResponse.data, "OTP sent successfully."));
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

// Validate OTP and reset password for admin
export const validateOtpAdmin = asyncHandler(async (req, res) => {
  try {
    const { phone, verificationId, code, newPassword } = req.body;

    // Ensure all necessary data is provided
    if (!phone || !verificationId || !code || !newPassword) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Phone, verificationId, code, and new password are required."
          )
        );
    }

    // Check if the admin exists by phone number
    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No admin found with this phone number.")
        );
    }

    // Call the validateOTP function to validate OTP
    const otpValidationResponse = await validateOTP(
      phone,
      verificationId,
      code
    );

    // Check if OTP validation is successful
    if (otpValidationResponse.data.message !== "SUCCESS") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            otpValidationResponse.data,
            "OTP validation failed."
          )
        );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin's password
    admin.password = hashedNewPassword;
    await admin.save();

    // Return success response with ApiResponse
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully."));
  } catch (error) {
    console.error("Error in OTP validation controller:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "An error occurred while validating OTP or resetting the password."
        )
      );
  }
});

// Get Admin by ID
export const getAdminById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Get the admin ID from the URL parameters

    // Validate if ID is provided
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Admin ID is required."));
    }

    // Find the admin by ID in the database
    const admin = await Admin.findById(id);

    // Check if admin exists
    if (!admin) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Admin not found."));
    }

    // Return the admin data as the response
    return res
      .status(200)
      .json(new ApiResponse(200, admin, "Admin found successfully."));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "An error occurred while fetching the admin."
        )
      );
  }
});
