import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { User } from "../../models/user.model.js";
import bcrypt from 'bcrypt';

export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, timeOfBirth, placeOfBirth, gender, password } = req.body;

    if (!phone) {
      return res.status(400).json(new ApiResponse(400, null, "Phone number is required"));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, null, "User already registered"));
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);  // Correct usage of bcrypt.hash

    // Create new user
    const newUser = await User.create({
      name,
      email,
      phone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      gender,
      password: hashedPassword,  // Save hashed password
    });

    // Generate tokens
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res.status(201).json(
      new ApiResponse(201, { accessToken, refreshToken }, "User registered successfully.")
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, "Something went wrong. Please try again."));
  }
});


export const userLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if both fields are provided
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required.' });
    }

    // Find astrologer by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Astrologer not found.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Set available to true on login
    user.available = true;

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the database (optional but recommended)
    user.refreshToken = refreshToken;
    await user.save();

    // Respond with tokens and success message
    res.status(200).json(new ApiResponse(200, {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        // Include other public details if necessary
      },
    }, "User Login Successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      new ApiResponse(500, {}, "Server error. Please try again later.")
    );

  }
};


export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params; // assuming the astrologer's ID is passed as a route parameter
    const { currentPassword, newPassword } = req.body;

    // Check if both current and new passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(401).json(
        new ApiResponse(401, {}, "Both current and new passwords are required..")
      );

    }

    // Check if both current and new passwords are the same
    if (currentPassword === newPassword) {
      return res.status(401).json(
        new ApiResponse(401, {}, "New password must be different from the current password.")
      );
    }



    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        new ApiResponse(404, {}, "User not found")
      );
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json(
        new ApiResponse(401, {}, "Current password is incorrect.")
      );

    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the astrologer's password
    user.password = hashedPassword;
    await user.save();

    // Respond with success message
    return res.status(201).json(
      new ApiResponse(201, {}, "Password changed successfully.")
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, null, "Something went wrong. Please try again."));
  }
};
