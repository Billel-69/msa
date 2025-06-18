import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/login', formData);
            login(res.data.token, res.data.user);
            alert('Connexion réussie !');
            navigate('/profil');
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur de connexion');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-avatar">
                    <img src={require('../asset/log.png')} alt="Mage" />
                </div>
                <div className="login-box">
                    <h1>CONNEXION</h1>
                    <form onSubmit={handleSubmit}>
                        <input type="email" name="email" placeholder="Adresse mail ..." required onChange={handleChange} />
                        <input type="password" name="password" placeholder="Mot de passe ..." required onChange={handleChange} />
                        <div className="login-options">
                            <label><input type="checkbox" /> Se souvenir de moi</label>
                            <a href="#">Mot de passe oublié ?</a>
                        </div>
                        <button type="submit">SE CONNECTER</button>
                        <div className="login-footer">
                            <span>Pas encore de compte ?</span>
                            <Link to="/inscription">Créer un compte</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
