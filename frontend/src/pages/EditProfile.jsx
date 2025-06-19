import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaSave, FaArrowLeft, FaUser, FaEnvelope, FaLock, FaAt } from 'react-icons/fa';
import './EditProfile.css';

function EditProfile() {
    const { token, user, login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!token) {
            navigate('/connexion');
            return;
        }

        // Pré-remplissage des données
        setFormData({
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || '',
            password: ''
        });

        // Charger la photo de profil actuelle
        if (user?.profilePicture) {
            setProfilePicturePreview(`http://localhost:5000/uploads/${user.profilePicture}`);
        }
    }, [token, user, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
        if (!formData.username.trim()) newErrors.username = 'Le pseudo est requis';
        if (formData.username.length < 3) newErrors.username = 'Le pseudo doit faire au moins 3 caractères';
        if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit faire au moins 6 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Effacer l'erreur du champ modifié
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);

            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicturePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateProfilePicture = async () => {
        if (!profilePicture) return null;

        const pictureFormData = new FormData();
        pictureFormData.append('profilePicture', profilePicture);

        try {
            const response = await axios.put(
                'http://localhost:5000/api/me/profile-picture',
                pictureFormData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data.profilePicture;
        } catch (error) {
            throw new Error('Erreur lors de la mise à jour de la photo');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            let updatedProfilePicture = user?.profilePicture;

            // Mettre à jour la photo de profil si nécessaire
            if (profilePicture) {
                updatedProfilePicture = await updateProfilePicture();
            }

            // Mettre à jour les autres informations
            await axios.put('http://localhost:5000/api/me', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Mettre à jour le contexte
            const updatedUser = {
                ...user,
                name: formData.name,
                username: formData.username,
                email: formData.email,
                profilePicture: updatedProfilePicture
            };
            login(token, updatedUser);

            alert('Profil mis à jour avec succès');
            navigate('/profil');
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de la mise à jour';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-container">
                <div className="profile-header">
                    <button
                        className="back-button"
                        onClick={() => navigate('/profil')}
                    >
                        <FaArrowLeft /> Retour au profil
                    </button>
                    <h1>Modifier mon profil</h1>
                </div>

                <div className="profile-content">
                    {/* Section photo de profil */}
                    <div className="profile-picture-section">
                        <div className="profile-picture-container">
                            <div className="profile-picture">
                                {profilePicturePreview ? (
                                    <img
                                        src={profilePicturePreview}
                                        alt="Profil"
                                        className="profile-img"
                                    />
                                ) : (
                                    <div className="default-avatar">
                                        <FaUser />
                                    </div>
                                )}
                                <div className="picture-overlay">
                                    <input
                                        type="file"
                                        id="profile-picture-input"
                                        accept="image/*"
                                        onChange={handlePictureChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="profile-picture-input"
                                        className="picture-button"
                                    >
                                        <FaCamera />
                                    </label>
                                </div>
                            </div>
                            <p className="picture-help">
                                Cliquez sur l'icône appareil photo pour changer votre photo
                            </p>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="profile-form-section">
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>
                                        <FaUser className="label-icon" />
                                        Nom complet
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={errors.name ? 'error' : ''}
                                            placeholder="Votre nom complet"
                                        />
                                    </div>
                                    {errors.name && <span className="error-message">{errors.name}</span>}
                                </div>

                                <div className="input-group">
                                    <label>
                                        <FaAt className="label-icon" />
                                        Nom d'utilisateur
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className={errors.username ? 'error' : ''}
                                            placeholder="Votre pseudo"
                                        />
                                    </div>
                                    {errors.username && <span className="error-message">{errors.username}</span>}
                                </div>

                                <div className="input-group">
                                    <label>
                                        <FaEnvelope className="label-icon" />
                                        Email
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={errors.email ? 'error' : ''}
                                            placeholder="votre@email.com"
                                        />
                                    </div>
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>

                                <div className="input-group">
                                    <label>
                                        <FaLock className="label-icon" />
                                        Nouveau mot de passe
                                        <span className="optional">(optionnel)</span>
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={errors.password ? 'error' : ''}
                                            placeholder="Laissez vide pour ne pas changer"
                                        />
                                    </div>
                                    {errors.password && <span className="error-message">{errors.password}</span>}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => navigate('/profil')}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={loading}
                                >
                                    <FaSave />
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditProfile;