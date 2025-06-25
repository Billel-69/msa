const express = require('express');
const router = express.Router();
const flashCardsController = require('../controllers/flashCardsControllerSimple');

// Simple middleware to bypass auth for testing
const testAuth = (req, res, next) => {
    req.user = { userId: 1, username: 'testuser' }; // Mock user for testing
    next();
};

// Flash Cards routes (testing version)
router.post('/flash-cards/start', testAuth, flashCardsController.startGame);
router.post('/flash-cards/answer', testAuth, flashCardsController.submitAnswer);
router.post('/flash-cards/complete', testAuth, flashCardsController.completeSession);
router.get('/flash-cards/stats/:userId?', testAuth, flashCardsController.getUserStats);

// Get list of available games
router.get('/available', testAuth, async (req, res) => {
    try {
        const [games] = await require('../config/db').execute(
            'SELECT * FROM mini_games WHERE is_active = TRUE ORDER BY name'
        );
        res.json({ success: true, games });
    } catch (error) {
        console.error('Error getting available games:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des jeux' });
    }
});

// Get leaderboard for a game type
router.get('/leaderboard/:gameType', testAuth, async (req, res) => {
    try {
        const { gameType } = req.params;
        
        // Mock leaderboard data for testing
        const mockLeaderboard = [
            { name: 'Test User', username: 'testuser', total_xp: 150, best_score: 85, total_sessions: 5 },
            { name: 'Player 2', username: 'player2', total_xp: 120, best_score: 78, total_sessions: 3 },
            { name: 'Player 3', username: 'player3', total_xp: 95, best_score: 65, total_sessions: 4 }
        ];

        res.json({ success: true, leaderboard: mockLeaderboard });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du classement' });
    }
});

module.exports = router;
