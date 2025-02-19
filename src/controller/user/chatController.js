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
    const { id } = req.params; // Can be either userId or astrologerId

    if (!id) {
      return res.status(400).json(new ApiResponse(400, null, "ID is required"));
    }

    // Find chat rooms where the given ID is a participant
    const chatRooms = await ChatRoom.find({
      $or: [{ user: id }, { astrologer: id }],
    }).select("chatRoomId");

    if (!chatRooms.length) {
      return res
        .status(200)
        .json(new ApiResponse(400, null, "No chat history found"));
    }

    // Extract chat room IDs
    const chatRoomIds = chatRooms.map((room) => room.chatRoomId);

    // Find chat messages for these chat rooms
    const chatHistory = await Chat.find({
      chatRoomId: { $in: chatRoomIds },
    }).sort({ "messages.timestamp": 1 });

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
