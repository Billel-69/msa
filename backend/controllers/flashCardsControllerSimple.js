const db = require('../config/db');
const ContentTemplateService = require('../services/contentTemplateService');

/**
 * Contrôleur Flash Cards Simplifié
 * Version allégée pour les tests et le prototypage
 * Gère le cycle de vie complet d'une session de jeu Flash Cards
 */
class FlashCardsControllerSimple {
    constructor() {
        // Initialisation du service de contenu statique
        this.contentService = new ContentTemplateService();
    }    // Démarrer une nouvelle session Flash Cards
    // Cette méthode initialise une session de jeu avec questions personnalisées
    async startGame(req, res) {
        try {
            // Récupération de l'ID utilisateur (fallback pour les tests)
            const userId = req.user?.userId || 1; 
            const { 
                subject = 'mathematics',      // Sujet par défaut : mathématiques
                difficulty = 'moyen',         // Difficulté par défaut : moyenne
                cycle = 'cycle_4',           // Cycle scolaire (collège)
                theme = 'default',           // Thème visuel du jeu
                quantity = 8                 // Nombre de cartes dans la session
            } = req.body;

            console.log('Démarrage session Flash Cards:', { userId, subject, difficulty, cycle });            // Rechercher ou créer une définition de jeu dans la base
            let [gameDefinition] = await db.execute(
                'SELECT * FROM mini_games WHERE type = ? AND subject = ? LIMIT 1',
                ['flash_cards', subject]
            );

            let gameId;
            if (gameDefinition.length === 0) {
                // Créer une nouvelle définition de jeu si elle n'existe pas
                const [result] = await db.execute(
                    'INSERT INTO mini_games (name, type, description, target_cycle, subject, difficulty_level, theme) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [`Flash Cards ${subject}`, 'flash_cards', `Révise tes connaissances en ${subject}`, cycle, subject, difficulty, theme]
                );
                gameId = result.insertId;
            } else {
                // Utiliser la définition existante
                gameId = gameDefinition[0].id;
            }            // Créer une nouvelle session de jeu dans la base de données
            const [sessionResult] = await db.execute(
                'INSERT INTO game_sessions (user_id, game_id, session_type) VALUES (?, ?, ?)',
                [userId, gameId, 'flash_cards']
            );
            const sessionId = sessionResult.insertId;

            // Récupérer le contenu (questions) pour le jeu
            // Le service de contenu génère les questions selon les critères
            const content = await this.contentService.getContentForGame(
                'flash_cards', 
                subject, 
                difficulty, 
                cycle, 
                quantity
            );

            // Préparer les cartes pour le frontend
            // Transformation du format interne vers le format client
            const cards = content.map((item, index) => ({
                id: `card_${index}_${Date.now()}`,           // ID unique de carte
                category: item.content.category || subject,   // Catégorie de la question
                question: item.content.question,             // Texte de la question
                answer: item.content.correctAnswer,          // Réponse correcte
                explanation: item.content.explanation,       // Explication pédagogique
                difficulty: item.difficulty,                 // Niveau de difficulté
                tags: item.tags || []                        // Tags pour classification
            }));            // Retourner les données de session au frontend
            res.json({
                success: true,
                sessionId: sessionId,                    // ID de session pour tracking
                gameId: gameId,                         // ID du jeu pour référence
                cards: cards,                           // Cartes à jouer
                gameSettings: {                         // Paramètres de configuration
                    subject,
                    difficulty,
                    cycle,
                    theme,
                    quantity
                }
            });

        } catch (error) {
            console.error('Erreur démarrage Flash Cards:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors du démarrage du jeu',
                error: error.message 
            });
        }
    }    // Soumettre une réponse pour une carte
    // Traite la réponse de l'utilisateur et calcule les points
    async submitAnswer(req, res) {
        try {
            const userId = req.user?.userId || 1;    // ID utilisateur avec fallback
            const { 
                sessionId,       // ID de la session en cours
                cardId,          // ID de la carte répondue
                isCorrect,       // Si la réponse est correcte (calculé côté client)
                responseTime,    // Temps de réponse en millisecondes
                difficulty       // Niveau de difficulté de la question
            } = req.body;

            console.log('Soumission réponse:', { userId, sessionId, cardId, isCorrect, responseTime });

            // Pour la simplicité, on évite MongoDB pour le moment
            // Calcul direct des points et génération du feedback
            const pointsEarned = isCorrect ? this.calculatePoints(difficulty, responseTime) : 0;
            const feedback = this.getFeedback(isCorrect, responseTime, difficulty);

            // Réponse immédiate au frontend
            res.json({
                success: true,
                pointsEarned: pointsEarned,    // Points gagnés pour cette carte
                feedback: feedback,            // Message de feedback personnalisé
                isCorrect: isCorrect           // Confirmation de la justesse
            });

        } catch (error) {
            console.error('Erreur soumission réponse:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la soumission de la réponse' 
            });
        }
    }    // Finaliser une session Flash Cards
    // Calcule les résultats finaux, XP et récompenses
    async completeSession(req, res) {
        try {
            const userId = req.user?.userId || 1;
            const { 
                sessionId,           // ID de la session à finaliser
                totalScore,          // Score total accumulé
                correctAnswers,      // Nombre de bonnes réponses
                wrongAnswers,        // Nombre de mauvaises réponses
                totalTime,           // Temps total de la session (ms)
                averageResponseTime, // Temps moyen par carte (ms)
                difficulty           // Niveau de difficulté joué
            } = req.body;

            console.log('Finalisation session:', { userId, sessionId, totalScore, correctAnswers, wrongAnswers });

            // Marquer la session comme terminée dans la base
            await db.execute(
                'UPDATE game_sessions SET completed_at = NOW(), is_completed = TRUE, final_score = ? WHERE id = ? AND user_id = ?',
                [totalScore, sessionId, userId]
            );

            // Calcul de l'XP et des récompenses basé sur les performances
            const accuracy = (correctAnswers / (correctAnswers + wrongAnswers)) * 100;
            let xpEarned = 0;
            let badgeEarned = null;

            // Attribution d'XP selon les performances
            if (accuracy >= 90) {
                xpEarned = 50;      // Excellence : 90%+ de réussite
            } else if (accuracy >= 75) {
                xpEarned = 35;      // Très bien : 75-89%
            } else if (accuracy >= 60) {
                xpEarned = 20;      // Bien : 60-74%
            } else {
                xpEarned = 10;      // Participation : <60%
            }

            // Multiplicateur de bonus selon la difficulté
            const difficultyMultiplier = { facile: 1, moyen: 1.5, difficile: 2 };
            xpEarned = Math.round(xpEarned * (difficultyMultiplier[difficulty] || 1));

            // Vérification des badges à débloquer
            if (accuracy === 100) {
                badgeEarned = "Perfection";           // 100% de réussite
            } else if (averageResponseTime < 3000) {
                badgeEarned = "Vitesse de l'éclair";  // Réponses rapides (<3s)
            }

            // Save rewards
            if (xpEarned > 0 || badgeEarned) {
                await db.execute(
                    'INSERT INTO game_rewards (user_id, session_id, game_type, xp_earned, badge_earned) VALUES (?, ?, ?, ?, ?)',
                    [userId, sessionId, 'flash_cards', xpEarned, badgeEarned]
                );
            }

            res.json({
                success: true,
                results: {
                    totalScore: totalScore,
                    accuracy: accuracy,
                    xpEarned: xpEarned,
                    badgeEarned: badgeEarned,
                    performanceMessage: this.getPerformanceMessage(accuracy),
                    stats: {
                        correctAnswers,
                        wrongAnswers,
                        totalTime,
                        averageResponseTime
                    }
                }
            });

        } catch (error) {
            console.error('Error completing session:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la finalisation de la session' 
            });
        }
    }

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId || 1;

            // Get basic stats from MySQL
            const [progressRows] = await db.execute(
                'SELECT * FROM user_game_progress WHERE user_id = ? AND game_type = ?',
                [userId, 'flash_cards']
            );

            const progress = progressRows[0] || {
                total_sessions: 0,
                total_xp: 0,
                best_score: 0,
                current_level: 1
            };

            res.json({
                success: true,
                stats: {
                    progress: progress,
                    totalSessions: progress.total_sessions,
                    totalXP: progress.total_xp,
                    bestScore: progress.best_score,
                    currentLevel: progress.current_level
                }
            });

        } catch (error) {
            console.error('Error getting user stats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des statistiques' 
            });
        }
    }

    // Helper methods
    calculatePoints(difficulty, responseTime) {
        const basePoints = { facile: 10, moyen: 20, difficile: 30 };
        const timeBonus = Math.max(0, 10 - Math.floor(responseTime / 1000)); // Bonus for quick response
        return (basePoints[difficulty] || 10) + timeBonus;
    }

    getFeedback(isCorrect, responseTime, difficulty) {
        if (!isCorrect) {
            return "Pas tout à fait ! Réessaie la prochaine fois 💪";
        }

        if (responseTime < 2000) {
            return "Excellent ! Vitesse de l'éclair ⚡";
        } else if (responseTime < 4000) {
            return "Très bien ! Bonne vitesse 👍";
        } else {
            return "Correct ! Prends un peu plus de temps pour réfléchir 🤔";
        }
    }

    getPerformanceMessage(accuracy) {
        if (accuracy >= 95) return "Parfait ! Tu es un vrai champion ! 🏆";
        if (accuracy >= 85) return "Excellent travail ! Continue comme ça ! 🌟";
        if (accuracy >= 75) return "Très bien ! Tu progresses ! 👏";
        if (accuracy >= 60) return "Pas mal ! Il y a de l'amélioration ! 💪";
        return "Continue à t'entraîner, tu vas y arriver ! 📚";
    }
}

module.exports = new FlashCardsControllerSimple();
