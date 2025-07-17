//ragService.js
/**
 * Service RAG - Appel HTTP vers le microservice Python RAG
 * Expose generateRagAnswer(question, history)
 */

const axios = require('axios');

// Configuration du service RAG
const RAG_URL = process.env.RAG_URL || 'http://127.0.0.1:9100';
const RAG_TIMEOUT = 999999; // 30 secondes

/**
 * Génère une réponse via le moteur RAG Python
 * @param {string} question - Question de l'élève
 * @param {Array} history - Historique des messages [{role, content}]
 * @returns {Promise<string>} Réponse du RAG
 */
const generateRagAnswer = async (question, history = []) => {
  try {
    console.log(`🤖 Appel RAG: "${question.substring(0, 50)}..."`);
    console.log(`📚 Historique: ${history.length} messages`);
    
    const payload = {
      question: question,
      history: history
    };
    
    const response = await axios.post(
      `${RAG_URL}/generate`,
      payload,
      {
        timeout: RAG_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.answer) {
      console.log(`✅ Réponse RAG reçue (${response.data.answer.length} caractères)`);
      return response.data.answer;
    } else {
      throw new Error('Format de réponse RAG invalide');
    }
    
  } catch (error) {
    console.error('❌ Erreur appel RAG:', error.message);
    
    // Gestion des erreurs spécifiques
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Service RAG non disponible - vérifiez que le microservice Python est démarré');
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Service RAG en timeout - le traitement prend trop de temps');
    }
    
    if (error.response) {
      // Erreur HTTP du service RAG
      const status = error.response.status;
      const detail = error.response.data?.detail || 'Erreur inconnue';
      throw new Error(`Service RAG erreur ${status}: ${detail}`);
    }
    
    throw new Error(`Erreur communication RAG: ${error.message}`);
  }
};

/**
 * Vérifie si le service RAG est disponible
 * @returns {Promise<boolean>} True si le service répond
 */
const checkRagHealth = async () => {
  try {
    const response = await axios.get(`${RAG_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.warn('⚠️ Service RAG non disponible:', error.message);
    return false;
  }
};

/**
 * Récupère les informations du service RAG
 * @returns {Promise<Object>} Informations du service
 */
const getRagInfo = async () => {
  try {
    const response = await axios.get(`${RAG_URL}/info`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer les infos RAG:', error.message);
    return { status: 'unavailable', error: error.message };
  }
};

module.exports = {
  generateRagAnswer,
  checkRagHealth,
  getRagInfo
}; 
