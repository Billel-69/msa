const db = require('../config/db');

const notificationService = {
  // Create a new notification
  async createNotification({ userId, type, title, content, relatedId }) {
    console.log('🔔 Creating notification:', { userId, type, title, content, relatedId });
    try {
      const [result] = await db.execute(
        'INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)',
        [userId, type, title, content, relatedId]
      );
      console.log('✅ Notification created with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  // Get all notifications for a user
  async getNotifications(userId) {
    console.log('📖 Getting notifications for user:', userId);
    try {
      const [rows] = await db.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      console.log('📖 Retrieved notifications:', rows.length, 'rows:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error retrieving notifications:', error);
      throw error;
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId, userId) {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },
    // Mark all notifications as read
    async markAllAsRead(userId) {
        const [result] = await db.execute(
          'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
          [userId]
        );
        return result.affectedRows > 0;
      },

};

module.exports = notificationService;
