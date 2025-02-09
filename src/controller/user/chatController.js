import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import Chat from "../../models/chatSchema.js";

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
