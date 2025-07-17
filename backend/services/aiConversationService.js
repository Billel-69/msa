//aiConversationService.js
/**
 * Service d'enregistrement des conversations AI
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Configuration DB
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

const initPool = async () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

/**
 * Enregistre une conversation AI
 */
const recordAIConversation = async (data) => {
  const {
    user_id,
    session_id = uuidv4(),
    message,
    response,
    model_used,
    tokens_used = 0,
    response_time_ms = 0
  } = data;
  
  try {
    const pool = await initPool();
    
    await pool.execute(`
      INSERT INTO ai_conversations 
      (user_id, session_id, message, response, model_used, tokens_used, response_time_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [user_id, session_id, message, response, model_used, tokens_used, response_time_ms]);
    
    console.log(`💬 Conversation enregistrée: ${model_used} pour user ${user_id}`);
    
    // Mettre à jour les stats quotidiennes
    await updateDailyStats(model_used);
    
  } catch (error) {
    console.error('❌ Erreur enregistrement conversation:', error);
    // Ne pas faire échouer la requête principale
  }
};

/**
 * Met à jour les statistiques quotidiennes
 */
const updateDailyStats = async (model_used) => {
  try {
    const pool = await initPool();
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      INSERT INTO ai_usage_stats (date, total_requests, openai_requests, rag_requests)
      VALUES (?, 1, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_requests = total_requests + 1,
        openai_requests = openai_requests + VALUES(openai_requests),
        rag_requests = rag_requests + VALUES(rag_requests)
    `;
    
    const isOpenAI = model_used === 'openai' ? 1 : 0;
    const isRAG = model_used === 'rag_local' ? 1 : 0;
    
    await pool.execute(sql, [today, isOpenAI, isRAG]);
    
  } catch (error) {
    console.error('❌ Erreur mise à jour stats:', error);
  }
};

/**
 * Récupère l'historique des conversations d'un utilisateur
 */
const getUserConversationHistory = async (userId, limit = 10) => {
  try {
    const pool = await initPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        session_id,
        message,
        response,
        model_used,
        tokens_used,
        created_at
      FROM ai_conversations
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);
    
    return rows;
    
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    return [];
  }
};

/**
 * Récupère les statistiques d'utilisation
 */
const getUsageStatistics = async (days = 7) => {
  try {
    const pool = await initPool();
    
    const [rows] = await pool.execute(`
      SELECT 
        date,
        total_requests,
        openai_requests,
        rag_requests,
        (rag_requests * 100.0 / NULLIF(total_requests, 0)) as rag_percentage
      FROM ai_usage_stats
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY date DESC
    `, [days]);
    
    return rows;
    
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return [];
  }
};

module.exports = {
  recordAIConversation,
  getUserConversationHistory,
  getUsageStatistics
}; 