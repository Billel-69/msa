/**
 * Service de gestion du basculement entre niveaux
 * Gère la transition niveau 1 (OpenAI) -> niveau 2 (RAG) et le cooldown
 */

const mysql = require('mysql2/promise');
const { recordUsage, getTotalTokens } = require('./usageServiceDB');

// Configuration - IMPORTANT: Gérer correctement TOKEN_THRESHOLD=0
const TOKEN_THRESHOLD = process.env.TOKEN_THRESHOLD !== undefined ? 
  parseInt(process.env.TOKEN_THRESHOLD) : 30000;
const COOLDOWN_HOURS = parseFloat(process.env.COOLDOWN_HOURS) ;

// Pool de connexions DB
let pool = null;

/**
 * Initialise la connexion DB et les tables
 */
const initLevelManagement = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'msa',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Créer la table de transition si elle n'existe pas
    await createLevelTransitionTable();
    
    console.log('✅ Service de gestion des niveaux initialisé');
    console.log(`📊 TOKEN_THRESHOLD configuré à: ${TOKEN_THRESHOLD}`);
  } catch (error) {
    console.error('❌ Erreur init levelManagement:', error);
    throw error;
  }
};

/**
 * Crée la table de transition de niveau
 */
const createLevelTransitionTable = async () => {
  const sql = `
     CREATE TABLE IF NOT EXISTS user_level_transition (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      switched_to_level2_at TIMESTAMP NULL DEFAULT NULL,
      can_switch_back_at TIMESTAMP NULL DEFAULT NULL,
      is_on_cooldown BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_cooldown (user_id, is_on_cooldown)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  try {
    await pool.execute(sql);
  } catch (error) {
    // Si la table existe déjà, ignorer l'erreur
    if (!error.message.includes('already exists')) {
      throw error;
    }
  }
};

/**
 * Estimation des tokens (compatible avec votre logique)
 */
const estimateTokens = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  // 1 token ≈ 4 caractères + overhead
  const estimatedTokens = Math.ceil(text.length / 4);
  const overhead = 50;
  
  return estimatedTokens + overhead;
};

/**
 * Middleware principal de gestion des tokens et niveaux
 */
const enhancedTokenMeter = async (req, res, next) => {
  try {
    // Debug logs
    console.log('🔍 enhancedTokenMeter - req.body:', req.body);
    console.log('🔍 enhancedTokenMeter - TOKEN_THRESHOLD:', TOKEN_THRESHOLD);
    
    // Extraire l'userId de toutes les sources possibles
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    
    if (!userId) {
      console.warn('⚠️ enhancedTokenMeter: userId non trouvé');
      req.isLevel2 = false;
      return next();
    }

    console.log('🔍 enhancedTokenMeter - userId trouvé:', userId);

    // Vérifier d'abord le cooldown
    const cooldownStatus = await isUserOnCooldown(userId);
    if (cooldownStatus.isOnCooldown) {
      console.log(`🔒 Utilisateur ${userId} en cooldown jusqu'à ${cooldownStatus.canSwitchBackAt}`);
      req.isLevel2 = true; // Forcé au niveau 2
      req.userId = userId;
      req.onCooldown = true;
      req.cooldownInfo = cooldownStatus;
      return next();
    }

    // Récupérer le total actuel des tokens
    const currentTotal = await getTotalTokens(userId);
    console.log(`📊 Total tokens pour ${userId}: ${currentTotal}`);

    // Estimer les tokens de la requête
    const message = req.body.message || req.body.question || '';
    const history = req.body.history || [];
    
    const messageTokens = estimateTokens(message);
    const historyTokens = history.reduce((total, msg) => {
      return total + estimateTokens(msg.content || '');
    }, 0);
    
    const requestTokens = messageTokens + historyTokens;
    console.log(`🔢 Tokens estimés pour cette requête: ${requestTokens}`);

    // Si TOKEN_THRESHOLD=0, on bascule immédiatement
    if (TOKEN_THRESHOLD === 0) {
      console.log(`⚡ TOKEN_THRESHOLD=0, basculement immédiat au niveau 2 pour ${userId}!`);
      
      // Vérifier si on a déjà activé le cooldown
      const [existing] = await pool.execute(
        'SELECT * FROM user_level_transition WHERE user_id = ?',
        [userId]
      );
      
      if (existing.length === 0) {
        await activateCooldown(userId);
      }
      
      req.isLevel2 = true;
      req.userId = userId;
      req.estimatedTokens = requestTokens;
      req.currentTotal = currentTotal;
      return next();
    }

    // Vérifier si on dépasse le seuil (cas normal TOKEN_THRESHOLD > 0)
    const newTotal = currentTotal + requestTokens;
    const willExceedThreshold = newTotal >= TOKEN_THRESHOLD;

    // Si on dépasse le seuil pour la première fois, activer le cooldown
    if (willExceedThreshold && currentTotal < TOKEN_THRESHOLD) {
      console.log(`⚡ Basculement au niveau 2 pour ${userId}!`);
      await activateCooldown(userId);
    }

    // Déterminer le niveau
    req.isLevel2 = willExceedThreshold;
    req.userId = userId;
    req.estimatedTokens = requestTokens;
    req.currentTotal = currentTotal;

    console.log(`🔍 Niveau déterminé: ${req.isLevel2 ? '2 (RAG)' : '1 (OpenAI)'}`);

    // Enregistrer l'utilisation SEULEMENT si on utilise OpenAI (niveau 1)
    if (!req.isLevel2 && requestTokens > 0) {
      recordUsage(userId, requestTokens).catch(error => {
        console.error('❌ Erreur enregistrement tokens:', error);
      });
    }

    next();

  } catch (error) {
    console.error('❌ Erreur enhancedTokenMeter:', error);
    req.isLevel2 = false;
    next();
  }
};

