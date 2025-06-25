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

// =================================================================================
// CONFIGURATION DE L'INSTANCE AXIOS
// =================================================================================

// Crée une instance d'Axios avec des paramètres par défaut.
const axiosInstance = axios.create({
    // L'URL de base de l'API backend. Toutes les requêtes relatives utiliseront cette URL.
    baseURL: 'http://localhost:5000/api',
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
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Retourne l'objet de configuration de la requête modifié (ou non).
        return config;
    },
    (error) => {
        // Gère les erreurs qui pourraient survenir lors de la configuration de la requête.
        // Cette fonction est rarement déclenchée mais est une bonne pratique à conserver.
        console.error("Erreur dans l'intercepteur de requête Axios:", error);
        return Promise.reject(error);
    }
);

// =================================================================================
// EXPORTATION
// =================================================================================
export default axiosInstance;
