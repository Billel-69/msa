const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const db = require('../config/db'); 

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées - Profil
router.get('/me', verifyToken, authController.getProfile);
router.put('/me', verifyToken, authController.updateProfile);
router.put('/me/profile-picture', verifyToken, upload.single('profilePicture'), authController.updateProfilePicture);

// Routes spécifiques aux parents
router.post('/link-child', verifyToken, authController.linkChild);
router.post('/create-child', verifyToken, authController.createChildAccount);
router.get('/my-children', verifyToken, authController.getMyChildren);

// Routes de follow/unfollow
router.post('/follow/:id', verifyToken, authController.followUser);
router.post('/unfollow/:id', verifyToken, authController.unfollowUser);
router.get('/follow-status/:id', verifyToken, authController.getFollowStatus);

// Routes followers/following pour l'utilisateur connecté
router.get('/followers', verifyToken, authController.getFollowers);
router.get('/following', verifyToken, authController.getFollowing);

// ==========================================
// NOUVELLES ROUTES - Followers/Following d'autres utilisateurs
// ==========================================
router.get('/followers/:userId', verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        // Vérifier que l'utilisateur existe
        const [userCheck] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [targetUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Récupérer les followers (corriger le nom de table)
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

router.get('/following/:userId', verifyToken, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);

        // Vérifier que l'utilisateur existe
        const [userCheck] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [targetUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Récupérer les abonnements (corriger le nom de table)
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

// Route pour récupérer un utilisateur public
router.get('/users/:id', verifyToken, authController.getUserById);

module.exports = router;