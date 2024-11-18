import mongoose from 'mongoose'; // Import mongoose

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User ' }, // User ID to whom the notification is sent
    message: { type: String, required: true }, // Notification message
    read: { type: Boolean, default: false }, // Whether the notification is read or not
    timestamp: { type: Date, default: Date.now }, // Time the notification was created
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create a model based on the schema
const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;