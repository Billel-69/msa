const notificationService = require('../services/notificationService');

// Get all notifications for a user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('📬 Fetching notifications for user:', userId);
        const notifications = await notificationService.getNotifications(userId);
        console.log('📬 Found notifications:', notifications.length);
        res.json(notifications);
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ error: 'Server error while fetching notifications.' });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        const success = await notificationService.markAsRead(notificationId, userId);
        if (!success) {
            return res.status(404).json({ error: 'Notification not found or not owned by user.' });
        }
        res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Server error while marking notification as read.' });
    }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const success = await notificationService.markAllAsRead(userId);
        res.status(200).json({ message: 'All notifications marked as read.', success });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Server error while marking all notifications as read.' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
