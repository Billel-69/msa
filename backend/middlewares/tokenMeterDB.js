
/**
 * Middleware de comptage des tokens - Version Production
 * Compte les tokens d'une requête, met à jour usageService DB, détermine req.isLevel2
 */

const { recordUsage, getTotalTokens } = require('../services/usageServiceDB');

// Seuil de tokens pour basculer vers le RAG (niveau 2)
const TOKEN_THRESHOLD = parseInt(process.env.TOKEN_THRESHOLD) ;

/**
 * Estimation simple des tokens basée sur la longueur du texte
 * @param {string} text - Texte à analyser
 * @returns {number} Estimation du nombre de tokens
 */
const estimateTokens = (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Estimation approximative : 1 token ≈ 4 caractères pour le français
  // Cette estimation est basique, OpenAI utilise un tokenizer plus sophistiqué
  const estimatedTokens = Math.ceil(text.length / 4);
  
  // Ajouter des tokens pour les messages système et les métadonnées
  const overhead = 50;
  
  return estimatedTokens + overhead;
};

/**
 * Middleware de comptage des tokens - Version asynchrone pour production
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const tokenMeter = async (req, res, next) => {
  try {
    // Extraire l'ID utilisateur depuis le token JWT ou les paramètres
    const userId = req.user?.id || req.body.userId || req.query.userId;
    
    if (!userId) {
      console.warn('⚠️ tokenMeter: userId non trouvé dans la requête');
      req.isLevel2 = false; // Par défaut, utiliser OpenAI
      return next();
    }
    
    // Récupérer le total actuel des tokens (async)
    const currentTotal = await getTotalTokens(userId);
    
    // Estimer les tokens de la requête actuelle
    const question = req.body.message || req.body.question || '';
    const history = req.body.history || [];
    
    // Calculer les tokens de la question
    const questionTokens = estimateTokens(question);
    
    // Calculer les tokens de l'historique
    const historyTokens = history.reduce((total, msg) => {
      return total + estimateTokens(msg.content || '');
    }, 0);
    
    // Total des tokens pour cette requête
    const requestTokens = questionTokens + historyTokens;
    
    // Vérifier si on dépasse le seuil
    const willExceedThreshold = (currentTotal + requestTokens) >= TOKEN_THRESHOLD;
    
    // Déterminer le niveau
    req.isLevel2 = willExceedThreshold;
    req.userId = userId;
    req.estimatedTokens = requestTokens;
    req.currentTotal = currentTotal;
    
    console.log(`🔍 TokenMeter pour ${userId}:`);
    console.log(`   - Total actuel: ${currentTotal}`);
    console.log(`   - Tokens estimés: ${requestTokens} (question: ${questionTokens}, historique: ${historyTokens})`);
    console.log(`   - Seuil: ${TOKEN_THRESHOLD}`);
    console.log(`   - Niveau: ${req.isLevel2 ? '2 (RAG)' : '1 (OpenAI)'}`);
    
    // Enregistrer l'utilisation (async) - même si on utilise RAG, on compte pour la transparence
    if (requestTokens > 0) {
      // Ne pas attendre la fin de l'enregistrement pour continuer
      recordUsage(userId, requestTokens).catch(error => {
        console.error('❌ Erreur enregistrement tokens:', error);
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur tokenMeter:', error);
    // En cas d'erreur, utiliser OpenAI par défaut
    req.isLevel2 = false;
    next();
  }
};

module.exports = tokenMeter; 
