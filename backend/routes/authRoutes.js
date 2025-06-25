// Fichier de routes pour l'authentification et la gestion des utilisateurs

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const db = require('../config/db'); // Importation de la connexion à la base de données

// --- Routes Publiques ---
// Ces routes ne nécessitent pas d'authentification

// Inscription d'un nouvel utilisateur
router.post('/register', authController.register);
// Connexion d'un utilisateur
router.post('/login', authController.login);

// --- Routes Protégées ---
// Ces routes nécessitent un jeton JWT valide (l'utilisateur doit être connecté)

// Profil de l'utilisateur connecté
router.get('/me', verifyToken, authController.getProfile);
router.put('/me', verifyToken, authController.updateProfile);
router.put('/me/profile-picture', verifyToken, upload.single('profilePicture'), authController.updateProfilePicture);

// Actions spécifiques aux parents
router.post('/link-child', verifyToken, authController.linkChild); // Lier un enfant existant
router.post('/create-child', verifyToken, authController.createChildAccount); // Créer un nouveau compte enfant
router.get('/my-children', verifyToken, authController.getMyChildren); // Obtenir la liste des enfants liés

// Suivre ou ne plus suivre un utilisateur
router.post('/follow/:id', verifyToken, authController.followUser);
router.post('/unfollow/:id', verifyToken, authController.unfollowUser);
router.get('/follow-status/:id', verifyToken, authController.getFollowStatus); // Vérifier si l'utilisateur connecté suit un autre utilisateur

// Obtenir les listes de followers/following pour l'utilisateur connecté
router.get('/followers', verifyToken, authController.getFollowers);
router.get('/following', verifyToken, authController.getFollowing);

// --- Nouvelles Routes pour Consulter les Followers/Following d'AUTRES Utilisateurs ---

// Obtenir la liste des followers d'un utilisateur spécifique par son ID
router.get('/followers/:userId', verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        // Vérifie si l'utilisateur cible existe
        const [userCheck] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [targetUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Récupère les followers de l'utilisateur cible
        const [followers] = await db.execute(`
            SELECT u.id, u.name, u.username, u.profile_picture, u.account_type
            FROM followers f
            JOIN users u ON f.follower_id = u.id
            WHERE f.followed_id = ?
            ORDER BY f.created_at DESC
        `, [targetUserId]);

        res.json(followers);
    } catch (error) {
        console.error('Erreur lors de la récupération des followers:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Obtenir la liste des utilisateurs suivis (following) par un utilisateur spécifique
router.get('/following/:userId', verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        // Vérifie si l'utilisateur cible existe
        const [userCheck] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [targetUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Récupère les utilisateurs que l'utilisateur cible suit
        const [following] = await db.execute(`
            SELECT u.id, u.name, u.username, u.profile_picture, u.account_type
            FROM followers f
            JOIN users u ON f.followed_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `, [targetUserId]);

        res.json(following);
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Obtenir les informations publiques d'un utilisateur par son ID
router.get('/users/:id', verifyToken, authController.getUserById);

module.exports = router;