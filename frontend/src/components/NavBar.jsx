import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
    FaGamepad,
    FaRobot
} from 'react-icons/fa';

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const dropdownRef = useRef(null);
    const notificationsRef = useRef(null);

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
        setIsNotificationsOpen(false);
    };

    const toggleNotificationsDropdown = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        setIsProfileOpen(false);
    };

    // Fetch notifications when opening dropdown
    useEffect(() => {
        if (isNotificationsOpen && token) {
            fetchNotifications();
        }
    }, [isNotificationsOpen, token]);

    const fetchNotifications = async () => {
        if (!token) return;
        
        setLoadingNotifications(true);
        try {
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const markAsReadNav = async (id) => {
        if (!token) return;
        
        try {
            await axios.put(`http://localhost:5000/api/notifications/read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsReadNav = async () => {
        if (!token) return;
        
        try {
            await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    const getIcon = (type) => {
        switch(type) {
            case 'follow': return <FaUsers />;
            case 'message': return <FaEnvelope />;
            case 'comment': return <FaUser />;
            case 'like': return <FaGem />;
            case 'achievement': return <FaCrown />;
            default: return <FaBell />;
        }
    };

    // Handle click outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsProfileOpen(false);
                setIsNotificationsOpen(false);
            }
        };

        if (isProfileOpen || isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isProfileOpen, isNotificationsOpen]);

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

                <Link
                    to="/live"
                    className={`navbar-nav-link ${isActiveLink('/live') ? 'active' : ''}`}
                >
                    <FaVideo className="navbar-nav-icon" />
                    <span>Live</span>
                </Link>

                <Link
                    to="/mini-jeux"
                    className={`navbar-nav-link ${isActiveLink('/mini-jeux') ? 'active' : ''}`}
                >
                    <FaGamepad className="navbar-nav-icon" />
                    <span>Mini-Jeux</span>
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

                        <Link
                            to="/chat"
                            className={`navbar-nav-link ${isActiveLink('/chat') ? 'active' : ''}`}
                        >
                            <FaRobot className="navbar-nav-icon" />
                            <span>Sens AI</span>
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
                        {/* Notifications Dropdown */}
                        <div 
                            ref={notificationsRef}
                            className={`navbar-notifications-dropdown ${isNotificationsOpen ? 'open' : ''}`}
                        >
                            <button 
                                className="navbar-notification-btn" 
                                onClick={toggleNotificationsDropdown}
                                title="Notifications"
                                aria-expanded={isNotificationsOpen}
                                aria-haspopup="true"
                            >
                                <FaBell />
                                {unreadCount > 0 && <span className="navbar-notification-badge">{unreadCount}</span>}
                            </button>
                            
                            <div className="navbar-notifications-menu" role="menu">
                                <div className="navbar-notifications-header">
                                    <h4>Notifications</h4>
                                    <button className="navbar-notifications-mark-all" onClick={markAllAsReadNav}>
                                        Tout marquer comme lu
                                    </button>
                                </div>
                                
                                <div className="navbar-notifications-list">
                                    {loadingNotifications ? (
                                        <p>Chargement...</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`navbar-notification-item ${n.is_read === 0 ? 'unread' : ''}`}>
                                                <div className="navbar-notification-icon">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="navbar-notification-content">
                                                    <p>{n.title}</p>
                                                    <span className="navbar-notification-time">
                                                        {new Date(n.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                {n.is_read === 0 && (
                                                    <button className="navbar-notifications-mark-all" onClick={() => markAsReadNav(n.id)}>
                                                        Marquer lu
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                <div className="navbar-notifications-footer">
                                    <Link 
                                        to="/notifications" 
                                        className="navbar-notifications-see-all"
                                        onClick={() => setIsNotificationsOpen(false)}
                                    >
                                        Voir toutes les notifications
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        <div 
                            ref={dropdownRef}
                            className={`navbar-profile-dropdown ${isProfileOpen ? 'open' : ''}`}
                        >
                            <button
                                className="navbar-profile-trigger"
                                onClick={toggleProfileDropdown}
                                aria-expanded={isProfileOpen}
                                aria-haspopup="true"
                                aria-label="Profile menu"
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

                            <div 
                                className="navbar-dropdown-menu"
                                role="menu"
                                aria-labelledby="profile-menu-button"
                            >

                                <div className="navbar-dropdown-section">
                                    <h4>Mon Compte</h4>
                                    <Link
                                        to="/profil"
                                        className="navbar-dropdown-item"
                                        role="menuitem"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaUser className="navbar-dropdown-icon" />
                                        Mon Profil
                                    </Link>
                                    
                                    {/* Admin Dashboard Link - Only show for admins */}
                                    {user?.accountType === 'admin' && (
                                        <Link
                                            to="/admin"
                                            className="navbar-dropdown-item admin-link"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <FaCrown className="navbar-dropdown-icon" />
                                            🛡️ Administration
                                            {user?.isSuperAdmin && <span className="super-admin-badge">SUPER</span>}
                                        </Link>
                                    )}
                                    <Link
                                        to="/fragments"
                                        className="navbar-dropdown-item"
                                        role="menuitem"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaGem className="navbar-dropdown-icon" />
                                        Mes Fragments
                                    </Link>
                                    <Link
                                        to="/abonnements"
                                        className="navbar-dropdown-item"
                                        role="menuitem"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCrown className="navbar-dropdown-icon" />
                                        Mes Abonnements
                                    </Link>
                                </div>

                                {/* Section spéciale pour les parents */}
                                {user?.accountType === 'parent' && (
                                    <div className="navbar-dropdown-section">
                                        <h4>Gestion Famille</h4>
                                        <Link
                                            to="/parent-dashboard"
                                            className="navbar-dropdown-item special"
                                            role="menuitem"
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
                                        role="menuitem"
                                        onClick={() => setIsProfileOpen(false)}
                                    >
                                        <FaCog className="navbar-dropdown-icon" />
                                        Modifier Profil
                                    </Link>
                                </div>

                                <div className="navbar-dropdown-footer">
                                    <button
                                        className="navbar-logout-button"
                                        role="menuitem"
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

        </nav>
    );
}

export default NavBar;