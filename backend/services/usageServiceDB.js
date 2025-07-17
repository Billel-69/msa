//usageServiceDB.js
/**
 * Service de gestion des tokens par utilisateur - Version corrigée
 * Compatible avec la structure de BDD existante
 */

const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'msa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

/**
 * Initialise la connexion à la base de données
 */
const initDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Créer la table si elle n'existe pas (compatible avec votre structure)
    await createTokensTable();
    
    console.log('✅ Base de données tokens initialisée');
  } catch (error) {
    console.error('❌ Erreur initialisation DB tokens:', error);
    throw error;
  }
};

/**
 * Crée la table de tokens compatible avec votre structure
 */
const createTokensTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      total_tokens BIGINT DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_last_updated (last_updated),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  try {
    await pool.execute(createTableSQL);
    console.log('✅ Table user_tokens vérifiée/créée');
  } catch (error) {
    console.error('⚠️ Erreur création table (peut-être déjà existante):', error.message);
  }
};

/**
 * Enregistre l'utilisation de tokens pour un utilisateur
 * @param {number|string} userId - ID de l'utilisateur
 * @param {number} delta - Nombre de tokens à ajouter
 * @returns {Promise<number>} Nouveau total
 */
const recordUsage = async (userId, delta) => {
  if (!userId || delta <= 0) {
    console.warn('⚠️ recordUsage: paramètres invalides', { userId, delta });
    return 0;
  }
  
  try {
    // Convertir userId en nombre si nécessaire
    const userIdNum = parseInt(userId);
    
    console.log(`📝 Enregistrement de ${delta} tokens pour user ${userIdNum}`);
    
    // Utiliser INSERT ... ON DUPLICATE KEY UPDATE
    const sql = `
      INSERT INTO user_tokens (user_id, total_tokens) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE 
        total_tokens = total_tokens + ?,
        last_updated = CURRENT_TIMESTAMP
    `;
    
    const [result] = await pool.execute(sql, [userIdNum, delta, delta]);
    console.log('📝 Résultat insertion:', result);
    
    // Récupérer le nouveau total
    const [rows] = await pool.execute(
      'SELECT total_tokens FROM user_tokens WHERE user_id = ?',
      [userIdNum]
    );
    
    const newTotal = rows[0]?.total_tokens || 0;
    console.log(`✅ Tokens enregistrés pour user ${userIdNum}: +${delta} → Total: ${newTotal}`);
    
    return newTotal;
  } catch (error) {
    console.error('❌ Erreur recordUsage:', error);
    console.error('SQL Error details:', error.sqlMessage);
    throw error;
  }
};

/**
 * Récupère le total des tokens pour un utilisateur
 * @param {number|string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Total des tokens consommés
 */
const getTotalTokens = async (userId) => {
  if (!userId) {
    console.warn('⚠️ getTotalTokens: userId manquant');
    return 0;
  }
  
  try {
    // Convertir userId en nombre
    const userIdNum = parseInt(userId);
    
    const [rows] = await pool.execute(
      'SELECT total_tokens FROM user_tokens WHERE user_id = ?',
      [userIdNum]
    );
    
    const total = parseInt(rows[0]?.total_tokens || 0);
    console.log(`📊 Total tokens pour user ${userIdNum}: ${total}`);
    
    return total;
  } catch (error) {
    console.error('❌ Erreur getTotalTokens:', error);
    return 0;
  }
};

/**
 * Réinitialise les tokens pour un utilisateur
 * @param {number|string} userId - ID de l'utilisateur
 */
const resetTokens = async (userId) => {
  if (!userId) {
    console.warn('⚠️ resetTokens: userId manquant');
    return;
  }
  
  try {
    const userIdNum = parseInt(userId);
    
    await pool.execute(
      'UPDATE user_tokens SET total_tokens = 0 WHERE user_id = ?',
      [userIdNum]
    );
    console.log(`🔄 Tokens réinitialisés pour user ${userIdNum}`);
  } catch (error) {
    console.error('❌ Erreur resetTokens:', error);
    throw error;
  }
};

/**
 * Obtient des statistiques d'utilisation globales
 */
const getUsageStats = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(total_tokens) as totalTokens,
        AVG(total_tokens) as avgTokens,
        MAX(total_tokens) as maxTokens,
        MIN(total_tokens) as minTokens
      FROM user_tokens
    `);
    
    const stats = {
      totalUsers: parseInt(rows[0].totalUsers || 0),
      totalTokens: parseInt(rows[0].totalTokens || 0),
      avgTokens: parseFloat(rows[0].avgTokens || 0),
      maxTokens: parseInt(rows[0].maxTokens || 0),
      minTokens: parseInt(rows[0].minTokens || 0)
    };
    
    console.log('📊 Statistiques d\'utilisation:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Erreur getUsageStats:', error);
    return { totalUsers: 0, totalTokens: 0 };
  }
};

/**
 * Vérifie si un utilisateur existe
 */
const userExists = async (userId) => {
  try {
    const userIdNum = parseInt(userId);
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userIdNum]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('❌ Erreur vérification utilisateur:', error);
    return false;
  }
};

/**
 * Debug: affiche l'état de la table user_tokens
 */
const debugTokensTable = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM user_tokens ORDER BY user_id');
    console.log('🔍 État de la table user_tokens:');
    console.table(rows);
    return rows;
  } catch (error) {
    console.error('❌ Erreur debug table:', error);
    return [];
  }
};

/**
 * Ferme la connexion à la base de données
 */
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    console.log('🔌 Connexion DB fermée');
  }
};

// Initialisation automatique
initDatabase().catch(console.error);

module.exports = {
  recordUsage,
  getTotalTokens,
  resetTokens,
  getUsageStats,
  userExists,
  debugTokensTable,
  closeDatabase,
  initDatabase
};