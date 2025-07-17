const db = require('../config/db');
const notificationService = require('../services/notificationService');

exports.followUser = async (req, res) => {
    const userId = req.user.id;
    const followedId = req.params.id;
    try {
        await db.execute(
            'INSERT IGNORE INTO followers (follower_id, followed_id) VALUES (?, ?)',
            [userId, followedId]
        );
        // Create notification for the followed user
        await notificationService.createNotification({
            userId: followedId,
            type: 'follow',
            title: 'Nouvel abonné',
            content: `${req.user.name || 'Un utilisateur'} vous suit.`,
            relatedId: userId
        });
        res.json({ message: 'Utilisateur suivi' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.unfollowUser = async (req, res) => {
    const userId = req.user.id;
    const followedId = req.params.id;
    try {
        await db.execute('DELETE FROM followers WHERE follower_id = ? AND followed_id = ?', [userId, followedId]);
        res.json({ message: 'Utilisateur désabonné' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getFollowers = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.execute(`
            SELECT u.id, u.name, u.email FROM users u
            JOIN followers f ON u.id = f.follower_id
            WHERE f.followed_id = ?`, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getFollowing = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.execute(`
            SELECT u.id, u.name, u.email FROM users u
            JOIN followers f ON u.id = f.followed_id
            WHERE f.follower_id = ?`, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
