import ChatRoom from "../../../models/chatRoomSchema.js"
import { asyncHandler } from "../../../utils/asyncHandler.js"



export const getAstrology_History = asyncHandler(async (req, res) => {
    const chatRooms = ChatRoom.find({  })
    
})

