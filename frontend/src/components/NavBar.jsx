import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from '../context/AuthContext';

function NavBar() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/connexion');
    };

    return (
        <div className="navbar">
            <img src={require('../asset/img.png')} alt="Logo" className="logo-image" />
            <nav>
                <Link to="/">Accueil</Link>
                <Link to="/mondes">Mondes</Link>
                <Link to="/live">Live</Link>

                <div className="dropdown">
                    <span className="dropdown-title">Profil ▾</span>
                    <div className="dropdown-content">
                        {!token ? (
                            <>
                                <Link to="/connexion">Se connecter</Link>
                                <Link to="/inscription">S’inscrire</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/profil">Mon Profil</Link>
                                <Link to="/fragments">Mes Fragments</Link>
                                <Link to="/abonnements">Mes Abonnements</Link>
                                <button className="logout-button" onClick={handleLogout}>
                                    Se déconnecter
                                </button>
                                <Link to="/modifier-profil">Modifier Profil</Link>

                            </>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default NavBar;
