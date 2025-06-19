const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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
router.get('/followers', verifyToken, authController.getFollowers);
router.get('/following', verifyToken, authController.getFollowing);

// NOUVELLE ROUTE - Récupérer un utilisateur public
router.get('/users/:id', verifyToken, authController.getUserById);

module.exports = router;