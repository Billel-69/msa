import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from '../context/AuthContext';

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, logout } = useAuth();

    // Main links including social feed and messaging
    const mainLinks = [
        { path: '/', label: 'Accueil' },
        { path: '/mondes', label: 'Mondes' },
        { path: '/live', label: 'Live' },
        { path: '/sensai', label: 'SENSAI' },
        { path: '/reseau', label: 'Réseau' },
        { path: '/messages', label: 'Messages' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/connexion');
    };

    return (
        <div className="navbar">
            {/* Brand */}
            <div className="navbar-brand">
                <img src={require('../asset/img.png')} alt="Logo" className="logo-image" />
                <span className="brand-text">Kaizenverse</span>
            </div>

            {/* Main navigation */}
            <div className="navbar-main">
                {mainLinks.map(({ path, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`nav-link${location.pathname === path ? ' active' : ''}`}
                    >{label}</Link>
                ))}
            </div>

            {/* User/auth section */}
            <div className="navbar-user">
                {!token ? (
                    <div className="auth-buttons">
                        <Link to="/connexion" className="btn-login">Se connecter</Link>
                        <Link to="/inscription" className="btn-register">S'inscrire</Link>
                    </div>
                ) : (
                    <>
                        <Link to="/profil" className={`nav-link${location.pathname === '/profil' ? ' active' : ''}`}>Mon Profil</Link>
                        <Link to="/fragments" className={`nav-link${location.pathname === '/fragments' ? ' active' : ''}`}>Fragments</Link>
                        <Link to="/abonnements" className={`nav-link${location.pathname === '/abonnements' ? ' active' : ''}`}>Abonnements</Link>
                        {user?.accountType === 'parent' && (
                            <Link to="/parent-dashboard" className="nav-link">Enfants</Link>
                        )}
                        <button className="btn-login" onClick={handleLogout}>Déconnexion</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default NavBar;