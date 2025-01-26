import mongoose from 'mongoose';
import { User } from '../../../models/user.model.js';

export const getAllUsers = async (req, res) => {
    try {
        // Use exec() to get a promise and avoid circular references
        const usersData = await User.find().exec(); // Fetching data with .exec()

        if (usersData.length === 0) {
            return res.json({
                success: true,
                message: 'Total Users found',
                data: [],
            });
        }

        // Return the fetched users data
        res.json({
            success: true,
            message: 'Total Users fetched',
            data: usersData,
        });
    } catch (error) {
        console.error('Error fetching Total Users :', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching Total Users',
            error: error.message,
        });
    }
};
