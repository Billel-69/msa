// Fichier de routes pour la gestion des relations de suivi (follow/unfollow)

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const followController = require('../controllers/followController');

// --- Routes Protégées ---
// Toutes ces routes nécessitent une authentification de l'utilisateur

// POST /api/follow/follow/:id - Permet à l'utilisateur connecté de suivre un autre utilisateur
router.post('/follow/:id', verifyToken, followController.followUser);

// POST /api/follow/unfollow/:id - Permet à l'utilisateur connecté de ne plus suivre un autre utilisateur
router.post('/unfollow/:id', verifyToken, followController.unfollowUser);

// GET /api/follow/followers - Récupère la liste des abonnés (followers) de l'utilisateur connecté
router.get('/followers', verifyToken, followController.getFollowers);

// GET /api/follow/following - Récupère la liste des utilisateurs que l'utilisateur connecté suit (abonnements)
router.get('/following', verifyToken, followController.getFollowing);

module.exports = router;
