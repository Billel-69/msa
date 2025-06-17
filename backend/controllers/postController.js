const db = require('../config/db');

// Créer un post
exports.createPost = async (req, res) => {
    const { text } = req.body;
    const userId = req.user.id;
    let imagePath = null;

    if (req.file) {
        imagePath = req.file.filename;
    }

    try {
        await db.execute(
            'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
            [userId, text, imagePath]
        );
        res.status(201).json({ message: 'Post créé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Récupérer le feed avec compteurs de likes et commentaires
exports.getFeed = async (req, res) => {
    try {
        const [feed] = await db.execute(`
            SELECT p.*, u.name,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likeCount,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS commentCount
            FROM posts p
                     JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(feed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Like / Unlike un post
exports.likePost = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;

    try {
        // Vérifier si le post existe
        const [postExists] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        // Vérifier si l'utilisateur a déjà liké ce post
        const [existingLike] = await db.execute(
            'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existingLike.length > 0) {
            // Retirer le like
            await db.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
            res.json({ message: 'Like retiré', liked: false });
        } else {
            // Ajouter le like
            await db.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            res.json({ message: 'Post liké', liked: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Vérifier si un utilisateur a liké un post
exports.checkLikeStatus = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;

    try {
        const [like] = await db.execute(
            'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        res.json({ liked: like.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};