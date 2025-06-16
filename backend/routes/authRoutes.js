const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');  // protection token

// Route d'inscription
router.post('/register', authController.register);

// Route de connexion
router.post('/login', authController.login);

// Route pour récupérer le profil (protégée par token)
router.get('/me', verifyToken, authController.getProfile);

module.exports = router;
// Route pour mettre à jour le profil (protégée par token)
router.put('/me', verifyToken, authController.updateProfile);
