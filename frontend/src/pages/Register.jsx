/**
 * @file Register.jsx
 * @description Composant React pour la page d'inscription.
 * Gère un processus d'inscription en plusieurs étapes, la validation des formulaires,
 * la création de compte, la connexion automatique et la redirection.
 */

// =================================================================================
// IMPORTATIONS
// =================================================================================
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaChild, FaChalkboardTeacher, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { MdEmail, MdLock, MdPerson, MdAlternateEmail } from 'react-icons/md';
import './Register.css';

// =================================================================================
// COMPOSANT PRINCIPAL : Register
// =================================================================================
function Register() {
    // ---------------------------------------------------------------------------------
    // ÉTATS DU COMPOSANT
    // ---------------------------------------------------------------------------------
    const [step, setStep] = useState(1); // Étape actuelle du processus (1: choix du type, 2: formulaire)
    const [accountType, setAccountType] = useState(''); // Type de compte sélectionné (parent, child, teacher)
    const [formData, setFormData] = useState({
        name: '',         // Nom complet de l'utilisateur
        username: '',   // Nom d'utilisateur (pseudo)
        email: '',        // Adresse email
        password: '',     // Mot de passe
        confirmPassword: '' // Confirmation du mot de passe
    });
    const [loading, setLoading] = useState(false); // Indicateur de chargement pour les opérations asynchrones
    const [errors, setErrors] = useState({}); // Objet pour stocker les erreurs de validation du formulaire

    // ---------------------------------------------------------------------------------
    // HOOKS ET CONTEXTE
    // ---------------------------------------------------------------------------------
    const navigate = useNavigate(); // Hook pour la navigation programmatique
    const { login } = useAuth(); // Fonction de connexion du contexte d'authentification

    // ---------------------------------------------------------------------------------
    // CONFIGURATION DES TYPES DE COMPTE
    // ---------------------------------------------------------------------------------
    const accountTypes = [
        {
            type: 'parent',
            title: 'Parent',
            description: 'Superviser les progrès de vos enfants',
            icon: <FaUser />,
            color: '#00e0ff'
        },
        {
            type: 'child',
            title: 'Enfant',
            description: 'Apprendre en s\'amusant',
            icon: <FaChild />,
            color: '#ff6b6b'
        },
        {
            type: 'teacher',
            title: 'Professeur',
            description: 'Gérer vos classes et élèves',
            icon: <FaChalkboardTeacher />,
            color: '#4ecdc4'
        }
    ];

    // ---------------------------------------------------------------------------------
    // FONCTIONS DE VALIDATION ET DE GESTION
    // ---------------------------------------------------------------------------------
    /**
     * Valide les champs du formulaire d'inscription.
     * @returns {boolean} - True si le formulaire est valide, sinon false.
     */
    const validateForm = () => {
        const newErrors = {};

        // Validation des champs un par un
        if (!formData.name.trim()) {
            newErrors.name = 'Le nom complet est requis';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Le nom d\'utilisateur est requis';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'L\'adresse email est requise';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Le format de l\'email est invalide';
        }

        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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

    /**
     * Gère la sélection du type de compte et passe à l'étape suivante.
     * @param {string} type - Le type de compte sélectionné.
     */
    const handleAccountTypeSelect = (type) => {
        setAccountType(type);
        setStep(2);
    };

    // ---------------------------------------------------------------------------------
    // GESTION DE LA SOUMISSION DU FORMULAIRE
    // ---------------------------------------------------------------------------------
    /**
     * Gère la soumission du formulaire d'inscription.
     * Valide les données, envoie les requêtes à l'API (inscription puis connexion),
     * et gère la redirection de l'utilisateur.
     * @param {React.FormEvent<HTMLFormElement>} e - L'événement de soumission.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        if (!validateForm()) return; // Arrête si la validation échoue

        setLoading(true); // Active l'indicateur de chargement

        try {
            // Étape 1: Inscription de l'utilisateur
            console.log('Tentative d\'inscription en cours...');
            const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                accountType: accountType
            });

            console.log('Inscription réussie:', registerResponse.data);

            // Étape 2: Connexion automatique après une inscription réussie
            console.log('Connexion automatique en cours...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                identifier: formData.email,
                password: formData.password
            });

            console.log('Connexion réussie:', loginResponse.data);

            // Étape 3: Sauvegarde des données d'authentification dans le contexte
            login(loginResponse.data.token, loginResponse.data.user);

            // Étape 4: Redirection en fonction du type de compte
            switch (accountType) {
                case 'parent':
                    console.log('Redirection vers la configuration du compte parent...');
                    navigate('/parent-setup');
                    break;
                case 'child':
                    console.log('Redirection vers l\'accueil pour l\'enfant...');
                    navigate('/');
                    break;
                case 'teacher':
                    console.log('Redirection vers l\'accueil pour l\'enseignant...');
                    navigate('/');
                    break;
                default:
                    navigate('/');
            }

        } catch (err) {
            console.error('Erreur lors du processus d\'inscription/connexion:', err);

            // Gestion et affichage des erreurs à l'utilisateur
            let errorMessage = 'Une erreur est survenue lors de l\'inscription.';

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            // Affiche une alerte pour l'instant, pourrait être remplacé par un composant de notification
            alert(errorMessage);
        } finally {
            setLoading(false); // Désactive l'indicateur de chargement
        }
    };

    // ---------------------------------------------------------------------------------
    // RENDU CONDITIONNEL DES ÉTAPES
    // ---------------------------------------------------------------------------------
    /**
     * Affiche l'écran de sélection du type de compte.
     */
    const renderAccountTypeSelection = () => (
        <div className="account-type-selection">
            <div className="register-header">
                <h1>Créer votre compte</h1>
                <p>Choisissez le type de compte qui vous correspond</p>
            </div>

            <div className="account-types">
                {accountTypes.map(({ type, title, description, icon, color }) => (
                    <div
                        key={type}
                        className="account-type-card"
                        onClick={() => handleAccountTypeSelect(type)}
                        style={{ '--accent-color': color }}
                    >
                        <div className="account-type-icon">
                            {icon}
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <div className="select-button">
                            Choisir
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /**
     * Affiche le formulaire d'inscription une fois le type de compte choisi.
     */
    const renderRegistrationForm = () => {
        const selectedAccountType = accountTypes.find(a => a.type === accountType);

        return (
            <div className="registration-form-container">
                <div className="form-header">
                    <button
                        className="back-button"
                        onClick={() => setStep(1)}
                        type="button"
                    >
                        <FaArrowLeft /> Retour
                    </button>

                    <div className="account-type-badge">
                        {selectedAccountType && selectedAccountType.icon}
                        <span>Compte {selectedAccountType ? selectedAccountType.title : ''}</span>
                    </div>
                </div>

                <div className="register-box">
                    <h2>Informations du compte</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdPerson className="input-icon" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nom complet"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={errors.name ? 'error' : ''}
                                    disabled={loading}
                                />
                            </div>
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdAlternateEmail className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Pseudo (nom d'utilisateur)"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={errors.username ? 'error' : ''}
                                    disabled={loading}
                                />
                            </div>
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdEmail className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Adresse email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error' : ''}
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdLock className="input-icon" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'error' : ''}
                                    disabled={loading}
                                />
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <MdLock className="input-icon" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirmer le mot de passe"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={errors.confirmPassword ? 'error' : ''}
                                    disabled={loading}
                                />
                            </div>
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>

                        <div className="terms-checkbox">
                            <label>
                                <input type="checkbox" required disabled={loading} />
                                <span className="checkmark">
                                    <FaCheck />
                                </span>
                                <span>J'accepte les <Link to="/terms">conditions d'utilisation</Link></span>
                            </label>
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                    Création en cours...
                                </div>
                            ) : (
                                'Créer mon compte'
                            )}
                        </button>
                    </form>

                    <div className="login-link">
                        <span>Vous avez déjà un compte ?</span>
                        <Link to="/connexion">Se connecter</Link>
                    </div>
                </div>
            </div>
        );
    };

    // ---------------------------------------------------------------------------------
    // RENDU PRINCIPAL DU COMPOSANT
    // ---------------------------------------------------------------------------------
    return (
        <div className="register-page">
            <div className="register-container">
                {/* Affiche le composant correspondant à l'étape actuelle */}
                {step === 1 ? renderAccountTypeSelection() : renderRegistrationForm()}
            </div>
        </div>
    );
}

export default Register;