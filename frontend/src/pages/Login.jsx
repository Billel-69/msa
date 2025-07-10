import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdAlternateEmail } from 'react-icons/md';
import './Login.css';

function Login() {
    const [formData, setFormData] = useState({
        identifier: '', // email ou username
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Configuration API - utilise la variable d'environnement ou localhost par défaut
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Rediriger si déjà connecté
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            console.log('Login - Utilisateur déjà connecté, redirection');
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.identifier.trim()) {
            newErrors.identifier = 'Email ou nom d\'utilisateur requis';
        }
        if (!formData.password) {
            newErrors.password = 'Mot de passe requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Effacer l'erreur du champ modifié
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            console.log('Login - Tentative de connexion...');
            console.log('Login - API_URL:', API_URL);

            const response = await axios.post(`${API_URL}/api/auth/login`, {
                identifier: formData.identifier,
                password: formData.password
            });

            console.log('Login - Réponse reçue:', response.data);

            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Données de connexion invalides');
            }

            // Appeler la fonction login du contexte
            login(token, user);

            console.log('Login - Connexion réussie, redirection...');

            // Redirection selon le type de compte
            switch (user.accountType) {
                case 'parent':
                    console.log('Login - Redirection parent vers /parent-dashboard');
                    navigate('/parent-dashboard');
                    break;
                case 'child':
                    console.log('Login - Redirection enfant vers /');
                    navigate('/');
                    break;
                case 'teacher':
                    console.log('Login - Redirection professeur vers /');
                    navigate('/');
                    break;
                default:
                    console.log('Login - Redirection par défaut vers /');
                    navigate('/');
            }

        } catch (err) {
            console.error('Login - Erreur:', err);

            let errorMessage = 'Erreur de connexion';

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
                
                // Gestion spéciale pour les comptes suspendus
                if (err.response?.data?.suspended) {
                    setErrors({ 
                        general: errorMessage,
                        suspended: true 
                    });
                    setLoading(false);
                    return;
                }
            } else if (err.message) {
                errorMessage = err.message;
            } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                errorMessage = `Impossible de contacter le serveur (${API_URL}). Vérifiez que le serveur est démarré.`;
            }

            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // Afficher un loader pendant la vérification de l'auth
    if (authLoading) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="loading-auth">
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                        </div>
                        <p>Vérification de l'authentification...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Si déjà connecté, ne pas afficher le formulaire
    if (isAuthenticated) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="already-logged-in">
                        <p>Vous êtes déjà connecté. Redirection en cours...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo-animation">
                            <div className="logo-circle"></div>
                            <div className="logo-text">Kaizenverse</div>
                        </div>
                    </div>
                    <h1>Bon retour !</h1>
                    <p>Connectez-vous pour continuer votre aventure</p>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                        Serveur: {API_URL}
                    </small>
                </div>

                <div className="login-box">
                    {errors.general && (
                        <div className={`error-banner ${errors.suspended ? 'suspended-account' : ''}`}>
                            {errors.suspended && <span className="suspended-icon">🚫</span>}
                            {errors.general}
                            {errors.suspended && (
                                <div className="suspended-help">
                                    <small>Si vous pensez qu'il s'agit d'une erreur, contactez le support.</small>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdAlternateEmail className="input-icon" />
                                <input
                                    type="text"
                                    name="identifier"
                                    placeholder="Email ou nom d'utilisateur"
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    className={errors.identifier ? 'error' : ''}
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                            {errors.identifier && <span className="error-message">{errors.identifier}</span>}
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'error' : ''}
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" disabled={loading} />
                                <span className="checkmark"></span>
                                Se souvenir de moi
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner">
                                    Connexion...
                                </div>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>ou</span>
                    </div>

                    <div className="account-types-info">
                        <h3>Types de comptes disponibles</h3>
                        <div className="account-types-grid">
                            <div className="account-type-info">
                                <div className="account-icon parent">👨‍👩‍👧‍👦</div>
                                <span>Parent</span>
                            </div>
                            <div className="account-type-info">
                                <div className="account-icon child">🧒</div>
                                <span>Enfant</span>
                            </div>
                            <div className="account-type-info">
                                <div className="account-icon teacher">👩‍🏫</div>
                                <span>Professeur</span>
                            </div>
                        </div>
                    </div>

                    <div className="register-link">
                        <span>Pas encore de compte ?</span>
                        <Link to="/inscription">Créer un compte</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;