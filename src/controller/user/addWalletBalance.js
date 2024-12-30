import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Wallet } from "../../models/walletSchema.model.js";
import { activeUsers, io } from "../../utils/sockets/socket.js";
import { AdminWallet } from "../../models/adminWallet.js";
import Notification from "../../models/notifications.model.js";

export const add_wallet_balance = asyncHandler(async (req, res) => {
    try {

        const { userId, transaction_id, amount, amount_type } = req.body

        console.log({ userId, transaction_id, amount, amount_type })

        if (!userId || !transaction_id || !amount || !amount_type) {
            return res.status(400).json(
                new ApiResponse(400, {}, "All fields are required ")
            );
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, {}, "User not found.")
            );
        }

        const transaction_id_exist = await Wallet.findOne({ transaction_id })


        if (transaction_id_exist) {
            return res.status(201).json(
                new ApiResponse(201, {}, `Invalid  Transaction Id !!`)
            );
        }
        if (amount_type === "credit") {
            await User.findByIdAndUpdate(
                userId, // The ID of the user
                { $inc: { walletBalance: amount } }, // Increment the wallet balance by the specified amount
            );
        }
        const add_wallet_doc = new Wallet({ user_id: userId, amount, transaction_id, transaction_type: amount_type, credit_type: "wallet_recharge" });
        const add_admin_wallet_doc = new AdminWallet({ amount, transaction_id, transaction_type: amount_type, credit_type: "wallet_recharge" });
        await add_wallet_doc.save();
        await add_admin_wallet_doc.save();

        const userSocketId = activeUsers[userId]; // Retrieve the socketId for the user from activeUsers
        if (userSocketId) {
            const message = `Your wallet has been ${amount_type === "credit" ? 'credited' : 'debited'} with ${amount}.`;
            io.to(userSocketId).emit('notification', { message });
            console.log(`Notification sent to user ${userId} with socket ID ${userSocketId}`);
        }
        const newNotification = new Notification({
            userId: userId,
            message: [
                {
                    title: 'Coin Credited',
                    desc: `${amount} has been credited to your wallet `,
                }
            ]
        });

        // Save the notification to the database
        newNotification.save()

        return res.status(201).json(
            new ApiResponse(201, add_wallet_doc, `Money ${amount_type === "credit" ? 'added' : "deduct"} successfully.`)
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, error, "An error occurred while working on the ballance.")
        );
    }
});


export const find_transaction_history_by_category = asyncHandler(async (req, res) => {
    try {
        const { userId, debit_type, amount_type } = req.body;

        // Validation for userId and at least one of debit_type or amount_type
        if (!userId) {
            return res.status(400).json(
                new ApiResponse(400, {}, "User ID is required.")
            );
        }
        if (!debit_type && !amount_type) {
            return res.status(400).json(
                new ApiResponse(400, {}, "At least one of debit_type or amount_type is required.")
            );
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, {}, "User not found.")
            );
        }


        // Find wallet transactions
        let transactions;
        if (amount_type === "all") {
            transactions = await Wallet.find({ user_id: userId }).sort({ createdAt: -1 }).exec(); // Execute query
        } else if (amount_type === "credit") {
            transactions = await Wallet.find({ user_id: userId, transaction_type: amount_type }).sort({ createdAt: -1 }).exec(); // Execute query
        } else {
            transactions = await Wallet.find({ user_id: userId, transaction_type: amount_type, debit_type }).sort({ createdAt: -1 }).exec(); // Execute query
        }
        const response = {
            transactions,
            balance: user.walletBalance, // Add the balance here
        };
        // Send response
        return res.status(200).json(
            new ApiResponse(200, response, `Operation successfully done.`)
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, {}, "An error occurred while searching balance history.")
        );
    }
});