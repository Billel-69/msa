const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const db = require('../config/db');

// ===== ROUTES PRINCIPALES =====

// GET /api/feed - Récupérer le feed des posts
router.get('/feed', verifyToken, postController.getFeed);

// POST /api/posts - Créer un nouveau post
router.post('/posts', verifyToken, upload.single('image'), postController.createPost);

// GET /api/posts/:id - Récupérer un post spécifique
router.get('/posts/:id', verifyToken, postController.getPostById);

// DELETE /api/posts/:id - Supprimer un post
router.delete('/posts/:id', verifyToken, postController.deletePost);

// ===== ROUTES POUR LES LIKES =====

// POST /api/posts/:id/like - Liker/unliker un post
router.post('/posts/:id/like', verifyToken, postController.likePost);

// GET /api/posts/:id/like-status - Vérifier le statut de like
router.get('/posts/:id/like-status', verifyToken, postController.checkLikeStatus);

// ===== ROUTES POUR LES UTILISATEURS =====

// GET /api/posts/user/:userId - Récupérer les posts d'un utilisateur spécifique
router.get('/posts/user/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        console.log('Récupération des posts pour l\'utilisateur:', userId);

        const [posts] = await db.execute(`
            SELECT p.*, u.name, u.username, u.profile_picture,
                   COUNT(DISTINCT pl.id) as likeCount,
                   COUNT(DISTINCT c.id) as commentCount
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_likes pl ON p.id = pl.post_id
            LEFT JOIN comments c ON p.id = c.post_id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [userId]);

        console.log('Posts trouvés:', posts.length);
        res.json(posts);
    } catch (err) {
        console.error('Erreur lors de la récupération des posts utilisateur:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/posts/user/:userId/count - Récupérer le nombre de posts d'un utilisateur
router.get('/posts/user/:userId/count', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const [countResult] = await db.execute(`
            SELECT COUNT(*) as count
            FROM posts
            WHERE user_id = ?
        `, [userId]);

        res.json({ count: countResult[0].count });
    } catch (err) {
        console.error('Erreur lors du comptage des posts:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;