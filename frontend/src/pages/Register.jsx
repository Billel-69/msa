import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:5000/api/register', formData, {
                headers: { 'Content-Type': 'application/json' }
            });

            alert(res.data.message); // Ex: "Inscription réussie"
            navigate('/connexion');
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de l\'inscription');
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-avatar">
                    <img src={require('../asset/log.png')} alt="Mage" />
                </div>
                <div className="register-box">
                    <h1>INSCRIPTION</h1>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Nom"
                            required
                            onChange={handleChange}
                            value={formData.name}
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Adresse mail ..."
                            required
                            onChange={handleChange}
                            value={formData.email}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mot de passe ..."
                            required
                            onChange={handleChange}
                            value={formData.password}
                        />
                        <div className="register-options">
                            <label>
                                <input type="checkbox" required /> J'accepte les conditions
                            </label>
                        </div>
                        <button type="submit">S’INSCRIRE</button>
                        <div className="register-footer">
                            <span>Vous avez déjà un compte ?</span>
                            <Link to="/connexion">Se connecter</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
