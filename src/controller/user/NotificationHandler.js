import mongoose from "mongoose";
import Notification from "../../models/notifications.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from '../../utils/asyncHandler.js';


// 1. Mark Notifications as Read
export const markNotificationsAsRead = asyncHandler(async (req, res) => {
    try {
        const { userId, notificationId } = req.params; // Get userId from the request parameters

        if (!userId) {
            return res.status(400).json(
                new ApiResponse(400, {}, "User ID is required.")
            );
        }

        const objectId =new mongoose.Types.ObjectId(notificationId);


        // Update the 'read' field of notifications to true for the given user
        const result = await Notification.updateOne(
            { userId, _id: objectId }, // Only update unread notifications
            { $set: { read: true } }  // Set the 'read' field to true
        );

        if (result.Modified === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No unread notifications found for this user.")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, result, "Notifications successfully marked as read.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while marking notifications as read.")
        );
    }
});

// 2. Delete Notifications
export const deleteNotifications = asyncHandler(async (req, res) => {
    try {
        const { userId, notificationId } = req.body; // Get userId and notificationId from the request parameters

        if (!userId || !notificationId) {
            return res.status(400).json(
                new ApiResponse(400, {}, "User ID and Notification ID are required.")
            );
        }

        // Convert notificationId to ObjectId
        const objectId =new mongoose.Types.ObjectId(notificationId);


        // Delete notifications for the given user
        const result = await Notification.deleteOne({ userId, _id: objectId });

        if (result.deletedCount === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No notifications found to delete.")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, result, "Notifications successfully deleted.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while deleting notifications.")
        );
    }
});

// 3. Get All Notifications by User ID
export const getAllNotificationsByUserId = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params; // Get userId from the request parameters

        if (!userId) {
            return res.status(400).json(
                new ApiResponse(400, {}, "User ID is required.")
            );
        }

        // Retrieve all notifications for the given user
        const notifications = await Notification.find({ userId });

        if (notifications.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No notifications found for this user.")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, notifications, "Notifications fetched successfully.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while retrieving notifications.")
        );
    }
});

// 4. Get Total Count of Unmarked (Unread) Notifications
export const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body; // Get userId from the request parameters

        if (!userId) {
            return res.status(400).json(
                new ApiResponse(400, {}, "User ID is required.")
            );
        }

        // Count the unread notifications for the given user
        const unreadCount = await Notification.countDocuments({
            userId,
            read: false
        });

        return res.status(200).json(
            new ApiResponse(200, { unreadCount }, "Unread notifications count fetched successfully.")
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while counting unread notifications.")
        );
    }
});

