// ============================================================================
// MODÈLES MONGODB POUR LE SYSTÈME DE MINI-JEUX
// ============================================================================
// Stockage flexible des contenus, analytics et files d'attente IA
// Complément au système MySQL pour données non-relationnelles
// ============================================================================

const mongoose = require('mongoose');

// ============================================================================
// SCHÉMA DE CONTENU DE JEU
// ============================================================================
// Stockage flexible des questions, scènes et contenus enrichis
const gameContentSchema = new mongoose.Schema({
    gameId: { 
        type: String, 
        required: true,
        index: true                              // Index pour recherche rapide par jeu
    },
    gameType: { 
        type: String, 
        enum: ['flash_cards', 'branching_adventure'], 
        required: true                           // Type de jeu pour le routage
    },
    contentType: {
        type: String,
        enum: ['question', 'scene', 'checkpoint'],
        required: true                           // Type de contenu pour traitement approprié
    },
    subject: {
        type: String,
        required: true,
        index: true                              // Index pour filtrage par matière
    },
    difficulty: { 
        type: String, 
        enum: ['facile', 'moyen', 'difficile'],
        required: true                           // Niveau de difficulté
    },
    cycle: {
        type: String,
        enum: ['cycle_3', 'cycle_4', 'terminal'],
        required: true                           // Niveau scolaire ciblé
    },
    theme: {
        type: String,
        default: 'default'                       // Thème optionnel pour organisation
    },
    content: {
        // ========================================
        // CONTENU POUR FLASH CARDS
        // ========================================
        question: String,                        // Question à poser
        options: [String],                       // Choix multiples (optionnel)
        correctAnswer: String,                   // Réponse correcte
        explanation: String,                     // Explication détaillée
        
        // ========================================
        // CONTENU POUR AVENTURES À EMBRANCHEMENTS
        // ========================================
        scene: String,                           // Description de la scène
        choices: [{                              // Choix disponibles
            option: String,                      // Texte du choix            nextScene: String,                   // Scène suivante
            consequence: String                  // Conséquence du choix
        }],
        hints: [String],                         // Indices pour aider le joueur
        
        // ========================================
        // CHAMPS COMMUNS
        // ========================================
        title: String,                           // Titre du contenu
        category: String                         // Catégorie pour organisation
    },
    metadata: {
        isTemplate: { type: Boolean, default: true },    // Contenu template ou personnalisé
        isAIGenerated: { type: Boolean, default: false }, // Généré par IA ou manuel
        usageCount: { type: Number, default: 0 },         // Nombre d'utilisations
        avgPerformance: { type: Number, default: 0 },     // Performance moyenne (0-100)
        validatedBy: String,                              // Validateur du contenu
        lastUpdated: { type: Date, default: Date.now }    // Dernière mise à jour
    },
    tags: [String],                              // Tags pour recherche et filtrage
    createdAt: { type: Date, default: Date.now }, // Date de création
    updatedAt: { type: Date, default: Date.now }  // Date de dernière modification
});

