import { Astrologer } from "../../../models/astrologer.model.js";
import { User } from "../../../models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import Chat from "../../../models/chatSchema.js";
import Order from "../../../models/product/order.model.js";
import { Admin } from "../../../models/adminModel.js";
import Call from "../../../models/call.model.js";
import DailyHoroscope from "../../../models/horroscope.js";
import { AdminWallet } from "../../../models/adminWallet.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import moment from "moment-timezone";

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


export const get_total_Earning = asyncHandler(async (req, res) => {
    try {
        const admins = await Admin.find({});
        const admin = admins[0];

        res.status(200).json({
            success: true,
            total: admin.adminWalletBalance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Calls = asyncHandler(async (req, res) => {
    try {
        const calls = await Call.find({ callType: "audio" }).countDocuments();


        res.status(200).json({
            success: true,
            total: calls,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Chats = asyncHandler(async (req, res) => {
    try {
        const chats = await Chat.find({}).countDocuments();


        res.status(200).json({
            success: true,
            total: chats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Video_Calls = asyncHandler(async (req, res) => {
    try {
        const v_calls = await Call.find({ callType: "video" }).countDocuments();


        res.status(200).json({
            success: true,
            total: v_calls,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Horroscope = asyncHandler(async (req, res) => {
    try {
        const daily_horroscope = await DailyHoroscope.find({}).countDocuments();


        res.status(200).json({
            success: true,
            total: daily_horroscope,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total number of astrologers",
            error: error.message,
        });
    }
});

export const get_total_Due = asyncHandler(async (req, res) => {
    try {
        const result = await Astrologer.aggregate([
            {
                $group: {
                    _id: null,
                    totalWalletBalance: { $sum: "$walletBalance" }
                }
            }
        ]);

        const totalWalletBalance = result.length > 0 ? result[0].totalWalletBalance : 0;

        res.status(200).json({
            success: true,
            total: totalWalletBalance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve the total wallet balance of astrologers",
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


export const get_wallet_recharges_and_payouts = asyncHandler(async (req, res) => {
    try {
        // Get the current year
        const currentYear = moment().year();

        // Initialize arrays for storing monthly credit and debit amounts
        let walletRecharges = new Array(12).fill(0); // To store wallet recharge amounts per month
        let astrologerPayouts = new Array(12).fill(0); // To store astrologer payout amounts per month

        // Find wallet recharge amounts by month for the current year using $year
        const walletRechargesRecords = await AdminWallet.aggregate([
            {
                $match: {
                    credit_type: 'wallet_recharge', // Match credit type
                }
            },
        ]);
        console.log({ walletRechargesRecords })
        // Map wallet recharge amounts to the respective months
        walletRechargesRecords.forEach(record => {
            // Extract year and month from the date string
            const recordYear = record.createdAt.getFullYear(); // Assuming record._id contains the full date in YYYY-MM-DD format
            const recordMonth = record.createdAt.getMonth() + 1; // Get the month (1-12), adding 1 because getMonth() is 0-based


            console.log({ recordYear, currentYear })
            // Check if the record's year matches the current year
            if (recordYear.toString() === currentYear.toString()) {
                console.log({ recordMonth })
                // Adjust the month index (JavaScript array index is 0-based, so for month 1, index will be 0)
                if (recordMonth >= 1 && recordMonth <= 12) {
                    console.log(recordMonth, recordMonth.amount)
                    walletRecharges[recordMonth - 1] = (walletRecharges[recordMonth - 1] || 0) + record.amount;
                }
            }
        });

        // Find astrologer payout amounts by month for the current year using $year
        const astrologerPayoutsRecords = await AdminWallet.aggregate([
            {
                $match: {
                    debit_type: 'payout_astrologer', // Match credit type

                }
            },

        ]);

        // Map astrologer payout amounts to the respective months
        astrologerPayoutsRecords.forEach(record => {
            // Extract year and month from the date string
            const recordYear = record.createdAt.getFullYear(); // Assuming record._id contains the full date in YYYY-MM-DD format
            const recordMonth = record.createdAt.getMonth() + 1; // Get the month (1-12), adding 1 because getMonth() is 0-based


            console.log({ recordYear, currentYear })
            // Check if the record's year matches the current year
            if (recordYear.toString() === currentYear.toString()) {
                console.log({ recordMonth })
                // Adjust the month index (JavaScript array index is 0-based, so for month 1, index will be 0)
                if (recordMonth >= 1 && recordMonth <= 12) {
                    console.log(recordMonth, recordMonth.amount)
                    astrologerPayouts[recordMonth - 1] = (astrologerPayouts[recordMonth - 1] || 0) + record.amount;
                }
            }
        });

        return res.status(200).json(
            new ApiResponse(200, { walletRecharges, walletRecharges, astrologerPayouts }, "Data fetched successfully.")
        );

    } catch (error) {
        console.error("Error fetching data: ", error);
        return res.status(500).json(
            new ApiResponse(500, error, "An error occurred while fetching the wallet recharges and astrologer payouts.")
        );
    }
});

export const get_calls_chats_counts = asyncHandler(async (req, res) => {
    try {
        // Get the start and end of the current week
        const startOfWeek = moment().startOf('week').toDate();
        const endOfWeek = moment().endOf('week').toDate();

        // Filter and group Calls data
        const callData = await Call.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
                },
            },
            {
                $project: {
                    callType: 1,
                    day: { $dayOfWeek: "$createdAt" }, // Extract the day of the week
                },
            },
            {
                $group: {
                    _id: { day: "$day", callType: "$callType" },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.callType",
                    data: {
                        $push: {
                            day: "$_id.day",
                            count: "$count",
                        },
                    },
                },
            },
        ]);

        // Filter and group Chats data
        const chatData = await Chat.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
                },
            },
            {
                $project: {
                    day: { $dayOfWeek: "$createdAt" }, // Extract the day of the week
                },
            },
            {
                $group: {
                    _id: "$day",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Initialize result data with default 7-day counts
        const result = {
            AudiocallsCount: Array(7).fill(0),
            videoCallsCount: Array(7).fill(0),
            chatCount: Array(7).fill(0),
        };

        // Populate the result with actual call counts
        callData.forEach(item => {
            const callType = item._id === "audio" ? "AudiocallsCount" : "videoCallsCount";
            item.data.forEach(({ day, count }) => {
                result[callType][day - 1] = count; // Day is 1-indexed in MongoDB
            });
        });

        // Populate the result with actual chat counts
        chatData.forEach(({ _id: day, count }) => {
            result.chatCount[day - 1] = count; // Day is 1-indexed in MongoDB
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching weekly calls and chats data:', error);
        res.status(500).json({
            message: 'Error fetching weekly calls and chats data',
            error: error.message,
        });
    }
});


export const  get_top_astrologer_this_week = asyncHandler(async (req, res) => {
console.log("pending")
})

  export const getAdminProfile = asyncHandler(async (req, res) => {
        try {
            const admins = await Admin.find({});
            const admin = admins[0];
            res.status(200).json({
                success: true,
                admin: admin
            });
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve admin profile',
                error: error.message
            });
        }
    });



