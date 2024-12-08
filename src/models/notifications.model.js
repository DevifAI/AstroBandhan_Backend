const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true
    },
    message: {
      type: String,
      required: true, // Ensure the message is required
    },
    read: {
      type: Boolean,
      default: false, // By default, notifications are unread
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // This adds createdAt and updatedAt fields automatically
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
