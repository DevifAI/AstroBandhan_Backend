import mongoose from 'mongoose';
import { Astrologer } from '../../models/astrologer.model.js';
import Call from '../../models/call.model.js';
import ChatRoom from '../../models/chatRoomSchema.js';
import moment from 'moment-timezone';

export const getTopAstrologersThisWeek = async (req, res) => {
    try {
        // Get start and end dates of this week in UTC
        const startOfWeek = moment().startOf('week').startOf('day').toDate();
        const endOfWeek = moment().endOf('week').endOf('day').toDate();

        // Step 1: Get all astrologers from the Astrologer collection
        const astrologers = await Astrologer.find();
        if (!astrologers.length) {
            return res.json({
                success: false,
                message: 'No astrologers found',
                data: [],
            });
        }
        console.log({ startOfWeek, endOfWeek })
        // Step 2: Get Chat Data categorized by astrologerId (from ChatRoom collection)
        const chatroomsAggregation = [
            {
                $match: {
                    astrologer: { $exists: true },
                    isUserJoined: true, // Ensure the user has joined the chat
                    createdAt: {
                        // Format the dates to be compared with date-only strings (ignoring time)
                        $gte: moment(startOfWeek).startOf('day').toDate(), // Start of the day
                        $lte: moment(endOfWeek).endOf('day').toDate(), // End of the day
                    },
                },
            },
            {
                $group: {
                    _id: '$astrologer', // Group by astrologer
                    totalChats: { $sum: 1 },
                },
            },
        ];


        const chatroomsData = await ChatRoom.aggregate(chatroomsAggregation);
        console.log({ chatroomsData })
        // Step 3: Get Call Data categorized by astrologerId (from Call collection)
        const callsAggregation = [
            {
                $match: {
                    astrologerId: { $exists: true },
                    createdAt: {
                        // Format the dates to be compared with date-only strings (ignoring time)
                        $gte: moment(startOfWeek).startOf('day').toDate(), // Start of the day
                        $lte: moment(endOfWeek).endOf('day').toDate(), // End of the day
                    },
                },
            },
            {
                $group: {
                    _id: '$astrologerId',
                    audioCalls: { $sum: { $cond: [{ $eq: ['$callType', 'audio'] }, 1, 0] } },
                    videoCalls: { $sum: { $cond: [{ $eq: ['$callType', 'video'] }, 1, 0] } },
                    totalCalls: { $sum: 1 },
                },
            },
        ];
        const callsData = await Call.aggregate(callsAggregation);
        console.log({ callsData })
        // Step 4: Combine Astrologers with Chat and Call Data
        const astrologerData = astrologers.map(astrologer => {
            // Get chat data for the astrologer
            const chatData = chatroomsData.find(chat => chat._id.toString() === astrologer._id.toString());

            // Get call data for the astrologer
            const callData = callsData.find(call => call._id.toString() === astrologer._id.toString());
            // Step 5: Sort astrologers by combined activity (calls + chats) in ascending order
            // astrologerData.sort((a, b) => (a.totalCalls + a.totalChats) - (b.totalCalls + b.totalChats));

            return {
                astrologerId: astrologer._id,
                name: astrologer.name,
                avatar: astrologer.avatar,
                experience: astrologer.experience,
                totalCalls: callData ? callData.totalCalls : 0,
                audioCalls: callData ? callData.audioCalls : 0,
                videoCalls: callData ? callData.videoCalls : 0,
                totalChats: chatData ? chatData.totalChats : 0,
                walletBalance: astrologer.walletBalance,
                rating: astrologer.rating,
                pricePerCallMinute: astrologer.pricePerCallMinute,
                pricePerVideoCallMinute: astrologer.pricePerVideoCallMinute,
                pricePerChatMinute: astrologer.pricePerChatMinute,
            };
        });

        // Step 5: Sort astrologers by combined activity (calls + chats)
        astrologerData.sort((a, b) => (b.totalCalls + b.totalChats) - (a.totalCalls + a.totalChats));

        // Step 6: Return the result
        res.json({
            success: true,
            message: 'Top astrologers for this week',
            data: astrologerData,
        });
    } catch (error) {
        console.error('Error fetching top astrologers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top astrologers',
            error: error.message,
        });
    }
};
