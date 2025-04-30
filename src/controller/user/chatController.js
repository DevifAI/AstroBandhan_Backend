import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import Chat from "../../models/chatSchema.js";
import ChatRoom from "../../models/chatRoomSchema.js";

export const fetchChatHistory = async (req, res) => {
  try {
    const { chatRoomId } = req.body;
    const chatData = await Chat.findOne({ chatRoomId });
    if (!chatData) {
      return res.status(200).json(new ApiResponse(400, null, "No Data Found"));
    } else {
      return res
        .status(200)
        .json(new ApiResponse(400, chatData, "Chat Data Found"));
    }
  } catch (error) {}
};

export const fetchChatHistoryById = asyncHandler(async (req, res) => {
  try {
    const { chatRoomId } = req.body; // Can be either userId or astrologerId

    console.log({ chatRoomId });

    // Find chat rooms where the given ID is a participant

    // Find chat messages for these chat rooms
    const chatHistory = await Chat.find({
      chatRoomId: chatRoomId,
    }).sort({ "messages.timestamp": 1 });

console.log({chatHistory})

    return res
      .status(200)
      .json(
        new ApiResponse(200, chatHistory, "Chat history retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal server error"));
  }
});

export const fetchChatRoom_forUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body; // <-- get userId from payload

    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User ID is required"));
    }

    // Find chat rooms for the user with status 'active' or 'pending'
    const chatRooms = await ChatRoom.find({
      user: userId,
      status: { $in: ["active", "pending"] },
    })
      .populate({
        path: "astrologer", // populate astrologer details
        select: "name avatar", // select fields you want from astrologer
      })
      .sort({ updatedAt: -1 }); // optional: latest chat first

    if (!chatRooms.length) {
      return res
        .status(200)
        .json(new ApiResponse(400, null, "No chat rooms found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, chatRooms, "Chat rooms retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching chat rooms for user:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal server error"));
  }
});
