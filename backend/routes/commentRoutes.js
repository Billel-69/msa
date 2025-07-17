const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Routes pour les commentaires
// GET /api/comments/:postId - Récupérer les commentaires d'un post
router.get('/:postId', verifyToken, commentController.getCommentsByPostId);

// POST /api/comments - Ajouter un commentaire
router.post('/', verifyToken, commentController.createComment);

// DELETE /api/comments/:id - Supprimer un commentaire
router.delete('/:id', verifyToken, commentController.deleteComment);

// Routes pour les likes de commentaires
// POST /api/comments/:id/like - Liker/unliker un commentaire
router.post('/:id/like', verifyToken, commentController.toggleCommentLike);

// GET /api/comments/:id/like-status - Obtenir le statut de like
router.get('/:id/like-status', verifyToken, commentController.getCommentLikeStatus);

module.exports = router;