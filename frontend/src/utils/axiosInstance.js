/**
 * @file axiosInstance.js
 * @description Fichier de configuration pour une instance Axios centralisée.
 * Ce module crée une instance d'Axios avec une URL de base préconfigurée
 * et un intercepteur de requête pour ajouter automatiquement le token d'authentification JWT.
 * Cela simplifie les appels API à travers l'application.
 */

// =================================================================================
// IMPORTATIONS
// =================================================================================
import axios from 'axios';

// Base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// =================================================================================
// CONFIGURATION DE L'INSTANCE AXIOS
// =================================================================================

// Crée une instance d'Axios avec des paramètres par défaut.
const axiosInstance = axios.create({
    // L'URL de base de l'API backend. Toutes les requêtes relatives utiliseront cette URL.
    baseURL: API_BASE_URL,
});

// =================================================================================
// INTERCEPTEUR DE REQUÊTE
// =================================================================================

/**
 * Intercepteur de requête Axios.
 * Ce middleware s'exécute avant chaque requête envoyée depuis l'application.
 * Son rôle est de récupérer le token JWT depuis le localStorage et de l'injecter
 * dans l'en-tête 'Authorization' de la requête si le token existe.
 */
axiosInstance.interceptors.request.use(
    (config) => {
        // Récupère le token stocké dans le localStorage.
        const token = localStorage.getItem('token');

        // Si un token est trouvé, l'ajoute à l'en-tête d'autorisation.
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        // Retourne l'objet de configuration de la requête modifié (ou non).
        return config;
    },
    (error) => {
        // Gère les erreurs qui pourraient survenir lors de la configuration de la requête.
        // Cette fonction est rarement déclenchée mais est une bonne pratique à conserver.
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// =================================================================================
// INTERCEPTEUR DE RÉPONSE
// =================================================================================
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${originalRequest?.url}`);

        // Gestion des erreurs d'authentification

        return Promise.reject(error);
    }
);

// =================================================================================
// EXPORTATION
// =================================================================================
export default axiosInstance;
