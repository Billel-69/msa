/**
 * @file Login.jsx
 * @description Composant React pour la page de connexion.
 * Gère l'authentification des utilisateurs, la validation du formulaire, la gestion des erreurs et la redirection.
 */

// =================================================================================
// IMPORTATIONS
// =================================================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdAlternateEmail } from 'react-icons/md';
import './Login.css';

// =================================================================================
// COMPOSANT PRINCIPAL : Login
// =================================================================================
function Login() {
    // ---------------------------------------------------------------------------------
    // ÉTATS DU COMPOSANT
    // ---------------------------------------------------------------------------------
    const [formData, setFormData] = useState({
        identifier: '', // Peut être l'email ou le nom d'utilisateur
        password: ''      // Mot de passe
    });
    const [showPassword, setShowPassword] = useState(false); // Gère la visibilité du mot de passe
    const [loading, setLoading] = useState(false); // Gère l'état de chargement pendant la soumission
    const [errors, setErrors] = useState({}); // Stocke les erreurs de validation du formulaire

    // ---------------------------------------------------------------------------------
    // HOOKS ET CONTEXTE
    // ---------------------------------------------------------------------------------
    const { login, isAuthenticated, loading: authLoading } = useAuth(); // Contexte d'authentification
    const navigate = useNavigate(); // Hook pour la navigation programmatique

    // ---------------------------------------------------------------------------------
    // EFFETS DE CYCLE DE VIE
    // ---------------------------------------------------------------------------------
    /**
     * Redirige l'utilisateur vers la page d'accueil s'il est déjà authentifié.
     * S'exécute au chargement du composant et à chaque changement de l'état d'authentification.
     */
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            console.log('Login - Utilisateur déjà authentifié, redirection vers la page d\'accueil.');
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // ---------------------------------------------------------------------------------
    // FONCTIONS DE VALIDATION ET DE GESTION
    // ---------------------------------------------------------------------------------
    /**
     * Valide les champs du formulaire de connexion.
     * @returns {boolean} - True si le formulaire est valide, sinon false.
     */
    const validateForm = () => {
        const newErrors = {}; // Objet pour stocker les nouvelles erreurs

        // Validation de l'identifiant
        if (!formData.identifier.trim()) {
            newErrors.identifier = 'L\'email ou le nom d\'utilisateur est requis';
        }
        // Validation du mot de passe
        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        }

        setErrors(newErrors); // Met à jour l'état des erreurs
        return Object.keys(newErrors).length === 0; // Retourne true si aucune erreur
    };

    /**
     * Met à jour l'état du formulaire lors de la saisie de l'utilisateur.
     * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Efface l'erreur associée au champ en cours de modification
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ---------------------------------------------------------------------------------
    // GESTION DE LA SOUMISSION DU FORMULAIRE
    // ---------------------------------------------------------------------------------
    /**
     * Gère la soumission du formulaire de connexion.
     * Valide les données, envoie la requête à l'API et gère la réponse.
     * @param {React.FormEvent<HTMLFormElement>} e - L'événement de soumission du formulaire.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        // Arrête la soumission si le formulaire n'est pas valide
        if (!validateForm()) return;

        setLoading(true); // Active l'indicateur de chargement
        setErrors({});    // Réinitialise les erreurs

        try {
            console.log('Login - Tentative de connexion en cours...');

            // Appel à l'API pour la connexion
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                identifier: formData.identifier,
                password: formData.password
            });

            console.log('Login - Réponse reçue:', response.data);

            const { token, user } = response.data; // Extrait le token et les données utilisateur

            // Vérifie la validité de la réponse
            if (!token || !user) {
                throw new Error('Données de connexion invalides reçues du serveur');
            }

            // Utilise la fonction login du contexte d'authentification pour stocker les informations
            login(token, user);

            console.log('Login - Connexion réussie, préparation de la redirection...');

            // Redirection différenciée en fonction du type de compte de l'utilisateur
            switch (user.accountType) {
                case 'parent':
                    console.log('Login - Redirection du parent vers /parent-dashboard');
                    navigate('/parent-dashboard');
                    break;
                case 'child':
                    console.log('Login - Redirection de l\'enfant vers /');
                    navigate('/');
                    break;
                case 'teacher':
                    console.log('Login - Redirection de l\'enseignant vers /');
                    navigate('/');
                    break;
                default:
                    console.log('Login - Type de compte inconnu, redirection par défaut vers /');
                    navigate('/');
            }

        } catch (err) {
            console.error('Login - Erreur lors de la connexion:', err);

            // Gestion et affichage des messages d'erreur
            let errorMessage = 'Une erreur inattendue est survenue lors de la connexion.';

            if (err.response?.data?.error) {
                // Message d'erreur spécifique de l'API
                errorMessage = err.response.data.error;
            } else if (err.message) {
                // Message d'erreur générique (ex: problème réseau)
                errorMessage = err.message;
            }

            setErrors({ general: errorMessage }); // Affiche l'erreur à l'utilisateur
        } finally {
            setLoading(false); // Désactive l'indicateur de chargement
        }
    };

    // ---------------------------------------------------------------------------------
    // RENDU CONDITIONNEL
    // ---------------------------------------------------------------------------------
    // Affiche un indicateur de chargement pendant la vérification de l'authentification.
    if (authLoading) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="loading-auth">
                        <div className="spinner"></div>
                        <p>Vérification de l'authentification...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Affiche un message si l'utilisateur est déjà connecté.
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

    // ---------------------------------------------------------------------------------
    // RENDU PRINCIPAL DU COMPOSANT
    // ---------------------------------------------------------------------------------
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
                </div>

                <div className="login-box">
                    {errors.general && (
                        <div className="error-banner">
                            {errors.general}
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
                                    <div className="spinner"></div>
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