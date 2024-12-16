import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Astrologer } from '../../models/astrologer.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validatePhoneNumber } from '../../utils/validatePhoneNumber.js';
import { sendOTP } from '../../utils/sendOtp.js';
import { validateOTP } from '../../utils/validateOtp.js';

export const astrologerLogin = asyncHandler(async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Check if both fields are provided
        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password are required.' });
        }

        if (!validatePhoneNumber(phone)) {
            return res.status(400).json(new ApiResponse(400, null, 'Invalid phone number format.'));
        }

        // Find astrologer by phone
        const astrologer = await Astrologer.findOne({ phone });
        if (!astrologer) {
            return res.status(404).json({ message: 'Astrologer not found.' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, astrologer.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // // Set available to true on login
        // astrologer.available = "true";

        // Generate access and refresh tokens
        const accessToken = astrologer.generateAccessToken();
        const refreshToken = astrologer.generateRefreshToken();

        // Save the refresh token to the database (optional but recommended)
        astrologer.refreshToken = refreshToken;

        await astrologer.save();
        // console.log(astrologer);

        // Respond with tokens and success message
        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            astrologer: {
                id: astrologer._id,
                name: astrologer.name,
                phone: astrologer.phone,
                available: astrologer.available,
                // Include other public details if necessary
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
})

export const changePassword = asyncHandler(async (req, res) => {
    try {
        const { astrologerId } = req.params; // assuming the astrologer's ID is passed as a route parameter
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



        // Find the astrologer by ID
        const astrologer = await Astrologer.findById(astrologerId);
        if (!astrologer) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Astrologer not found")
            );
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, astrologer.password);
        if (!isMatch) {
            return res.status(401).json(
                new ApiResponse(401, {}, "Current password is incorrect.")
            );

        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the astrologer's password
        astrologer.password = hashedPassword;
        await astrologer.save();

        // Respond with success message
        return res.status(201).json(
            new ApiResponse(201, {}, "Password changed successfully.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiResponse(500, null, "Something went wrong. Please try again."));
    }
})

export const forgetPassword = asyncHandler(async (req, res) => {
    try {
        const { phone, role } = req.body;
        if (role !== "astrologer") {
            return res.status(400).json(new ApiResponse(400, null, 'Invalid user'));
        }
        // Validate the phone number
        if (!validatePhoneNumber(phone)) {
            return res.status(400).json(new ApiResponse(400, null, 'Invalid phone number format.'));
        }

        // Check if an astrologer exists with the given phone number
        const astrologer = await Astrologer.findOne({ phone });

        if (!astrologer) {
            return res.status(404).json(new ApiResponse(404, null, 'No astrologer found with this phone number.'));
        }

        // If astrologer exists, send OTP
        const otpResponse = await sendOTP(phone);

        if (!otpResponse) {
            return res.status(500).json(new ApiResponse(500, null, 'Failed to send OTP.'));
        }

        // console.log(otpResponse)

        // Return success response with ApiResponse
        return res.status(200).json(new ApiResponse(otpResponse.data.responseCode, otpResponse.data, otpResponse.data.message));

    } catch (error) {
        // console.error(error);
        return res.status(500).json(new ApiResponse(500, null, 'An error occurred while processing the request.'));
    }
});
export const validateOtp = asyncHandler(async (req, res) => {
    try {
        const { phone, verificationId, code } = req.body;

        // Ensure all necessary data is provided
        if (!phone || !verificationId || !code) {
            return res.status(400).json(new ApiResponse(400, null, 'Phone, verificationId, and code are required.'));
        }

        // Call the validateOTP function
        const response = await validateOTP(phone, verificationId, code);

        // Check the response and return appropriate message
        if (response.success) {
            return res.status(200).json(new ApiResponse(200, response.data, 'OTP validated successfully.'));
        } else {
            return res.status(400).json(new ApiResponse(400, response.data, 'OTP validation failed.'));
        }
    } catch (error) {
        console.error('Error in OTP validation controller:', error);
        return res.status(500).json(new ApiResponse(500, null, 'An error occurred while validating OTP.'));
    }
});
export const updatePassword = asyncHandler(async (req, res) => {
    try {
        const { phone, newPassword } = req.body;

        // Check if phone and newPassword are provided
        if (!phone || !newPassword) {
            return res.status(400).json(new ApiResponse(400, null, 'Phone number and new password are required.'));
        }

        // Find astrologer by phone number
        const astrologer = await Astrologer.findOne({ phone });

        // If astrologer not found
        if (!astrologer) {
            return res.status(404).json(new ApiResponse(404, null, 'Astrologer not found.'));
        }

        // Check if the new password is the same as the old password
        const isSamePassword = await bcrypt.compare(newPassword, astrologer.password);
        if (isSamePassword) {
            return res.status(400).json(new ApiResponse(400, null, 'New password cannot be the same as the old password.'));
        }

        // Hash the new password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update astrologer's password with the hashed password
        astrologer.password = hashedPassword;

        // Save the updated astrologer
        await astrologer.save();

        // Send success response
        return res.status(200).json(new ApiResponse(200, null, 'Password updated successfully.'));
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json(new ApiResponse(500, null, 'An error occurred while updating the password.'));
    }
});