const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const flashCardsController = require('../controllers/flashCardsController_fixed');

// Flash Cards routes
// POST /api/games/flash-cards/start - Start a new game session
router.post('/flash-cards/start', authMiddleware, flashCardsController.startGame);

// POST /api/games/flash-cards/answer - Submit answer for a single card
router.post('/flash-cards/answer', authMiddleware, flashCardsController.submitAnswer);

// POST /api/games/flash-cards/complete - Complete a game session
router.post('/flash-cards/complete', authMiddleware, flashCardsController.completeSession);

// GET /api/games/flash-cards/stats/:userId - Get user statistics
router.get('/flash-cards/stats/:userId?', authMiddleware, flashCardsController.getUserStats);

// General game routes (for future expansion)

// GET /api/games/available - Get list of available games
router.get('/available', authMiddleware, async (req, res) => {
    try {
        const [games] = await require('../config/db').execute(
            'SELECT * FROM mini_games WHERE is_active = TRUE ORDER BY name'
        );
        res.json({ success: true, games });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des jeux' });
    }
});

// GET /api/games/leaderboard/:gameType - Get leaderboard for a game type
router.get('/leaderboard/:gameType', authMiddleware, async (req, res) => {
    try {
        const { gameType } = req.params;
        const { timeframe = '7d' } = req.query;
        
        const [leaderboard] = await require('../config/db').execute(`
            SELECT 
                u.name, 
                u.username, 
                u.profile_picture,
                ugp.total_xp,
                ugp.best_score,
                ugp.total_sessions
            FROM user_game_progress ugp
            JOIN users u ON ugp.user_id = u.id
            WHERE ugp.game_type = ?
            ORDER BY ugp.total_xp DESC
            LIMIT 10
        `, [gameType]);

        res.json({ success: true, leaderboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du classement' });
    }
});

// GET /api/games/user-progress/:userId - Get overall user game progress
router.get('/user-progress/:userId?', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        const [progress] = await require('../config/db').execute(`
            SELECT 
                game_type,
                total_sessions,
                total_xp,
                best_score,
                current_level,
                last_played
            FROM user_game_progress 
            WHERE user_id = ?
            ORDER BY last_played DESC
        `, [userId]);

        const [rewards] = await require('../config/db').execute(`
            SELECT 
                game_type,
                badge_earned,
                equipment_unlocked,
                earned_at
            FROM game_rewards 
            WHERE user_id = ? AND (badge_earned IS NOT NULL OR equipment_unlocked IS NOT NULL)
            ORDER BY earned_at DESC
            LIMIT 10
        `, [userId]);

        res.json({ 
            success: true, 
            progress: progress,
            recentRewards: rewards
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du progrès' });
    }
});

module.exports = router;
