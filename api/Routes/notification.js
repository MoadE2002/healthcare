// Import required modules
const express = require('express');
const Notification = require('../models/Notification'); 

const notificationRouter = express.Router();

// GET /api/notifications - Fetch notifications
notificationRouter.get('/:id',  async (req, res) => {
  try {
    const userId = req.params.id; // Extracted from the JWT by the middleware
    console.log("hahowa l user "  + userId)
    // Fetch notifications from the database
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

    // Separate unread and read notifications
    const unread = notifications.filter(notification => !notification.isRead);
    const read = notifications.filter(notification => notification.isRead);

    res.status(200).json({ unread, read });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
notificationRouter.patch('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId },
      { isRead: true },
      { new: true } // Return the updated document
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications - Clear all notifications
notificationRouter.delete('/:id',  async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete all notifications for the user
    await Notification.deleteMany({ user: userId });

    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

module.exports = notificationRouter;
