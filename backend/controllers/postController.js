const db = require('../config/db');

// Récupérer le feed des posts
exports.getFeed = async (req, res) => {
    try {
        console.log('Récupération du feed des posts...');

        const [posts] = await db.execute(`
            SELECT p.*, u.name, u.username, u.profile_picture,
                   COUNT(DISTINCT pl.id) as likeCount,
                   COUNT(DISTINCT c.id) as commentCount
            FROM posts p
                     LEFT JOIN users u ON p.user_id = u.id
                     LEFT JOIN post_likes pl ON p.id = pl.post_id
                     LEFT JOIN comments c ON p.id = c.post_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
                LIMIT 50
        `);

        console.log(`Feed récupéré: ${posts.length} posts`);
        res.json(posts);
    } catch (err) {
        console.error('Erreur lors de la récupération du feed:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer un post spécifique
exports.getPostById = async (req, res) => {
    try {
        const postId = req.params.id;

        const [posts] = await db.execute(`
            SELECT p.*, u.name, u.username, u.profile_picture,
                   COUNT(DISTINCT pl.id) as likeCount,
                   COUNT(DISTINCT c.id) as commentCount
            FROM posts p
                     LEFT JOIN users u ON p.user_id = u.id
                     LEFT JOIN post_likes pl ON p.id = pl.post_id
                     LEFT JOIN comments c ON p.id = c.post_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [postId]);

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        res.json(posts[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Créer un post
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        const image = req.file ? req.file.filename : null;

        console.log('Création d\'un nouveau post:', { userId, content, image: !!image });

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Le contenu du post ne peut pas être vide' });
        }

        const [result] = await db.execute(
            'INSERT INTO posts (user_id, content, image, created_at) VALUES (?, ?, ?, NOW())',
            [userId, content.trim(), image]
        );

        // Récupérer le post créé avec les infos utilisateur
        const [newPost] = await db.execute(`
            SELECT p.*, u.name, u.username, u.profile_picture,
                   0 as likeCount, 0 as commentCount
            FROM posts p
                     LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        console.log('Post créé avec succès:', result.insertId);
        res.status(201).json(newPost[0]);
    } catch (err) {
        console.error('Erreur lors de la création du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprimer un post
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Vérifier que le post appartient à l'utilisateur
        const [post] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (post.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        if (post[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres posts' });
        }

        // Supprimer le post (les likes et commentaires seront supprimés par CASCADE)
        await db.execute('DELETE FROM posts WHERE id = ?', [postId]);

        res.json({ message: 'Post supprimé avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Liker/unliker un post
exports.likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        console.log('Toggle like post:', { postId, userId });

        // Vérifier si le post existe
        const [postExists] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        // Vérifier si l'utilisateur a déjà liké ce post
        const [existingLike] = await db.execute(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // Retirer le like
            await db.execute(
                'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            console.log('Like retiré');
            res.json({ liked: false, message: 'Like retiré' });
        } else {
            // Ajouter le like
            await db.execute(
                'INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())',
                [postId, userId]
            );
            console.log('Like ajouté');
            res.json({ liked: true, message: 'Post liké' });
        }
    } catch (err) {
        console.error('Erreur lors du toggle like post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Vérifier le statut de like d'un post
exports.checkLikeStatus = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const [like] = await db.execute(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        const [likeCount] = await db.execute(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
            [postId]
        );

        res.json({
            liked: like.length > 0,
            likeCount: likeCount[0].count
        });
    } catch (err) {
        console.error('Erreur lors de la vérification du statut de like:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};