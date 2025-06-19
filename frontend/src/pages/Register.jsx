import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaChild, FaChalkboardTeacher, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { MdEmail, MdLock, MdPerson, MdAlternateEmail } from 'react-icons/md';
import './Register.css';

function Register() {
    const [step, setStep] = useState(1); // 1: type de compte, 2: informations
    const [accountType, setAccountType] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();
    const { login } = useAuth();

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Le pseudo est requis';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Le pseudo doit faire au moins 3 caractères';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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

    const handleAccountTypeSelect = (type) => {
        setAccountType(type);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // 1. Inscription
            console.log('Tentative d\'inscription...');
            const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                accountType: accountType
            });

            console.log('Inscription réussie:', registerResponse.data);

            // 2. Connexion automatique après inscription
            console.log('Connexion automatique...');
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                identifier: formData.email,
                password: formData.password
            });

            console.log('Connexion réussie:', loginResponse.data);

            // 3. Sauvegarder les données d'authentification
            login(loginResponse.data.token, loginResponse.data.user);

            // 4. Redirection selon le type de compte
            switch (accountType) {
                case 'parent':
                    console.log('Redirection vers parent-setup');
                    navigate('/parent-setup');
                    break;
                case 'child':
                    console.log('Redirection vers accueil pour enfant');
                    navigate('/'); // Page Home.jsx
                    break;
                case 'teacher':
                    console.log('Redirection vers accueil pour professeur');
                    navigate('/'); // Page d'accueil
                    break;
                default:
                    navigate('/');
            }

        } catch (err) {
            console.error('Erreur lors de l\'inscription ou connexion:', err);

            let errorMessage = 'Erreur lors de l\'inscription';

            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="register-page">
            <div className="register-container">
                {step === 1 ? renderAccountTypeSelection() : renderRegistrationForm()}
            </div>
        </div>
    );
}

export default Register;