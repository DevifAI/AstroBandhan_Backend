import { Astrologer } from "../../../models/astrologer.model.js";
import { User } from "../../../models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import Chat from "../../../models/chatSchema.js";
import Order from "../../../models/product/order.model.js";

export const get_total_astrologers = asyncHandler(async (req, res) => {
    try {
        const num_of_astrologers = await Astrologer.countDocuments({ isVerified: true });

        res.status(200).json({
            success: true,
            total: num_of_astrologers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_users = asyncHandler(async (req, res) => {
    try {
        const num_of_users = await User.countDocuments();

        res.status(200).json({
            success: true,
            total: num_of_users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_completed_chat = asyncHandler(async (req, res) => {
    try {
        const num_of_chats = await Chat.countDocuments();

        res.status(200).json({
            success: true,
            total: num_of_chats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Order = asyncHandler(async (req, res) => {
    try {
        const num_of_orders = await Order.countDocuments();

        res.status(200).json({
            success: true,
            total: num_of_orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});


export const get_unverified_astrologers = asyncHandler(async (req, res) => {
    try {
        const unverified_astrologers = await Astrologer.find({ isVerified: false })
        res.status(200).json({
            success: true,
            total: num_of_orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});







