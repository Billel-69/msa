const db = require('../config/db');
const { GameAnalytics } = require('../models/mongodb/GameModels');
const ContentTemplateService = require('../services/contentTemplateService');

// Create a single instance of the content service to be shared across all controller functions
const contentService = new ContentTemplateService();

// Start a new flash cards session
const startGame = async (req, res) => {
    try {
        console.log('1. Function started');
        const userId = req.user.id; // JWT token contains 'id', not 'userId'
        console.log('2. UserId extracted:', userId);
        
        const { 
            subject = 'mathematics', 
            difficulty = 'moyen', 
            cycle = 'cycle_4',
            theme = 'default',
            quantity = 10 
        } = req.body;
        console.log('3. Parameters extracted');

        console.log('Starting flash cards game:', { userId, subject, difficulty, cycle });
        console.log('ContentService check:', typeof contentService);
        
        // Generate unique game ID
        const gameId = `flashcards_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('4. Generated gameId:', gameId);

        // Get game definition
        console.log('5. Getting game definition...');
        const [gameDefinition] = await db.execute(
            'SELECT * FROM mini_games WHERE type = ? AND subject = ? AND difficulty_level = ? AND is_active = TRUE LIMIT 1',
            ['flash_cards', subject, difficulty]
        );
        console.log('6. Game definition retrieved:', gameDefinition.length ? 'found' : 'not found');

        let gameDbId;
        if (gameDefinition.length === 0) {
            // Create game definition if it doesn't exist
            console.log('7. Creating new game definition');
            const [result] = await db.execute(
                'INSERT INTO mini_games (name, type, description, target_cycle, subject, difficulty_level, theme) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [`Flash Cards ${subject}`, 'flash_cards', `Révise tes connaissances en ${subject}`, cycle, subject, difficulty, theme]
            );
            gameDbId = result.insertId;
            console.log('8. New game definition created with ID:', gameDbId);
        } else {
            gameDbId = gameDefinition[0].id;
            console.log('8. Using existing game definition with ID:', gameDbId);
        }

        // Create game session
        console.log('9. Creating game session...');
        const [sessionResult] = await db.execute(
            'INSERT INTO game_sessions (user_id, game_id, session_type) VALUES (?, ?, ?)',
            [userId, gameDbId, 'flash_cards']
        );
        const sessionId = sessionResult.insertId;
        console.log('10. Session created with ID:', sessionId);

        // Get content for the game
        console.log('11. Calling contentService.getContentForGame...');
        const content = await contentService.getContentForGame(
            'flash_cards', 
            subject, 
            difficulty, 
            cycle, 
            quantity
        );
        console.log('12. Content received:', content ? content.length : 'null', 'items');

        // Prepare cards for frontend
        const cards = content.map((item, index) => ({
            id: item._id || `card_${index}`,
            category: item.content.category || subject,
            question: item.content.question,
            answer: item.content.correctAnswer,
            explanation: item.content.explanation,
            difficulty: item.difficulty,
            tags: item.tags || []
        }));
        console.log('13. Cards prepared for frontend:', cards.length, 'cards');        // Update user game progress
        await updateUserProgress(userId, 'flash_cards', 'session_started', { sessionId: sessionId });
        console.log('14. User progress updated');

        console.log('15. Sending response with', cards.length, 'cards');
        res.json({
            success: true,
            sessionId: sessionId,
            gameId: gameDbId,
            cards: cards,
            gameSettings: {
                subject,
                difficulty,
                cycle,
                theme,
                timeLimit: 90, // 90 seconds total
                cardTimeLimit: 6 // 6 seconds per card
            }
        });
        console.log('16. Response sent');

    } catch (error) {
        console.error('Error starting flash cards game:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du démarrage du jeu',
            error: error.message 
        });
    }
};

// Submit an answer for a single card
const submitAnswer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            sessionId,
            cardId,
            isCorrect = false,
            responseTime = 0,
            difficulty = 'moyen' 
        } = req.body;

        // Log answer to analytics
        await GameAnalytics.create({
            userId: userId,
            gameType: 'flash_cards',
            action: 'answer_submitted',
            isCorrect: isCorrect,
            responseTime: responseTime,
            difficulty: difficulty,
            sessionId: sessionId,
            cardId: cardId,
            timestamp: new Date()
        });

        // Calculate points based on difficulty and response time
        const points = calculatePoints(difficulty, responseTime);
        
        // Generate feedback
        const feedback = getFeedback(isCorrect, responseTime, difficulty);

        // Update user progress
        await updateUserProgress(userId, 'flash_cards', isCorrect ? 'correct_answer' : 'wrong_answer', {
            cardId: cardId,
            difficulty: difficulty,
            responseTime: responseTime,
            points: points
        });

        res.json({
            success: true,
            points: points,
            feedback: feedback
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la soumission de la réponse',
            error: error.message 
        });
    }
};

// Complete a game session
const completeSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            sessionId,
            totalScore = 0,
            correctAnswers = 0,
            wrongAnswers = 0,
            totalTime = 0,
            averageResponseTime = 0,
            difficulty = 'moyen'
        } = req.body;

        // Calculate accuracy
        const totalQuestions = correctAnswers + wrongAnswers;
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        
        // Determine next difficulty recommendation
        const nextDifficulty = calculateNextDifficulty(accuracy, averageResponseTime, difficulty);
        
        // Generate performance message
        const performanceMessage = getPerformanceMessage(accuracy);
        
        // Update session completion in DB
        await db.execute(
            'UPDATE game_sessions SET is_completed = TRUE, score = ?, completed_at = NOW() WHERE id = ? AND user_id = ?',
            [totalScore, sessionId, userId]
        );

        // Log completion to analytics
        await GameAnalytics.create({
            userId: userId,
            gameType: 'flash_cards',
            action: 'session_completed',
            sessionId: sessionId,
            score: totalScore,
            accuracy: accuracy,
            totalTime: totalTime,
            averageResponseTime: averageResponseTime,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            difficulty: difficulty,
            timestamp: new Date()
        });

        // Update user progress
        await updateUserProgress(userId, 'flash_cards', 'session_completed', {
            score: totalScore,
            accuracy: accuracy,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            totalTime: totalTime
        });

        // Get today's cumulative stats
        const todayStats = await getTodayStats(userId);

        res.json({
            success: true,
            sessionResults: {
                totalScore,
                correctAnswers,
                wrongAnswers,
                accuracy: Math.round(accuracy),
                totalTime,
                averageResponseTime
            },
            feedback: {
                performanceMessage,
                nextDifficulty,
                todayStats
            }
        });

    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la finalisation de la session',
            error: error.message 
        });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        // Either use the path parameter or the authenticated user
        const userId = req.params.userId || req.user.id;

        // Get general statistics from analytics
        const stats = await GameAnalytics.aggregate([
            { $match: { userId: userId, gameType: 'flash_cards' } },
            { $group: {
                _id: '$userId',
                totalSessions: { $sum: { $cond: [{ $eq: ['$action', 'session_completed'] }, 1, 0] } },
                totalCorrectAnswers: { $sum: { $cond: [{ $eq: ['$action', 'correct_answer'] }, 1, 0] } },
                totalWrongAnswers: { $sum: { $cond: [{ $eq: ['$action', 'wrong_answer'] }, 1, 0] } },
                totalScore: { $sum: { $cond: [{ $eq: ['$action', 'session_completed'] }, '$score', 0] } },
                avgResponseTime: { $avg: '$responseTime' }
            }}
        ]);

        // Get statistics by subject
        const subjectStats = await GameAnalytics.aggregate([
            { $match: { userId: userId, gameType: 'flash_cards' } },
            { $group: {
                _id: '$difficulty',
                totalQuestions: { $sum: 1 },
                correctAnswers: { $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] } }
            }},
            { $project: {
                difficulty: '$_id',
                totalQuestions: 1,
                correctAnswers: 1,
                accuracy: { 
                    $multiply: [
                        { $divide: ['$correctAnswers', { $max: ['$totalQuestions', 1] }] },
                        100
                    ]
                }
            }}
        ]);

        // Get today's statistics
        const todayStats = await getTodayStats(userId);

        // Build response object
        const userStats = stats.length > 0 ? {
            totalSessions: stats[0].totalSessions || 0,
            totalCards: stats[0].totalCorrectAnswers + stats[0].totalWrongAnswers || 0,
            totalCorrectAnswers: stats[0].totalCorrectAnswers || 0,
            totalWrongAnswers: stats[0].totalWrongAnswers || 0,
            totalScore: stats[0].totalScore || 0,
            accuracy: stats[0].totalCorrectAnswers + stats[0].totalWrongAnswers > 0
                ? Math.round((stats[0].totalCorrectAnswers / (stats[0].totalCorrectAnswers + stats[0].totalWrongAnswers)) * 100)
                : 0,
            avgResponseTime: stats[0].avgResponseTime ? Math.round(stats[0].avgResponseTime) : 0
        } : {
            totalSessions: 0,
            totalCards: 0,
            totalCorrectAnswers: 0,
            totalWrongAnswers: 0,
            totalScore: 0,
            accuracy: 0,
            avgResponseTime: 0
        };

        res.json({
            success: true,
            stats: userStats,
            subjectStats: subjectStats,
            todayStats: todayStats
        });

    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message 
        });
    }
};

// Helper Functions

const calculatePoints = (difficulty, responseTime) => {
    // Base points by difficulty
    const basePoints = { facile: 5, moyen: 10, difficile: 15 }[difficulty] || 10;
    
    // Time bonus (faster = more points, max 100% bonus)
    const timeBonus = Math.max(0, Math.min(basePoints, basePoints * (1 - responseTime / 10000)));
    
    return Math.round(basePoints + timeBonus);
};

const getFeedback = (isCorrect, responseTime, difficulty) => {
    if (!isCorrect) {
        return {
            message: "Pas tout à fait! Continue d'essayer!",
            icon: '😕',
            color: '#FF5722'
        };
    }
    
    // Fast time for each difficulty (in ms)
    const fastTimes = { facile: 3000, moyen: 4000, difficile: 5000 };
    const isFast = responseTime < (fastTimes[difficulty] || 4000);
    
    if (isFast) {
        return {
            message: "Bravo! Très rapide!",
            icon: '🚀',
            color: '#4CAF50'
        };
    } else {
        return {
            message: "Correct! Bien joué!",
            icon: '👍',
            color: '#2196F3'
        };
    }
};

const calculateNextDifficulty = (accuracy, averageResponseTime, currentDifficulty) => {
    const difficultyLevels = ['facile', 'moyen', 'difficile'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    
    // If accuracy is very high and response time is good, suggest a higher difficulty
    if (accuracy >= 85 && averageResponseTime < 5000 && currentIndex < difficultyLevels.length - 1) {
        return difficultyLevels[currentIndex + 1];
    }
    
    // If accuracy is low, suggest a lower difficulty
    if (accuracy < 60 && currentIndex > 0) {
        return difficultyLevels[currentIndex - 1];
    }
    
    // Otherwise stay at the same level
    return currentDifficulty;
};

const getPerformanceMessage = (accuracy) => {
    if (accuracy >= 90) return "Excellent! Tu as vraiment maîtrisé ce sujet!";
    if (accuracy >= 75) return "Très bien! Continue comme ça!";
    if (accuracy >= 60) return "Bien! Tu es sur la bonne voie!";
    if (accuracy >= 40) return "Pas mal, mais tu peux encore t'améliorer.";
    return "Continue à pratiquer, tu vas t'améliorer!";
};

const getTodayStats = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return await GameAnalytics.aggregate([
            { 
                $match: { 
                    userId: userId, 
                    gameType: 'flash_cards',
                    timestamp: { $gte: today }
                }
            },
            { 
                $group: {
                    _id: null,
                    cardsPlayed: { $sum: { $cond: [{ $in: ['$action', ['correct_answer', 'wrong_answer']] }, 1, 0] } },
                    correctAnswers: { $sum: { $cond: [{ $eq: ['$action', 'correct_answer'] }, 1, 0] } },
                    sessionsCompleted: { $sum: { $cond: [{ $eq: ['$action', 'session_completed'] }, 1, 0] } },
                    totalScore: { $sum: { $cond: [{ $eq: ['$action', 'session_completed'] }, '$score', 0] } }
                }
            }
        ]).then(results => {
            return results.length > 0 ? results[0] : {
                cardsPlayed: 0,
                correctAnswers: 0,
                sessionsCompleted: 0,
                totalScore: 0
            };
        });
    } catch (error) {
        console.error('Error getting today stats:', error);
        return {
            cardsPlayed: 0,
            correctAnswers: 0,
            sessionsCompleted: 0,
            totalScore: 0
        };
    }
};

const updateUserProgress = async (userId, gameType, action, data = {}) => {
    try {
        // Create the analytics object with required fields
        const analyticsData = {
            userId: userId,
            gameType: gameType,
            action: action,
            timestamp: new Date()
        };
        
        // Only add sessionId if it's provided to avoid validation errors
        if (data.sessionId) {
            analyticsData.sessionId = data.sessionId;
        }
        
        // Add any other data
        Object.keys(data).forEach(key => {
            if (key !== 'sessionId') { // Skip sessionId as we already handled it
                analyticsData[key] = data[key];
            }
        });
        
        // Update user progress in MongoDB
        await GameAnalytics.create(analyticsData);
        
    } catch (error) {
        console.error('Error updating user progress:', error);
    }
};

module.exports = {
    startGame,
    submitAnswer,
    completeSession,
    getUserStats
};
