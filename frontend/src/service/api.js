import axios from 'axios';

// Configuration de base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.62:5000';

// Configuration axios avec retry automatique
const createApiClient = () => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // 30 secondes
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Intercepteur pour ajouter automatiquement le token
    client.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            console.error('❌ Request interceptor error:', error);
            return Promise.reject(error);
        }
    );

    // Intercepteur pour gérer les réponses et erreurs
    client.interceptors.response.use(
        (response) => {
            console.log(`✅ API Response: ${response.status} ${response.config.url}`);
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            console.error(`❌ API Error: ${error.response?.status || 'Network'} ${originalRequest?.url}`);

            // Gestion des erreurs d'authentification
            if (error.response?.status === 401 && !originalRequest._retry) {
                console.log('🔄 Token expiré, redirection vers login...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/connexion';
                return Promise.reject(error);
            }

            // Retry automatique pour les erreurs de réseau ou timeout
            if ((!error.response || error.code === 'ECONNABORTED') && !originalRequest._retry) {
                originalRequest._retry = true;

                console.log('🔄 Retry automatique...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                return client(originalRequest);
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// Instance API principale
export const apiClient = createApiClient();

// Fonctions utilitaires pour les appels API
export const api = {
    // Authentification
    auth: {
        login: (credentials) => apiClient.post('/api/auth/login', credentials),
        register: (userData) => apiClient.post('/api/auth/register', userData),
        getProfile: () => apiClient.get('/api/auth/me'),
        updateProfile: (data) => apiClient.put('/api/auth/me', data)
    },

    // Sessions live
    live: {
        getActiveSessions: () => apiClient.get('/api/live/active-sessions'),
        getMySessions: () => apiClient.get('/api/live/my-sessions'),
        createSession: (sessionData) => apiClient.post('/api/live/create-session', sessionData),
        getSession: (sessionId) => apiClient.get(`/api/live/session/${sessionId}`),
        joinSession: (sessionId, password = null) =>
            apiClient.post(`/api/live/join-session/${sessionId}`, password ? { password } : {}),
        leaveSession: (sessionId) => apiClient.post(`/api/live/leave-session/${sessionId}`),
        startSession: (sessionId) => apiClient.post(`/api/live/start-session/${sessionId}`),
        endSession: (sessionId) => apiClient.post(`/api/live/end-session/${sessionId}`),
        getSessionByCode: (code) => apiClient.get(`/api/live/session-by-code/${code}`),
        getChatMessages: (sessionId, limit = 50, offset = 0) =>
            apiClient.get(`/api/live/session/${sessionId}/chat?limit=${limit}&offset=${offset}`),
        sendChatMessage: (sessionId, message) =>
            apiClient.post(`/api/live/session/${sessionId}/chat`, { message })
    },

    // Posts sociaux
    posts: {
        getFeed: () => apiClient.get('/api/feed'),
        createPost: (postData) => apiClient.post('/api/posts', postData),
        getPost: (postId) => apiClient.get(`/api/posts/${postId}`),
        deletePost: (postId) => apiClient.delete(`/api/posts/${postId}`),
        likePost: (postId) => apiClient.post(`/api/posts/${postId}/like`),
        getUserPosts: (userId) => apiClient.get(`/api/posts/user/${userId}`)
    },

    // Commentaires
    comments: {
        getComments: (postId) => apiClient.get(`/api/comments/${postId}`),
        createComment: (commentData) => apiClient.post('/api/comments', commentData),
        deleteComment: (commentId) => apiClient.delete(`/api/comments/${commentId}`),
        likeComment: (commentId) => apiClient.post(`/api/comments/${commentId}/like`)
    },

    // Messages privés
    messages: {
        getConversations: () => apiClient.get('/api/messages/conversations'),
        getConversation: (conversationId) => apiClient.get(`/api/messages/conversation/${conversationId}`),
        getMessages: (conversationId, page = 1, limit = 50) =>
            apiClient.get(`/api/messages/conversation/${conversationId}/messages?page=${page}&limit=${limit}`),
        sendMessage: (conversationId, content) =>
            apiClient.post(`/api/messages/conversation/${conversationId}/send`, { content }),
        searchUsers: (query) => apiClient.get(`/api/messages/search-users?q=${encodeURIComponent(query)}`)
    },

    // Tests et debug
    test: {
        health: () => apiClient.get('/api/test/health'),
        testDb: () => apiClient.get('/api/test/test-db'),
        testAuth: () => apiClient.get('/api/test/test-auth'),
        apiInfo: () => apiClient.get('/api/test/api-info')
    }
};

// Fonction pour tester la connectivité
export const testConnection = async () => {
    try {
        console.log('🧪 Test de connectivité API...');
        const response = await api.test.health();
        console.log('✅ Connectivité API OK:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ Test de connectivité échoué:', error);
        return {
            success: false,
            error: error.message,
            details: {
                code: error.code,
                status: error.response?.status,
                baseURL: API_BASE_URL
            }
        };
    }
};

// Fonction pour débugger l'authentification
export const debugAuth = async () => {
    try {
        console.log('🔍 Debug authentification...');
        const response = await api.test.testAuth();
        console.log('✅ Authentification OK:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ Debug authentification échoué:', error);
        return {
            success: false,
            error: error.message,
            details: {
                hasToken: !!localStorage.getItem('token'),
                status: error.response?.status
            }
        };
    }
};

// Export des constantes
export const API_CONSTANTS = {
    BASE_URL: API_BASE_URL,
    TIMEOUT: 30000,
    RETRY_DELAY: 2000
};

console.log('🔧 API Client initialisé:', API_BASE_URL);