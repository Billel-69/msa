import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaPlus, FaChild, FaUserPlus } from 'react-icons/fa';
import { MdEmail, MdPerson, MdLock, MdAlternateEmail } from 'react-icons/md';
import './ParentSetup.css';

function ParentSetup() {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [newChildData, setNewChildData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});

    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Vérification simple du type de compte
    useEffect(() => {
        if (user && user.accountType !== 'parent') {
            console.log('Utilisateur non-parent redirigé vers /', user.accountType);
            navigate('/');
        }
    }, [user, navigate]);

    // Si pas d'utilisateur ou pas parent, afficher un message
    if (!user) {
        return (
            <div className="parent-setup-page">
                <div className="parent-setup-container">
                    <div>Chargement...</div>
                </div>
            </div>
        );
    }

    if (user.accountType !== 'parent') {
        return (
            <div className="parent-setup-page">
                <div className="parent-setup-container">
                    <div>Accès non autorisé. Cette page est réservée aux parents.</div>
                </div>
            </div>
        );
    }

    const searchChild = async () => {
        if (!searchTerm.trim()) {
            alert('Veuillez saisir un pseudo ou un email');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/link-child',
                { childIdentifier: searchTerm.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            alert('Enfant lié avec succès !');
            navigate('/parent-dashboard'); // CHANGÉ: redirige vers le dashboard
        } catch (error) {
            console.error('Erreur lors de la liaison:', error);
            if (error.response?.status === 404) {
                alert('Aucun compte enfant trouvé avec cet identifiant');
            } else {
                alert(error.response?.data?.error || 'Erreur lors de la recherche');
            }
        } finally {
            setLoading(false);
        }
    };

    const validateChildForm = () => {
        const newErrors = {};

        if (!newChildData.name.trim()) newErrors.name = 'Le nom est requis';
        if (!newChildData.username.trim()) newErrors.username = 'Le pseudo est requis';
        if (newChildData.username.length < 3) newErrors.username = 'Le pseudo doit faire au moins 3 caractères';
        if (!newChildData.email.trim()) newErrors.email = 'L\'email est requis';
        if (!/\S+@\S+\.\S+/.test(newChildData.email)) newErrors.email = 'Email invalide';
        if (!newChildData.password) newErrors.password = 'Le mot de passe est requis';
        if (newChildData.password.length < 6) newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createChild = async () => {
        if (!validateChildForm()) return;

        setLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:5000/api/auth/create-child',
                newChildData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Réponse création enfant:', response.data);
            alert('Compte enfant créé avec succès !');
            navigate('/parent-dashboard'); // CHANGÉ: redirige vers le dashboard
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            alert(error.response?.data?.error || 'Erreur lors de la création du compte');
        } finally {
            setLoading(false);
        }
    };

    const handleChildDataChange = (e) => {
        const { name, value } = e.target;
        setNewChildData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const renderChoiceStep = () => (
        <div className="parent-setup-choice">
            <div className="setup-header">
                <h1>Configuration du compte parent</h1>
                <p>Voulez-vous lier un compte enfant existant ou en créer un nouveau ?</p>
            </div>

            <div className="choice-cards">
                <div className="choice-card" onClick={() => setStep(2)}>
                    <div className="choice-icon">
                        <FaSearch />
                    </div>
                    <h3>Lier un enfant existant</h3>
                    <p>Votre enfant a déjà un compte ? Liez-le à votre compte parent.</p>
                    <div className="choice-button">
                        Rechercher un compte
                    </div>
                </div>

                <div className="choice-card" onClick={() => setStep(3)}>
                    <div className="choice-icon">
                        <FaPlus />
                    </div>
                    <h3>Créer un compte enfant</h3>
                    <p>Créez un nouveau compte pour votre enfant directement.</p>
                    <div className="choice-button">
                        Créer un compte
                    </div>
                </div>
            </div>

            <button
                className="skip-button"
                onClick={() => navigate('/parent-dashboard')}
            >
                Passer cette étape
            </button>
        </div>
    );

    const renderLinkChildStep = () => (
        <div className="parent-setup-link">
            <div className="setup-header">
                <h2>Lier un compte enfant existant</h2>
                <p>Entrez le pseudo ou l'email de votre enfant</p>
            </div>

            <div className="search-container">
                <div className="search-input-wrapper">
                    <FaChild className="search-icon" />
                    <input
                        type="text"
                        placeholder="Pseudo ou email de l'enfant"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchChild()}
                    />
                </div>

                <button
                    className="search-button"
                    onClick={searchChild}
                    disabled={loading || !searchTerm.trim()}
                >
                    {loading ? 'Recherche...' : 'Rechercher'}
                </button>
            </div>

            <div className="setup-actions">
                <button className="back-button" onClick={() => setStep(1)}>
                    Retour
                </button>
                <button
                    className="skip-button-small"
                    onClick={() => navigate('/parent-dashboard')}
                >
                    Terminer plus tard
                </button>
            </div>
        </div>
    );

    const renderCreateChildStep = () => (
        <div className="parent-setup-create">
            <div className="setup-header">
                <h2>Créer un compte enfant</h2>
                <p>Remplissez les informations pour le nouveau compte</p>
            </div>

            <div className="create-child-form">
                <div className="input-group">
                    <div className="input-wrapper">
                        <MdPerson className="input-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Nom complet de l'enfant"
                            value={newChildData.name}
                            onChange={handleChildDataChange}
                            className={errors.name ? 'error' : ''}
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
                            placeholder="Pseudo"
                            value={newChildData.username}
                            onChange={handleChildDataChange}
                            className={errors.username ? 'error' : ''}
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
                            placeholder="Email de l'enfant"
                            value={newChildData.email}
                            onChange={handleChildDataChange}
                            className={errors.email ? 'error' : ''}
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
                            value={newChildData.password}
                            onChange={handleChildDataChange}
                            className={errors.password ? 'error' : ''}
                        />
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <button
                    className="create-button"
                    onClick={createChild}
                    disabled={loading}
                >
                    <FaUserPlus />
                    {loading ? 'Création...' : 'Créer le compte'}
                </button>
            </div>

            <div className="setup-actions">
                <button className="back-button" onClick={() => setStep(1)}>
                    Retour
                </button>
                <button
                    className="skip-button-small"
                    onClick={() => navigate('/parent-dashboard')}
                >
                    Terminer plus tard
                </button>
            </div>
        </div>
    );

    return (
        <div className="parent-setup-page">
            <div className="parent-setup-container">
                {step === 1 && renderChoiceStep()}
                {step === 2 && renderLinkChildStep()}
                {step === 3 && renderCreateChildStep()}
            </div>
        </div>
    );
}

export default ParentSetup;