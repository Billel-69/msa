const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const verifyToken = require('../middlewares/authMiddleware');

// Ajouter un commentaire à un post
router.post('/posts/:id/comments', verifyToken, commentController.addComment);

// Récupérer les commentaires d'un post
router.get('/posts/:id/comments', verifyToken, commentController.getComments);

// Supprimer un commentaire (seulement le propriétaire)
router.delete('/comments/:id', verifyToken, commentController.deleteComment);

module.exports = router;