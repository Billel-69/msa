import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from '../context/AuthContext';
import {
    FaHome,
    FaGlobeAmericas,
    FaVideo,
    FaUsers,
    FaEnvelope,
    FaUser,
    FaGem,
    FaCrown,
    FaCog,
    FaSignOutAlt,
    FaChevronDown,
    FaBell
} from 'react-icons/fa';

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/connexion');
        setIsProfileOpen(false);
    };

    const isActiveLink = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const toggleProfileDropdown = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={require('../asset/img.png')} alt="Logo" className="logo-image" />
                <span className="brand-text">MSA</span>
            </div>

            <div className="navbar-main">
                <Link
                    to="/"
                    className={`nav-link ${isActiveLink('/') && location.pathname === '/' ? 'active' : ''}`}
                >
                    <FaHome className="nav-icon" />
                    <span>Accueil</span>
                </Link>

                <Link
                    to="/mondes"
                    className={`nav-link ${isActiveLink('/mondes') ? 'active' : ''}`}
                >
                    <FaGlobeAmericas className="nav-icon" />
                    <span>Mondes</span>
                </Link>

                <Link
                    to="/live"
                    className={`nav-link ${isActiveLink('/live') ? 'active' : ''}`}
                >
                    <FaVideo className="nav-icon" />
                    <span>Live</span>
                </Link>

                {/* Liens pour utilisateurs connectés */}
                {token && (
                    <>
                        <Link
                            to="/reseau"
                            className={`nav-link ${isActiveLink('/reseau') ? 'active' : ''}`}
                        >
                            <FaUsers className="nav-icon" />
                            <span>Réseau</span>
                        </Link>

                        <Link
                            to="/messages"
                            className={`nav-link ${isActiveLink('/messages') ? 'active' : ''}`}
                        >
                            <FaEnvelope className="nav-icon" />
                            <span>Messages</span>
                        </Link>
                    </>
                )}
            </div>

            <div className="navbar-user">
                {!token ? (
                    <div className="auth-buttons">
                        <Link to="/connexion" className="btn-login">
                            Se connecter
                        </Link>
                        <Link to="/inscription" className="btn-register">
                            S'inscrire
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Notifications (placeholder pour futur) */}
                        <button className="notification-btn" title="Notifications">
                            <FaBell />
                            <span className="notification-badge">3</span>
                        </button>

                        {/* Profile Dropdown */}
                        <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
                            <button
                                className="profile-trigger"
                                onClick={toggleProfileDropdown}
                            >
                                <div className="profile-avatar">
                                    {user?.profilePicture ? (
                                        <img
                                            src={`http://localhost:5000/uploads/${user.profilePicture}`}
                                            alt={user?.name}
                                        />
                                    ) : (
                                        <span>{user?.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="profile-info">
                                    <span className="profile-name">{user?.name}</span>
                                    <span className="profile-type">
                                        {user?.accountType === 'child' ? '🧒 Enfant' :
                                            user?.accountType === 'parent' ? '👨‍👩‍👧‍👦 Parent' : '👩‍🏫 Professeur'}
                                    </span>
                                </div>
                                <FaChevronDown className={`dropdown-arrow ${isProfileOpen ? 'rotated' : ''}`} />
                            </button>

                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <div className="user-stats">
                                        <div className="stat">
                                            <FaGem className="stat-icon" />
                                            <span>Niveau {user?.level || 1}</span>
                                        </div>
                                        <div className="stat">
                                            <FaCrown className="stat-icon" />
                                            <span>{user?.fragments || 0} fragments</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="dropdown-section">
                                    <h4>Mon Compte</h4>
                                    <Link
                                        to="/profil"
                                        className="dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaUser className="dropdown-icon" />
                                        Mon Profil
                                    </Link>
                                    <Link
                                        to="/fragments"
                                        className="dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaGem className="dropdown-icon" />
                                        Mes Fragments
                                    </Link>
                                    <Link
                                        to="/abonnements"
                                        className="dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCrown className="dropdown-icon" />
                                        Mes Abonnements
                                    </Link>
                                </div>

                                {/* Section spéciale pour les parents */}
                                {user?.accountType === 'parent' && (
                                    <div className="dropdown-section">
                                        <h4>Gestion Famille</h4>
                                        <Link
                                            to="/parent-dashboard"
                                            className="dropdown-item special"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <FaUsers className="dropdown-icon" />
                                            Gestion Enfants
                                        </Link>
                                    </div>
                                )}

                                <div className="dropdown-section">
                                    <h4>Paramètres</h4>
                                    <Link
                                        to="/modifier-profil"
                                        className="dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCog className="dropdown-icon" />
                                        Modifier Profil
                                    </Link>
                                </div>

                                <div className="dropdown-footer">
                                    <button
                                        className="logout-button"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt className="dropdown-icon" />
                                        Se déconnecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Overlay pour fermer le dropdown */}
            {isProfileOpen && (
                <div
                    className="dropdown-overlay"
                    onClick={() => setIsProfileOpen(false)}
                ></div>
            )}
        </nav>
    );
}

export default NavBar;