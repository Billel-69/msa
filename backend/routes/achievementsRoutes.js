const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');

// GET /api/achievements/user/:userId - Récupérer les accomplissements d'un utilisateur
router.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        // Pour l'instant, retourner un tableau vide
        // Cette route peut être développée plus tard avec une vraie table d'achievements
        res.json([]);
    } catch (err) {
        console.error('Erreur lors de la récupération des accomplissements:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;