import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Astrologer } from '../../models/astrologer.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const astrologerLogin = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Check if both fields are provided
        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password are required.' });
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

        // Set available to true on login
        astrologer.available = true;

        // Generate access and refresh tokens
        const accessToken = astrologer.generateAccessToken();
        const refreshToken = astrologer.generateRefreshToken();

        // Save the refresh token to the database (optional but recommended)
        astrologer.refreshToken = refreshToken;
        await astrologer.save();

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
};

export const changePassword = async (req, res) => {
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
};
