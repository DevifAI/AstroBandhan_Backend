import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer' },
        chatRoomId: { type: String, unique: true },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        isUserJoined: { type: Boolean, default: true },  // Track if user has joined
        isAstrologerJoined: { type: Boolean, default: false }  // Track if astrologer has joined
    },
    { timestamps: true }
);

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
