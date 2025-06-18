import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css'; // tu peux créer un fichier css à part

function EditProfile() {
    const { token, user, login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        if (!token) {
            navigate('/connexion');
            return;
        }

        // Pré-remplissage des données
        setFormData({
            name: user.name,
            email: user.email,
            password: ''
        });
    }, [token, user, navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('http://localhost:5000/api/me', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // mettre à jour le contexte après modification du nom/email
            const updatedUser = { ...user, name: formData.name, email: formData.email };
            login(token, updatedUser);

            alert('Profil mis à jour avec succès');
            navigate('/profil');
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la mise à jour');
            console.error(err);
        }
    };

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-container">
                <h1>Modifier mon profil</h1>
                <form onSubmit={handleSubmit}>
                    <label>Nom</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />

                    <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} />

                    <button type="submit">Enregistrer</button>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
