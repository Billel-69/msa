
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.createPost = async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.filename;
    }
    try {
        await db.execute('INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', [userId, content, imagePath]);
        res.status(201).json({ message: 'Post créé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFeed = async (req, res) => {
    const userId = req.user.id;
    try {
        const [feed] = await db.execute(`
            SELECT p.*, u.name, 
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likeCount,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS commentCount
            FROM posts p JOIN users u ON p.user_id = u.id 
            WHERE p.user_id = ? OR p.user_id IN (SELECT followed_id FROM followers WHERE follower_id = ?)
            ORDER BY p.created_at DESC
        `, [userId, userId]);
        res.json(feed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.likePost = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;
    try {
        const [rows] = await db.execute('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
        if (rows.length > 0) {
            await db.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
            res.json({ message: 'Like retiré' });
        } else {
            await db.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            res.json({ message: 'Post liké' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
