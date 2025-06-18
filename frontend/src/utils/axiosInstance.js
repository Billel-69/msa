import axios from 'axios';

// Création d'une instance Axios centralisée
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api', // base de ton backend
});

// Intercepteur pour ajouter automatiquement le token à chaque requête
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
