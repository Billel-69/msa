// Fichier de routes pour la gestion des commentaires

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const verifyToken = require('../middlewares/authMiddleware');

// --- Routes pour les Commentaires ---
// Toutes ces routes sont protégées et nécessitent une authentification

// GET /api/comments/:postId - Récupère tous les commentaires pour un post spécifique
router.get('/:postId', verifyToken, commentController.getCommentsByPostId);

// POST /api/comments - Crée un nouveau commentaire
router.post('/', verifyToken, commentController.createComment);

// PUT /api/comments/:id - Met à jour un commentaire existant
router.put('/:id', verifyToken, commentController.updateComment);

// DELETE /api/comments/:id - Supprime un commentaire
router.delete('/:id', verifyToken, commentController.deleteComment);


// --- Routes pour les Likes sur les Commentaires ---

// POST /api/comments/:id/like - Ajoute ou retire un like sur un commentaire
router.post('/:id/like', verifyToken, commentController.toggleCommentLike);

// GET /api/comments/:id/like-status - Vérifie si l'utilisateur a liké un commentaire et récupère le nombre de likes
router.get('/:id/like-status', verifyToken, commentController.getCommentLikeStatus);

module.exports = router;