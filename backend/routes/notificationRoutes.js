const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// Protect all notification routes
router.use(verifyToken);

// Get all notifications for the logged-in user
router.get('/', getNotifications);

// Mark a single notification as read
router.put('/read/:id', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Debug route to create a test notification
router.post('/debug/create-test', async (req, res) => {
    try {
        const notificationService = require('../services/notificationService');
        const userId = req.user.id;
        
        console.log('🧪 Debug: Creating test notification for user:', userId);
        
        const notificationId = await notificationService.createNotification({
            userId: userId,
            type: 'comment',
            title: 'Test notification',
            content: 'This is a test notification to verify the system works.',
            relatedId: 1
        });
        
        console.log('🧪 Debug: Test notification created with ID:', notificationId);
        
        // Also fetch and return the notifications for this user
        const notifications = await notificationService.getNotifications(userId);
        
        res.json({ 
            success: true, 
            message: 'Test notification created successfully',
            notificationId: notificationId,
            totalNotifications: notifications.length,
            notifications: notifications
        });
    } catch (error) {
        console.error('❌ Error creating test notification:', error);
        res.status(500).json({ error: 'Failed to create test notification', details: error.message });
    }
});

// Debug route to check database connection
router.get('/debug/db-test', async (req, res) => {
    try {
        const db = require('../config/db');
        const [result] = await db.execute('SELECT COUNT(*) as count FROM notifications');
        res.json({
            success: true,
            message: 'Database connection working',
            totalNotifications: result[0].count
        });
    } catch (error) {
        console.error('❌ Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

module.exports = router;