/**
 * Active le cooldown pour un utilisateur
 */
const activateCooldown = async (userId) => {
  try {
    const now = new Date();
    const canSwitchBack = new Date(now.getTime() + (COOLDOWN_HOURS * 60 * 60 * 1000));

    // IMPORTANT: Utiliser user_level_transition SANS S
    const sql = `
      INSERT INTO user_level_transition (user_id, switched_to_level2_at, can_switch_back_at, is_on_cooldown)
      VALUES (?, NOW(), ?, TRUE)
      ON DUPLICATE KEY UPDATE
        switched_to_level2_at = NOW(),
        can_switch_back_at = VALUES(can_switch_back_at),
        is_on_cooldown = TRUE
    `;

    await pool.execute(sql, [userId, canSwitchBack]);
    
    console.log(`✅ Cooldown activé pour utilisateur ${userId} jusqu'à ${canSwitchBack}`);
  } catch (error) {
    console.error('❌ Erreur activation cooldown:', error);
    throw error;
  }
};

/**
 * Vérifie si un utilisateur est en cooldown
 */
const isUserOnCooldown = async (userId) => {
  try {
    // IMPORTANT: Utiliser user_level_transition SANS S
    const [rows] = await pool.execute(
      'SELECT * FROM user_level_transition WHERE user_id = ? AND is_on_cooldown = TRUE',
      [userId]
    );

    if (rows.length === 0) {
      return { isOnCooldown: false };
    }

    const record = rows[0];
    const now = new Date();
    const canSwitchBack = new Date(record.can_switch_back_at);

    // Si le cooldown est expiré, le désactiver
    if (now >= canSwitchBack) {
      await pool.execute(
        'UPDATE user_level_transition SET is_on_cooldown = FALSE WHERE user_id = ?',
        [userId]
      );
      
      // Réinitialiser aussi les tokens
      await resetUserTokens(userId);
      
      return { isOnCooldown: false };
    }

    return {
      isOnCooldown: true,
      switchedAt: record.switched_to_level2_at,
      canSwitchBackAt: canSwitchBack,
      remainingHours: Math.ceil((canSwitchBack - now) / (1000 * 60 * 60))
    };

  } catch (error) {
    console.error('❌ Erreur vérification cooldown:', error);
    return { isOnCooldown: false };
  }
};

/**
 * Réinitialise les tokens d'un utilisateur
 */
const resetUserTokens = async (userId) => {
  try {
    await pool.execute(
      'UPDATE user_tokens SET total_tokens = 0 WHERE user_id = ?',
      [userId]
    );
    console.log(`🔄 Tokens réinitialisés pour utilisateur ${userId}`);
  } catch (error) {
    console.error('❌ Erreur reset tokens:', error);
  }
};

/**
 * Force le basculement manuel au niveau 2 (pour tests)
 */
const forceSwitchToLevel2 = async (userId) => {
  try {
    await activateCooldown(userId);
    return { success: true, message: `Utilisateur ${userId} basculé au niveau 2` };
  } catch (error) {
    console.error('❌ Erreur basculement manuel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtient le statut complet d'un utilisateur
 */
const getUserLevelStatus = async (userId) => {
  try {
    const totalTokens = await getTotalTokens(userId);
    const cooldownStatus = await isUserOnCooldown(userId);
    
    return {
      userId,
      totalTokens,
      threshold: TOKEN_THRESHOLD,
      currentLevel: cooldownStatus.isOnCooldown ? 2 : (totalTokens >= TOKEN_THRESHOLD ? 2 : 1),
      cooldown: cooldownStatus,
      percentageUsed: TOKEN_THRESHOLD > 0 ? Math.round((totalTokens / TOKEN_THRESHOLD) * 100) : 100
    };
  } catch (error) {
    console.error('❌ Erreur getUserLevelStatus:', error);
    throw error;
  }
};

// Initialisation au démarrage
initLevelManagement().catch(console.error);

module.exports = {
  enhancedTokenMeter,
  isUserOnCooldown,
  activateCooldown,
  forceSwitchToLevel2,
  getUserLevelStatus,
  resetUserTokens
};