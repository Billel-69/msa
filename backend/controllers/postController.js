// Contrôleur pour la gestion des posts

const db = require('../config/db');

// Récupère le fil d'actualité des posts pour tous les utilisateurs
exports.getFeed = async (req, res) => {
    try {
        // Log pour le débogage
        console.log('Récupération du feed des posts...');

        // Récupère les posts avec les informations de l'auteur, le nombre de likes et de commentaires
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

        // Log du nombre de posts récupérés
        console.log(`Feed récupéré: ${posts.length} posts`);
        res.json(posts);
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la récupération du feed:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupère un post spécifique par son ID
exports.getPostById = async (req, res) => {
    try {
        const postId = req.params.id;

        // Récupère le post et les informations associées
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

        // Vérifie si le post a été trouvé
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        res.json(posts[0]);
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la récupération du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Crée un nouveau post
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        const image = req.file ? req.file.filename : null; // Récupère le nom du fichier de l'image s'il y en a une

        // Log de la tentative de création
        console.log('Création d\'un nouveau post:', { userId, content, image: !!image });

        // Valide que le contenu n'est pas vide
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Le contenu du post ne peut pas être vide' });
        }

        // Insère le post dans la base de données
        const [result] = await db.execute(
            'INSERT INTO posts (user_id, content, image, created_at) VALUES (?, ?, ?, NOW())',
            [userId, content.trim(), image]
        );

        // Récupère le post nouvellement créé pour le renvoyer dans la réponse
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
        // Gestion des erreurs
        console.error('Erreur lors de la création du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprime un post
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Vérifie que le post appartient bien à l'utilisateur qui fait la requête
        const [post] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (post.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        if (post[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres posts' });
        }

        // Supprime le post (les likes et commentaires associés sont supprimés en cascade grâce à la configuration de la BDD)
        await db.execute('DELETE FROM posts WHERE id = ?', [postId]);

        res.json({ message: 'Post supprimé avec succès' });
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la suppression du post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Gère le like ou l'unlike d'un post
exports.likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Log de l'action
        console.log('Toggle like post:', { postId, userId });

        // Vérifie si le post existe
        const [postExists] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        // Vérifie si l'utilisateur a déjà liké ce post
        const [existingLike] = await db.execute(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLike.length > 0) {
            // Si le like existe, le retire (unlike)
            await db.execute(
                'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            console.log('Like retiré');
            res.json({ liked: false, message: 'Like retiré' });
        } else {
            // Sinon, ajoute le like
            await db.execute(
                'INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())',
                [postId, userId]
            );
            console.log('Like ajouté');
            res.json({ liked: true, message: 'Post liké' });
        }
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors du toggle like post:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Vérifie si un utilisateur a liké un post et renvoie le nombre total de likes
exports.checkLikeStatus = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Cherche le like de l'utilisateur
        const [like] = await db.execute(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        // Compte le nombre total de likes pour le post
        const [likeCount] = await db.execute(
            'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
            [postId]
        );

        // Renvoie le statut (liké ou non) et le nombre de likes
        res.json({
            liked: like.length > 0,
            likeCount: likeCount[0].count
        });
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la vérification du statut de like:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};