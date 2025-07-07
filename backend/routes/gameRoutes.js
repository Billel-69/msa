//gameRoute.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const db = require('../config/db');
const mysqlGameProgressService = require('../services/mysqlGameProgressService');
const openaiController = require('../controllers/openaiController');

// Fonction pour générer des questions selon niveau et matière (à remplacer par l'API IA)
async function generateGameQuestions(gameType, subject, niveau) {
    // Questions temporaires adaptées selon matière et niveau - à remplacer par un appel API IA
    
    const questionSets = {
        'mathématiques': {
            '6e': [
                { question: 'Combien font 5 × 8 ?', options: ['35', '40', '45', '50'], correctAnswer: '40', explanation: '5 × 8 = 40' },
                { question: 'Quel est le résultat de 12 + 9 ?', options: ['19', '21', '23', '25'], correctAnswer: '21', explanation: '12 + 9 = 21' }
            ],
            '3e': [
                { question: 'Résolvez: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 3', 'x = 7'], correctAnswer: 'x = 5', explanation: '2x = 15 - 5 = 10, donc x = 5' },
                { question: 'Quelle est la racine carrée de 64 ?', options: ['6', '7', '8', '9'], correctAnswer: '8', explanation: '8² = 64' }
            ]
        },
        'français': {
            '6e': [
                { question: 'Quel est le pluriel de "cheval" ?', options: ['chevals', 'chevaux', 'chevaus', 'chevales'], correctAnswer: 'chevaux', explanation: 'Le pluriel irrégulier de cheval est chevaux' }
            ],
            '3e': [
                { question: 'Dans quelle figure de style trouve-t-on "Il pleut des cordes" ?', options: ['Métaphore', 'Comparaison', 'Hyperbole', 'Personnification'], correctAnswer: 'Métaphore', explanation: 'C\'est une métaphore car il y a une comparaison implicite' }
            ]
        },
        'anglais': {
            '6e': [
                { question: 'Comment dit-on "chat" en anglais ?', options: ['dog', 'cat', 'bird', 'fish'], correctAnswer: 'cat', explanation: 'Cat signifie chat en anglais' }
            ],
            '3e': [
                { question: 'Quel est le passé de "go" ?', options: ['goed', 'went', 'gone', 'going'], correctAnswer: 'went', explanation: 'Le passé irrégulier de "go" est "went"' }
            ]
        }
    };
    
    // Retourner les questions selon matière et niveau, ou questions par défaut
    const subjectQuestions = questionSets[subject?.toLowerCase()] || questionSets['mathématiques'];
    const levelQuestions = subjectQuestions[niveau] || subjectQuestions['6e'] || subjectQuestions[Object.keys(subjectQuestions)[0]];
    
    return levelQuestions || [
        { question: 'Question par défaut', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Réponse par défaut' }
    ];
}

// Récupérer tous les jeux disponibles
router.get('/available', verifyToken, async (req, res) => {
    try {
        const [games] = await db.execute(
            `SELECT id, name, description, type, difficulty_level, subject, 
                    theme, image_url 
             FROM mini_games 
             WHERE is_active = 1`
        );
        
        // Formater pour le frontend (templates de jeux)
        const formattedGames = games.map(game => ({
            id: game.id.toString(),
            name: game.name,
            description: game.description,
            type: game.type || 'quiz', // Type du template (quiz, memory, puzzle)
            imageUrl: game.image_url || '/assets/games/default.png'
        }));
        
        
        res.json({ games: formattedGames });
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).json({ error: 'Erreur lors du chargement des jeux' });
    }
});

// Récupérer les détails d'un jeu spécifique par ID avec contenu généré
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { subject, niveau } = req.query; // Récupérer matière et niveau depuis les paramètres URL
        const gameId = req.params.id;
        
        
        const [games] = await db.execute(
            'SELECT * FROM mini_games WHERE id = ?',
            [gameId]
        );
        if (games.length === 0) {
            return res.status(404).json({ error: 'Template de jeu non trouvé' });
        }
        const game = games[0];
        if (!game.is_active) {
            return res.status(403).json({ error: 'Ce jeu n\'est pas disponible actuellement' });
        }
        
        // Formater l'objet jeu template
        const formattedGame = {
            id: game.id.toString(),
            name: game.name,
            description: game.description,
            type: game.type || 'quiz',
            imageUrl: game.image_url || '/assets/games/default.png',
            status: game.is_active ? 'active' : 'inactive',
            // Ajout du contexte choisi par l'utilisateur
            selectedSubject: subject,
            selectedNiveau: niveau
        };
        
        // Générer le contenu dynamiquement selon le type de jeu
        if (formattedGame.type === 'quiz') {
            formattedGame.questions = await openaiController.generateQuizQuestions(subject, niveau, 5);
            console.log(`Questions générées: ${formattedGame.questions.length}`);
        } else if (formattedGame.type === 'branching_adventure') {
            // For maze/adventure games, generate questions for knowledge gates
            const questionCount = parseInt(req.query.count) || 6;
            formattedGame.questions = await openaiController.generateQuizQuestions(subject, niveau, questionCount);
            console.log(`Questions générées pour le jeu d'aventure: ${formattedGame.questions.length}`);
        }
        res.json({ game: formattedGame });
    } catch (err) {
        console.error('Error fetching game details:', err);
        res.status(500).json({ error: 'Erreur lors du chargement du jeu' });
    }
});

// Soumettre les résultats d'un jeu
router.post('/:id/results', verifyToken, async (req, res) => {
    try {
        const { score, timeSpent, accuracy } = req.body;
        const userId = req.user.id;
        const gameId = req.params.id;
        const now = new Date();

        // Récupérer les infos du jeu depuis MySQL
        const [games] = await db.execute(
            'SELECT * FROM mini_games WHERE id = ?',
            [gameId]
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Jeu non trouvé' });
        }
        
        const game = games[0];
        
        if (!game.is_active) {
            return res.status(403).json({ error: 'Ce jeu n\'est pas disponible actuellement' });
        }
        
        // Calculer les XP gagnées basées sur la performance
        const scorePercentage = Math.min(Math.max(score, 0), 100) / 100;
        
        // Calcul des XP : 5 XP par bonne réponse
        const { correctAnswers } = req.body; // Nombre de bonnes réponses
        const xpEarned = (correctAnswers || Math.round(score / 100 * 5)) * 5; // 5 XP par bonne réponse
        
        // Les fragments seront implémentés plus tard
        const fragmentsEarned = 0;

        // Insérer une nouvelle session de jeu
        await mysqlGameProgressService.insertGameSession({
            userId,
            gameId: parseInt(gameId),
            sessionType: 'play',
            startedAt: now,
            completedAt: now,
            isCompleted: 1,
            finalScore: score
        });
        
        // Mettre à jour la progression de l'utilisateur
        await mysqlGameProgressService.upsertUserGameProgress({
            userId,
            gameType: game.type,
            xpEarned,
            score,
            now
        });

        res.json({
            success: true,
            results: {
                score,
                xpEarned,
                fragmentsEarned,
                message: 'Résultat enregistré avec succès'
            }
        });
    } catch (err) {
        console.error('Error saving game results:', err);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement des résultats' });
    }
});

// Récupérer la progression des jeux de l'utilisateur
router.get('/progress', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await mysqlGameProgressService.getUserProgress(userId);
        res.json({ progress });
    } catch (err) {
        console.error('Error fetching game progress:', err);
        res.status(500).json({ error: 'Erreur lors du chargement de la progression' });
    }
});

module.exports = router;