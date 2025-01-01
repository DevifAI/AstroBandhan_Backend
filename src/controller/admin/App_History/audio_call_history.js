import Call from "../../../models/call.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const getCall_History = asyncHandler(async (req, res) => {
    try {
        const { fromDate, toDate } = req.body; // Extract dates from the request body

        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: "Both fromDate and toDate are required."
            });
        }

        const calls = await Call.aggregate([

            {
                $match: {
                   callType:"audio"
                }
            },

            {
                $addFields: {
                    createdDateString: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Format date as YYYY-MM-DD
                            date: "$createdAt"
                        }
                    }
                }
            },
            {
                $match: {
                    // Match based on the date range
                    ...(fromDate === toDate
                        ? { createdDateString: fromDate } // Exact match for same date
                        : {
                            createdDateString: {
                                $gte: fromDate, // Date greater than or equal to fromDate
                                $lte: toDate // Date less than or equal to toDate
                            }
                        })
                }
            },
            {
                $lookup: {
                    from: "users", // Reference to the 'users' collection
                    localField: "userId", // Field in the current collection (Call) to match
                    foreignField: "_id", // Field in the 'users' collection to match
                    as: "userDetails" // Alias to store the joined data
                }
            },
            {
                $unwind: "$userDetails" // Unwind the userDetails array to get the details
            },
            {
                $lookup: {
                    from: "astrologers", // Reference to the 'astrologers' collection
                    localField: "astrologerId", // Field in the current collection (Call) to match
                    foreignField: "_id", // Field in the 'astrologers' collection to match
                    as: "astrologerDetails" // Alias to store the joined data
                }
            },
            {
                $unwind: "$astrologerDetails" // Unwind the astrologerDetails array to get the details
            },
            {
                $project: {
                    duration: 1,
                    callType: 1,
                    totalAmount: 1,
                    "recordingData.serverResponse.fileList.fileName": 1,
                    "recordingData.serverResponse.uploadingStatus": 1,
                    "userDetails.name": 1, // Include the name from the userDetails
                    "astrologerDetails.name": 1, // Include the name from the astrologerDetails
                    startedAt: {
                        $dateToString: {
                            format: "%H:%M:%S", // Extract only the time part
                            date: { $add: ["$startedAt", 19800000] } // Convert to IST (UTC + 5:30)
                        }
                    },
                    endedAt: {
                        $dateToString: {
                            format: "%H:%M:%S", // Extract only the time part
                            date: { $add: ["$endedAt", 19800000] } // Convert to IST (UTC + 5:30)
                        }
                    },
                }
            },
            {
                $addFields: {
                    "recordingData.serverResponse.fileList": {
                        $arrayElemAt: ["$recordingData.serverResponse.fileList", 0] // Take only the first file from the fileList array
                    }
                }
            },
            {
                $project: {
                    createdDateString: 0 // Remove the createdDateString field from the result
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: calls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve call history",
            error: error.message || "Internal Server Error"
        });
    }
});

export const getVideo_Call_History = asyncHandler(async (req, res) => {
    try {
        const { fromDate, toDate } = req.body; // Extract dates from the request body

        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: "Both fromDate and toDate are required."
            });
        }

        const calls = await Call.aggregate([

        {
            $match: {
               callType:"video"
            }
        },
            {
                $addFields: {
                    createdDateString: {
                        $dateToString: {
                            format: "%Y-%m-%d", // Format date as YYYY-MM-DD
                            date: "$createdAt"
                        }
                    }
                }
            },
            {
                $match: {
                    // Match based on the date range
                    ...(fromDate === toDate
                        ? { createdDateString: fromDate } // Exact match for same date
                        : {
                            createdDateString: {
                                $gte: fromDate, // Date greater than or equal to fromDate
                                $lte: toDate // Date less than or equal to toDate
                            }
                        })
                }
            },
            {
                $lookup: {
                    from: "users", // Reference to the 'users' collection
                    localField: "userId", // Field in the current collection (Call) to match
                    foreignField: "_id", // Field in the 'users' collection to match
                    as: "userDetails" // Alias to store the joined data
                }
            },
            {
                $unwind: "$userDetails" // Unwind the userDetails array to get the details
            },
            {
                $lookup: {
                    from: "astrologers", // Reference to the 'astrologers' collection
                    localField: "astrologerId", // Field in the current collection (Call) to match
                    foreignField: "_id", // Field in the 'astrologers' collection to match
                    as: "astrologerDetails" // Alias to store the joined data
                }
            },
            {
                $unwind: "$astrologerDetails" // Unwind the astrologerDetails array to get the details
            },
            {
                $project: {
                    duration: 1,
                    callType: 1,
                    totalAmount: 1,
                    "recordingData.serverResponse.fileList.fileName": 1,
                    "recordingData.serverResponse.uploadingStatus": 1,
                    "userDetails.name": 1, // Include the name from the userDetails
                    "astrologerDetails.name": 1, // Include the name from the astrologerDetails
                    startedAt: {
                        $dateToString: {
                            format: "%H:%M:%S", // Extract only the time part
                            date: { $add: ["$startedAt", 19800000] } // Convert to IST (UTC + 5:30)
                        }
                    },
                    endedAt: {
                        $dateToString: {
                            format: "%H:%M:%S", // Extract only the time part
                            date: { $add: ["$endedAt", 19800000] } // Convert to IST (UTC + 5:30)
                        }
                    },
                }
            },
            {
                $addFields: {
                    "recordingData.serverResponse.fileList": {
                        $arrayElemAt: ["$recordingData.serverResponse.fileList", 0] // Take only the first file from the fileList array
                    }
                }
            },
            {
                $project: {
                    createdDateString: 0 // Remove the createdDateString field from the result
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: calls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve call history",
            error: error.message || "Internal Server Error"
        });
    }
});
