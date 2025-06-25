// Fichier de routes pour la gestion des posts

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const db = require('../config/db');

// ===== ROUTES PRINCIPALES POUR LES POSTS =====

// GET /api/posts/feed - Récupère le fil d'actualité général des posts.
// Nécessite une authentification.
router.get('/feed', verifyToken, postController.getFeed);

// POST /api/posts - Crée un nouveau post.
// Le middleware `upload.single('image')` gère le téléversement d'une image associée au post.
// Nécessite une authentification.
router.post('/posts', verifyToken, upload.single('image'), postController.createPost);

// GET /api/posts/:id - Récupère un post spécifique par son ID.
// Nécessite une authentification.
router.get('/posts/:id', verifyToken, postController.getPostById);

// DELETE /api/posts/:id - Supprime un post spécifique par son ID.
// Seul l'auteur du post peut le supprimer (vérification dans le contrôleur).
// Nécessite une authentification.
router.delete('/posts/:id', verifyToken, postController.deletePost);

// ===== ROUTES POUR LES LIKES SUR LES POSTS =====

// POST /api/posts/:id/like - Ajoute ou retire un "like" sur un post.
// L'action (like/unlike) est gérée par le contrôleur.
// Nécessite une authentification.
router.post('/posts/:id/like', verifyToken, postController.likePost);

// GET /api/posts/:id/like-status - Vérifie si l'utilisateur connecté a liké un post et récupère le nombre total de likes.
// Nécessite une authentification.
router.get('/posts/:id/like-status', verifyToken, postController.checkLikeStatus);

// ===== ROUTES POUR LES POSTS D'UN UTILISATEUR SPÉCIFIQUE =====

// GET /api/posts/user/:userId - Récupère tous les posts d'un utilisateur donné par son ID.
// Nécessite une authentification.
router.get('/posts/user/:userId', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Log pour le débogage
        console.log('Récupération des posts pour l\'utilisateur:', userId);

        // Requête pour récupérer les posts de l'utilisateur avec les comptes de likes et de commentaires
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
        // Gestion des erreurs
        console.error('Erreur lors de la récupération des posts utilisateur:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;