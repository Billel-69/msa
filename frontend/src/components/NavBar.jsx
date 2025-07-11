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
    FaBell,
    FaPlay,
    FaBook
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
                <img src={require('../asset/img.png')} alt="Logo" className="navbar-logo-image" />
                <span className="navbar-brand-text">MSA</span>
            </div>

            <div className="navbar-main">
                <Link
                    to="/"
                    className={`navbar-nav-link ${isActiveLink('/') && location.pathname === '/' ? 'active' : ''}`}
                >
                    <FaHome className="navbar-nav-icon" />
                    <span>Accueil</span>
                </Link>

                <Link
                    to="/mondes"
                    className={`navbar-nav-link ${isActiveLink('/mondes') ? 'active' : ''}`}
                >
                    <FaGlobeAmericas className="navbar-nav-icon" />
                    <span>Mondes</span>
                </Link>

                {/* NOUVEAU: Lien vers la bibliothèque vidéo */}
                <Link
                    to="/videos"
                    className={`navbar-nav-link ${isActiveLink('/videos') ? 'active' : ''}`}
                >
                    <FaPlay className="navbar-nav-icon" />
                    <span>Vidéos</span>
                </Link>

                <Link
                    to="/live"
                    className={`navbar-nav-link ${isActiveLink('/live') ? 'active' : ''}`}
                >
                    <FaVideo className="navbar-nav-icon" />
                    <span>Live</span>
                </Link>

                {/* Liens pour utilisateurs connectés */}
                {token && (
                    <>
                        <Link
                            to="/reseau"
                            className={`navbar-nav-link ${isActiveLink('/reseau') ? 'active' : ''}`}
                        >
                            <FaUsers className="navbar-nav-icon" />
                            <span>Réseau</span>
                        </Link>

                        <Link
                            to="/messages"
                            className={`navbar-nav-link ${isActiveLink('/messages') ? 'active' : ''}`}
                        >
                            <FaEnvelope className="navbar-nav-icon" />
                            <span>Messages</span>
                        </Link>
                    </>
                )}
            </div>

            <div className="navbar-user">
                {!token ? (
                    <div className="navbar-auth-buttons">
                        <Link to="/connexion" className="navbar-btn-login">
                            Se connecter
                        </Link>
                        <Link to="/inscription" className="navbar-btn-register">
                            S'inscrire
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Notifications (placeholder pour futur) */}
                        <button className="navbar-notification-btn" title="Notifications">
                            <FaBell />
                            <span className="navbar-notification-badge">3</span>
                        </button>

                        {/* Profile Dropdown */}
                        <div className={`navbar-profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
                            <button
                                className="navbar-profile-trigger"
                                onClick={toggleProfileDropdown}
                            >
                                <div className="navbar-profile-avatar">
                                    {user?.profilePicture ? (
                                        <img
                                            src={`http://localhost:5000/uploads/${user.profilePicture}`}
                                            alt={user?.name}
                                        />
                                    ) : (
                                        <span>{user?.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="navbar-profile-info">
                                    <span className="navbar-profile-name">{user?.name}</span>
                                    <span className="navbar-profile-type">
                                        {user?.accountType === 'child' ? '🧒 Enfant' :
                                            user?.accountType === 'parent' ? '👨‍👩‍👧‍👦 Parent' : '👩‍🏫 Professeur'}
                                    </span>
                                </div>
                                <FaChevronDown className={`navbar-dropdown-arrow ${isProfileOpen ? 'rotated' : ''}`} />
                            </button>

                            <div className="navbar-dropdown-menu">
                                <div className="navbar-dropdown-header">
                                    <div className="navbar-user-stats">
                                        <div className="navbar-stat">
                                            <FaGem className="navbar-stat-icon" />
                                            <span>Niveau {user?.level || 1}</span>
                                        </div>
                                        <div className="navbar-stat">
                                            <FaCrown className="navbar-stat-icon" />
                                            <span>{user?.fragments || 0} fragments</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="navbar-dropdown-section">
                                    <h4>Mon Compte</h4>
                                    <Link
                                        to="/profil"
                                        className="navbar-dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaUser className="navbar-dropdown-icon" />
                                        Mon Profil
                                    </Link>
                                    <Link
                                        to="/fragments"
                                        className="navbar-dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaGem className="navbar-dropdown-icon" />
                                        Mes Fragments
                                    </Link>
                                    <Link
                                        to="/abonnements"
                                        className="navbar-dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCrown className="navbar-dropdown-icon" />
                                        Mes Abonnements
                                    </Link>
                                </div>

                                {/* NOUVEAU: Section spéciale pour les professeurs */}
                                {user?.accountType === 'teacher' && (
                                    <div className="navbar-dropdown-section">
                                        <h4>Espace Professeur</h4>
                                        <Link
                                            to="/videos/upload"
                                            className="navbar-dropdown-item special"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <FaPlay className="navbar-dropdown-icon" />
                                            Ajouter une vidéo
                                        </Link>
                                        <Link
                                            to="/videos/my-videos"
                                            className="navbar-dropdown-item"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <FaBook className="navbar-dropdown-icon" />
                                            Mes vidéos
                                        </Link>
                                    </div>
                                )}

                                {/* Section spéciale pour les parents */}
                                {user?.accountType === 'parent' && (
                                    <div className="navbar-dropdown-section">
                                        <h4>Gestion Famille</h4>
                                        <Link
                                            to="/parent-dashboard"
                                            className="navbar-dropdown-item special"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <FaUsers className="navbar-dropdown-icon" />
                                            Gestion Enfants
                                        </Link>
                                    </div>
                                )}

                                <div className="navbar-dropdown-section">
                                    <h4>Paramètres</h4>
                                    <Link
                                        to="/modifier-profil"
                                        className="navbar-dropdown-item"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCog className="navbar-dropdown-icon" />
                                        Modifier Profil
                                    </Link>
                                </div>

                                <div className="navbar-dropdown-footer">
                                    <button
                                        className="navbar-logout-button"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt className="navbar-dropdown-icon" />
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
                    className="navbar-dropdown-overlay"
                    onClick={() => setIsProfileOpen(false)}
                ></div>
            )}
        </nav>
    );
}

export default NavBar;