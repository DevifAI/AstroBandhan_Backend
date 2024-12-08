import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { wallet } from "../../models/walletSchema.model.js";

export const add_wallet_balance = asyncHandler(async (req, res) => {
    try {

        const { userId, transaction_id, amount, amount_type, debit_type } = req.body

        console.log({ userId, transaction_id, amount, amount_type, debit_type })

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

        const transaction_id_exist = await wallet.findOne({ transaction_id })
        console.log({ transaction_id_exist })


        if (transaction_id_exist) {
            return res.status(201).json(
                new ApiResponse(201, {}, `Invalid  Transaction Id !!`)
            );
        }

        if (amount_type === "debit") {
            if (user.walletBalance >= amount) {
                await User.findByIdAndUpdate(
                    userId, // The ID of the user
                    { $inc: { walletBalance: -amount } }, // Increment the wallet balance by the specified amount
                );
            }
            else {
                return res.status(201).json(
                    new ApiResponse(201, {}, `Low Balance !!`)
                );
            }

        }

        // Create and save the new review
        const add_wallet_doc = new wallet({ user_id: userId, amount, amount_type, transaction_id, debit_type });
        await add_wallet_doc.save();

        if (amount_type === "credit") {
            await User.findByIdAndUpdate(
                userId, // The ID of the user
                { $inc: { walletBalance: amount } }, // Increment the wallet balance by the specified amount
            );
        }
        // else {
        //    
        // }


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
            transactions = await wallet.find({ user_id: userId}).sort({ createdAt: -1 }).exec(); // Execute query
        }else if (amount_type === "credit") {
            transactions = await wallet.find({ user_id: userId, amount_type }).sort({ createdAt: -1 }).exec(); // Execute query
        } else {
            transactions = await wallet.find({ user_id: userId, amount_type, debit_type }).sort({ createdAt: -1 }).exec(); // Execute query
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