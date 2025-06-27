const express = require('express');
const router = express.Router();
const Game = require('../models/mongodb/Game');
const GameProgress = require('../models/mongodb/GameProgress');
const { verifyToken } = require('../middlewares/authMiddleware');

// recupérer tous les jeux disponibles
// protéger cette route avec le middleware verifyToken et isChildOrStudent
router.get('/available', verifyToken, async (req, res) => {
    try {
        const games = await Game.find({ status: 'active' })
            .select('name description type difficulty subject imageUrl xpReward fragmentsReward');
        
        res.json({ games });
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).json({ error: 'Erreur lors du chargement des jeux' });
    }
});

// récupérer les détails d'un jeu spécifique par ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Jeu non trouvé' });
        }

        if (game.status !== 'active') {
            return res.status(403).json({ error: 'Ce jeu n\'est pas disponible actuellement' });
        }
        
        res.json({ game });
    } catch (err) {
        console.error('Error fetching game details:', err);
        res.status(500).json({ error: 'Erreur lors du chargement du jeu' });
    }
});

// soumettre les résultats d'un jeu
router.post('/:id/results', verifyToken, async (req, res) => {
    try {
        const { score, timeSpent, accuracy } = req.body;
        const userId = req.user.id;
        const gameId = req.params.id;
        
        // trouver le jeu par ID
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Jeu non trouvé' });
        }
        
        // calculer les récompenses basées sur le score
        const scorePercentage = Math.min(Math.max(score, 0), 100) / 100;
        const xpEarned = Math.round(game.xpReward * scorePercentage);
        const fragmentsEarned = score >= 70 ? game.fragmentsReward : 0; // Only earn fragments if score is high enough
        
        // Check if this is a personal best
        const existingProgress = await GameProgress.findOne({ userId, gameId });
        const isPersonalBest = !existingProgress || score > existingProgress.bestScore;
        
        // mis a jour ou créer la progression du jeu
        let progress = await GameProgress.findOne({ userId, gameId });
        
        if (progress) {
            // mise à jour de la progression existante
            progress.sessionsCompleted += 1;
            progress.bestScore = Math.max(progress.bestScore, score);
            progress.totalXpEarned += xpEarned;
            progress.totalFragmentsEarned += fragmentsEarned;
            progress.lastPlayedAt = Date.now();
            progress.completed = true;
            progress.score = score;
            progress.accuracy = accuracy || 0;
            
            await progress.save();
        } else {
            // création d'une nouvelle progression
            progress = new GameProgress({
                userId,
                gameId,
                sessionsCompleted: 1,
                bestScore: score,
                totalXpEarned: xpEarned, 
                totalFragmentsEarned: fragmentsEarned,
                lastPlayedAt: Date.now(),
                completed: true,
                score: score,
                accuracy: accuracy || 0
            });
            
            await progress.save();
        }
        
        res.json({
            success: true,
            results: {
                score,
                xpEarned,
                fragmentsEarned,
                isPersonalBest,
                message: 'Résultat enregistré avec succès'
            }
        });
    } catch (err) {
        console.error('Error saving game results:', err);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement des résultats' });
    }
});

// recupérer la progression des jeux de l'utilisateur
router.get('/progress', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const progress = await GameProgress.find({ userId })
            .populate('gameId', 'name type subject')
            .sort({ lastPlayedAt: -1 });
            
        res.json({ progress });
    } catch (err) {
        console.error('Error fetching game progress:', err);
        res.status(500).json({ error: 'Erreur lors du chargement de la progression' });
    }
});

module.exports = router;