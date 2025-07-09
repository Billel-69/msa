const db = require('../config/db');
const notificationService = require('../services/notificationService');

// Récupérer tous les commentaires d'un post
exports.getCommentsByPostId = async (req, res) => {
    try {
        const postId = req.params.postId;

        console.log('Récupération des commentaires pour le post:', postId);

        const [comments] = await db.execute(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at DESC
        `, [postId]);

        console.log('Commentaires trouvés:', comments.length);
        res.json(comments);
    } catch (err) {
        console.error('Erreur lors de la récupération des commentaires:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Ajouter un commentaire
exports.createComment = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userId = req.user.id;

        console.log('Création commentaire:', { postId, content, userId });

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
        }

        if (!postId) {
            return res.status(400).json({ error: 'L\'ID du post est requis' });
        }

        // Vérifier que le post existe
        const [postExists] = await db.execute('SELECT id, user_id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }
        const postAuthorId = postExists[0].user_id;

        // Insérer le commentaire
        const [result] = await db.execute(`
            INSERT INTO comments (post_id, user_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, content.trim()]);

        // Récupérer le commentaire créé avec les infos utilisateur
        const [newComment] = await db.execute(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        // Notify post author of new comment
        if (postAuthorId !== userId) {
            console.log('💬 Creating comment notification for post author:', postAuthorId, 'from user:', userId);
            // Get the commenter's name
            const [commenterInfo] = await db.execute('SELECT name FROM users WHERE id = ?', [userId]);
            const commenterName = commenterInfo[0]?.name || 'Un utilisateur';
            
            await notificationService.createNotification({
                userId: postAuthorId,
                type: 'comment',
                title: 'Nouveau commentaire',
                content: `${commenterName} a commenté votre publication.`,
                relatedId: result.insertId
            });
        } else {
            console.log('💬 Skipping comment notification - user commented on their own post');
        }
        res.status(201).json(newComment[0]);
    } catch (err) {
        console.error('Erreur lors de la création du commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        console.log('Suppression commentaire:', { commentId, userId });

        // Vérifier que le commentaire existe et appartient à l'utilisateur
        const [comment] = await db.execute(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Commentaire introuvable' });
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres commentaires' });
        }

        // Supprimer le commentaire
        await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);

        console.log('Commentaire supprimé');
        res.json({ message: 'Commentaire supprimé avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression du commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Liker/unliker un commentaire
exports.toggleCommentLike = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        console.log('Toggle like commentaire:', { commentId, userId });

        // Vérifier si le commentaire existe
        const [commentExists] = await db.execute('SELECT id FROM comments WHERE id = ?', [commentId]);
        if (commentExists.length === 0) {
            return res.status(404).json({ error: 'Commentaire introuvable' });
        }

        // Vérifier si l'utilisateur a déjà liké ce commentaire
        const [existingLike] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existingLike.length > 0) {
            // Retirer le like
            await db.execute(
                'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );
            res.json({ liked: false, message: 'Like retiré' });
        } else {
            // Ajouter le like
            await db.execute(
                'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())',
                [commentId, userId]
            );
            res.json({ liked: true, message: 'Commentaire liké' });
        }
    } catch (err) {
        console.error('Erreur lors du toggle like commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Obtenir le statut de like d'un commentaire
exports.getCommentLikeStatus = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        const [like] = await db.execute(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        const [likeCount] = await db.execute(
            'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?',
            [commentId]
        );

        res.json({
            liked: like.length > 0,
            likeCount: likeCount[0].count
        });
    } catch (err) {
        console.error('Erreur lors de la récupération du statut de like:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};