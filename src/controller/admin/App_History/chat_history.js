import ChatRoom from "../../../models/chatRoomSchema.js";
import Chat from "../../../models/chatSchema.js"; // Assuming 'Chat' is the model for chats
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const getChatRoom_History = asyncHandler(async (req, res) => {
  try {
    // Fetch chat rooms and populate user and astrologer fields
    const chatRooms = await ChatRoom.find({})
      .populate("user") // Populate user field
      .populate("astrologer") // Populate astrologer field
      .lean(); // To get plain JavaScript objects for easier manipulation

    // Map through each chat room to gather the necessary details
    const chatHistory = await Promise.all(
      chatRooms.map(async (chatRoom) => {
        // Get the chat document based on chatRoomId
        const chat = await Chat.findOne({ chatRoomId: chatRoom.chatRoomId });

        // Calculate total amount based on astrologer's price per minute and commission
        let totalAmount = 0;
        let durationInMinutes = 0;

        if (chat) {
          // Calculate the duration in minutes
          const startTime = chat.createdAt;
          const endTime = chat.updatedAt;

          // Calculate the difference in milliseconds
          const durationInMilliseconds = endTime - startTime;

          // Convert milliseconds to minutes
          durationInMinutes = Math.ceil(durationInMilliseconds / 60000); // Round up to the nearest minute

          // If duration is less than 1 minute, we treat it as 1 minute
          if (durationInMinutes < 1) {
            durationInMinutes = 1;
          }

          // Calculate total amount by astrologer's price and commission
          totalAmount =
            durationInMinutes * chatRoom.astrologer.pricePerChatMinute -
            durationInMinutes * chatRoom.astrologer.chatCommission;
        }

        // Format start and end time to show only the time portion (HH:mm:ss)
        const startedTime = chatRoom.createdAt.toLocaleTimeString("en-US", {
          hour12: false,
        });
        const endedTime = chatRoom.updatedAt.toLocaleTimeString("en-US", {
          hour12: false,
        });

        // Format and return the data
        return {
          astrologerName: chatRoom.astrologer.name, // Astrologer name
          userName: chatRoom.user.name, // User name
          chatDuration: durationInMinutes, // Chat Duration in minutes
          startedTime: startedTime, // Started Time (formatted)
          endedTime: endedTime, // Ended Time (formatted)
          chatRoomId: chatRoom.chatRoomId, // Chat Room ID
          totalAmount: totalAmount, // Total Amount after commission
        };
      })
    );

    // Return the chat history data as a JSON response
    return res.status(200).json(chatHistory);
  } catch (error) {
    // Error handling
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const getChatRoomHistoryByDateRange = asyncHandler(async (req, res) => {
  try {
    const { newFromDate, newToDate } = req.body;
    // Validate the date formats
    if (
      !/^\d{2}-\d{2}-\d{4}$/.test(newFromDate) ||
      !/^\d{2}-\d{2}-\d{4}$/.test(newToDate)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid date format. Use dd-mm-yyyy for both 'from' and 'to' dates.",
        });
    }

    // Convert the input dates (dd-mm-yyyy) to JavaScript Date objects
    const [fromDay, fromMonth, fromYear] = newFromDate.split("-");
    const [toDay, toMonth, toYear] = newToDate.split("-");

    const fromDate = new Date(
      `${fromYear}-${fromMonth}-${fromDay}T00:00:00.000Z`
    ); // Start of the 'from' date
    const toDate = new Date(`${toYear}-${toMonth}-${toDay}T23:59:59.999Z`); // End of the 'to' date

    // Fetch chat rooms created between the 'from' and 'to' dates
    const chatRooms = await ChatRoom.find({
      createdAt: {
        $gte: fromDate, // Greater than or equal to the start of the 'from' date
        $lte: toDate, // Less than or equal to the end of the 'to' date
      },
    })
      .populate("user") // Populate user field
      .populate("astrologer") // Populate astrologer field
      .lean(); // Convert to plain JavaScript objects

    // Map through each chat room to gather the necessary details
    const chatHistory = await Promise.all(
      chatRooms.map(async (chatRoom) => {
        // Get the chat document based on chatRoomId
        const chat = await Chat.findOne({ chatRoomId: chatRoom.chatRoomId });

        // Calculate total amount based on astrologer's price per minute and commission
        let totalAmount = 0;
        let durationInMinutes = 0;

        if (chat) {
          // Calculate the duration in minutes
          const startTime = chat.createdAt;
          const endTime = chat.updatedAt;

          // Calculate the difference in milliseconds
          const durationInMilliseconds = endTime - startTime;

          // Convert milliseconds to minutes
          durationInMinutes = Math.ceil(durationInMilliseconds / 60000); // Round up to the nearest minute

          // If duration is less than 1 minute, treat it as 1 minute
          if (durationInMinutes < 1) {
            durationInMinutes = 1;
          }

          // Calculate total amount by astrologer's price and commission
          totalAmount =
            durationInMinutes * chatRoom.astrologer.pricePerChatMinute -
            durationInMinutes * chatRoom.astrologer.chatCommission;
        }

        // Format start and end time to show only the time portion (HH:mm:ss)
        const startedTime = chatRoom.createdAt.toLocaleTimeString("en-US", {
          hour12: false,
        });
        const endedTime = chatRoom.updatedAt.toLocaleTimeString("en-US", {
          hour12: false,
        });

        // Format and return the data
        return {
          astrologerName: chatRoom.astrologer.name, // Astrologer name
          userName: chatRoom.user.name, // User name
          chatDuration: durationInMinutes, // Chat Duration in minutes
          startedTime: startedTime, // Started Time (formatted)
          endedTime: endedTime, // Ended Time (formatted)
          chatRoomId: chatRoom.chatRoomId, // Chat Room ID
          totalAmount: totalAmount, // Total Amount after commission
        };
      })
    );

    // Return the chat history data as a JSON response
    return res.status(200).json(chatHistory);
  } catch (error) {
    // Error handling
    console.error("Error fetching chat history by date range:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export const getChat_History = asyncHandler(async (req, res) => {
  try {
    const { chatRoomId } = req.body;
    const chatsData = await Chat.find({ chatRoomId });
    // Fetch chat rooms and populate user and astrologer fields

    // Return the chat history data as a JSON response
    return res.status(200).json(chatsData);
  } catch (error) {
    // Error handling
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