// ============================================================================
// SCHÉMA D'ANALYTICS DE JEU
// ============================================================================
// Données détaillées de performance et métriques avancées
const gameAnalyticsSchema = new mongoose.Schema({
    userId: { 
        type: Number, 
        required: true,
        index: true                              // Index pour agrégation par utilisateur
    },
    sessionId: { 
        type: Number, 
        required: true,
        index: true                              // Index pour tracking de session
    },
    gameType: { 
        type: String, 
        enum: ['flash_cards', 'branching_adventure'],        required: true                           // Type de jeu pour classification
    },
    gameId: String,                              // Identifiant du jeu spécifique
    metrics: {
        // ========================================
        // MÉTRIQUES SPÉCIFIQUES AUX FLASH CARDS
        // ========================================
        cardId: String,                          // Identifiant de la carte
        questionId: String,                      // Identifiant de la question
        responseTime: Number,                    // Temps de réponse en millisecondes
        isCorrect: Boolean,                      // Réponse correcte ou non
        difficulty: String,                      // Niveau de difficulté perçu
        attemptsCount: Number,                   // Nombre de tentatives
        hintsUsed: Number,                       // Nombre d'indices utilisés
        
        // ========================================
        // MÉTRIQUES SPÉCIFIQUES AUX AVENTURES
        // ========================================
        sceneId: String,                         // Identifiant de la scène
        choiceMade: String,                      // Choix effectué par l'utilisateur
        pathTaken: [String],                     // Chemin pris dans l'aventure
        checkpointsPassed: Number,               // Nombre de points de contrôle réussis
        
        // ========================================
        // MÉTRIQUES COMMUNES
        // ========================================
        accuracy: Number,                        // Précision (pourcentage)
        scoreEarned: Number,                     // Points gagnés
        timeSpent: Number                        // Temps total passé
    },
    contextData: {
        deviceType: String,                      // Type d'appareil (mobile, desktop, tablet)
        browserType: String,                     // Type de navigateur
        timeOfDay: String,                       // Moment de la journée
        dayOfWeek: String                        // Jour de la semaine
    },
    timestamp: { type: Date, default: Date.now, index: true } // Horodatage pour analyses temporelles
});

// ============================================================================
// SCHÉMA DE FILE D'ATTENTE IA
// ============================================================================
// Système de queue pour intégration future avec IA
const aiContentQueueSchema = new mongoose.Schema({
    requestId: { 
        type: String, 
        required: true, 
        unique: true                             // Identifiant unique de requête
    },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], 
        default: 'pending',
        index: true                              // Index pour filtrage par statut
    },    priority: { 
        type: Number, 
        default: 5, 
        min: 1, 
        max: 10                                  // Priorité de traitement (1=urgent, 10=faible)
    },
    requestData: {
        gameType: String,                        // Type de jeu demandé
        subject: String,                         // Matière ciblée
        difficulty: String,                      // Niveau de difficulté
        cycle: String,                           // Cycle scolaire
        theme: String,                           // Thème spécifique
        quantity: Number,                        // Nombre de contenus à générer
        userContext: Object,                     // Contexte utilisateur pour personnalisation
        educationalObjectives: [String]          // Objectifs pédagogiques visés
    },
    responseData: {
        generatedContent: [Object],              // Contenu généré par l'IA
        qualityScore: Number,                    // Score de qualité (0-100)
        processingTime: Number,                  // Temps de traitement en ms
        aiModel: String,                         // Modèle IA utilisé
        tokensUsed: Number                       // Nombre de tokens consommés
    },
    fallbackContent: [Object],                   // Contenu de secours si IA indisponible
    usedFallback: { type: Boolean, default: false }, // Indicateur d'utilisation du fallback
    errorMessage: String,                        // Message d'erreur en cas d'échec
    retryCount: { type: Number, default: 0 },    // Nombre de tentatives
    createdAt: { type: Date, default: Date.now }, // Date de création de la requête
    processedAt: Date,                           // Date de traitement
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expiration après 24h
        index: { expireAfterSeconds: 0 }         // Suppression automatique MongoDB
    }
});

// ============================================================================
// INDEX DE PERFORMANCE
// ============================================================================
// Création d'index composites pour optimisation des requêtes
gameContentSchema.index({ gameType: 1, subject: 1, difficulty: 1 }); // Recherche multi-critères
gameContentSchema.index({ 'metadata.isTemplate': 1 });               // Filtrage template/custom
gameAnalyticsSchema.index({ userId: 1, timestamp: -1 });             // Analytics utilisateur chronologiques
gameAnalyticsSchema.index({ gameType: 1, 'metrics.difficulty': 1 }); // Analytics par type et difficulté
aiContentQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });

module.exports = {
    GameContent: mongoose.model('GameContent', gameContentSchema),
    GameAnalytics: mongoose.model('GameAnalytics', gameAnalyticsSchema),
    AIContentQueue: mongoose.model('AIContentQueue', aiContentQueueSchema)
};
