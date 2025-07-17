import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaUser,
    FaEdit,
    FaCamera,
    FaTrophy,
    FaStar,
    FaGamepad,
    FaUserPlus,
    FaUsers,
    FaHeart,
    FaComment,
    FaGem,
    FaChevronLeft,
    FaChevronRight,
    FaExclamationCircle,
    FaCrown,
    FaFire,
    FaCalendarAlt,
    FaShare,
    FaEye,
    FaThumbsUp
} from 'react-icons/fa';
import './Profile.css';

function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({
        followers: 0,
        following: 0,
        posts: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
    const [postsPage, setPostsPage] = useState(1);
    const [totalPostsPages, setTotalPostsPages] = useState(1);
    const [achievements, setAchievements] = useState([]);
    const [loadingStates, setLoadingStates] = useState({
        profile: true,
        posts: true,
        stats: true,
        achievements: true
    });
    const POSTS_PER_PAGE = 6;

    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/connexion');
            return;
        }
        
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchProfileData(),
                    fetchUserPosts(),
                    fetchUserStats(),
                    fetchAchievements()
                ]);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [user, token, navigate]);

    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'info' });
        }, 3000);
    }, []);

    const fetchProfileData = async () => {
        setLoadingStates(prev => ({ ...prev, profile: true }));
        try {
            const response = await axios.get(
                'http://localhost:5000/api/auth/me',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setProfileData(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            showNotification('Erreur lors du chargement du profil', 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, profile: false }));
        }
    };

    const fetchUserPosts = async (page = 1) => {
        setLoadingStates(prev => ({ ...prev, posts: true }));
        try {
            const response = await axios.get(
                `http://localhost:5000/api/posts/user/${user.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        page,
                        limit: POSTS_PER_PAGE
                    }
                }
            );
            setPosts(response.data.posts || response.data || []);
            setTotalPostsPages(response.data.totalPages || Math.ceil((response.data.length || 0) / POSTS_PER_PAGE));
            setPostsPage(page);
        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            setPosts([]);
            showNotification('Erreur lors du chargement des publications', 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, posts: false }));
        }
    };

    const fetchUserStats = async () => {
        setLoadingStates(prev => ({ ...prev, stats: true }));
        try {
            const [followersRes, followingRes, postsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/auth/followers', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/auth/following', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:5000/api/posts/user/${user.id}/count`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { count: 0 } }))
            ]);

            setStats({
                followers: followersRes.data.length || 0,
                following: followingRes.data.length || 0,
                posts: postsRes.data.count || posts.length || 0
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            setStats({ followers: 0, following: 0, posts: 0 });
            showNotification('Erreur lors du chargement des statistiques', 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, stats: false }));
        }
    };

    const fetchAchievements = async () => {
        setLoadingStates(prev => ({ ...prev, achievements: true }));
        try {
            const response = await axios.get(
                `http://localhost:5000/api/achievements/user/${user.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setAchievements(response.data || []);
        } catch (error) {
            console.error('Erreur lors de la récupération des accomplissements:', error);
            setAchievements([]);
        } finally {
            setLoadingStates(prev => ({ ...prev, achievements: false }));
        }
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showNotification('La taille du fichier ne doit pas dépasser 5MB', 'error');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            showNotification('Téléchargement en cours...', 'info');
            
            await axios.put(
                'http://localhost:5000/api/auth/me/profile-picture',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            await fetchProfileData();
            showNotification('Photo de profil mise à jour avec succès!', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo:', error);
            showNotification('Erreur lors de la mise à jour de la photo', 'error');
        }
    };

    if (loading || !profileData) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                    </div>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.type === 'error' && <FaExclamationCircle />}
                    {notification.message}
                </div>
            )}

            {/* Hero Section */}
            <div className="profile-hero">
                <div className="hero-background">
                    <div className="hero-gradient"></div>
                </div>
                
                <div className="hero-content">
                    <div className="profile-avatar-container">
                        <div className="avatar-wrapper">
                            {profileData.profilePicture ? (
                                <img
                                    src={`http://localhost:5000/uploads/${encodeURIComponent(profileData.profilePicture)}`}
                                    alt={`Photo de profil de ${profileData.name}`}
                                    className="profile-avatar"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {profileData.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <label className="avatar-upload-btn">
                                <FaCamera />
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleProfilePictureUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        
                        <div className="level-badge">
                            <FaCrown />
                            <span>Niveau {profileData.level || 1}</span>
                        </div>
                    </div>

                    <div className="profile-info">
                        <h1 className="profile-name">{profileData.name}</h1>
                        <p className="profile-username">@{profileData.username}</p>
                        <div className="profile-badges">
                            <span className={`account-badge ${profileData.accountType}`}>
                                {profileData.accountType === 'child' ? 'Élève' :
                                 profileData.accountType === 'parent' ? 'Parent' : 'Professeur'}
                            </span>
                            {profileData.verified && (
                                <span className="verified-badge">
                                    <FaStar /> Vérifié
                                </span>
                            )}
                        </div>

                        <div className="quick-stats">
                            <div className="stat-item">
                                <span className="stat-value">{profileData.totalXP || 0}</span>
                                <span className="stat-label">XP Total</span>
                            </div>
                            <div className="stat-separator"></div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {new Date(profileData.created_at || Date.now()).toLocaleDateString('fr-FR', { 
                                        month: 'short', 
                                        year: 'numeric' 
                                    })}
                                </span>
                                <span className="stat-label">Membre depuis</span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <Link to="/modifier-profil" className="btn-primary">
                                <FaEdit /> Modifier
                            </Link>
                            {user.accountType === 'parent' && (
                                <Link to="/parent-dashboard" className="btn-secondary">
                                    <FaUserPlus /> Gestion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="profile-content">
                {/* Navigation Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaUser />
                        <span>Vue d'ensemble</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        <FaTrophy />
                        <span>Statistiques</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FaComment />
                        <span>Publications</span>
                        <span className="post-count">{stats.posts}</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-content">
                            {/* Progress Section */}
                            <div className="progress-section">
                                <div className="section-header">
                                    <h3>Progression</h3>
                                    <FaFire className="section-icon" />
                                </div>
                                
                                <div className="progress-card">
                                    <div className="level-info">
                                        <div className="current-level">
                                            <span className="level-number">{profileData.level || 1}</span>
                                            <span className="level-label">Niveau actuel</span>
                                        </div>
                                        <div className="xp-info">
                                            <span className="xp-current">{profileData.currentLevelXP || 0}</span>
                                            <span className="xp-separator">/</span>
                                            <span className="xp-needed">{profileData.nextLevelXP || 100}</span>
                                            <span className="xp-label">XP</span>
                                        </div>
                                    </div>
                                    
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${((profileData.currentLevelXP || 0) / (profileData.nextLevelXP || 1)) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    
                                    <p className="progress-text">
                                        {profileData.xpToNextLevel || 0} XP jusqu'au niveau {(profileData.level || 1) + 1}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FaGamepad />
                                    </div>
                                    <div className="stat-content">
                                        <h4>Quêtes Complétées</h4>
                                        <span className="stat-number">{profileData.quests_completed || 0}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FaGem />
                                    </div>
                                    <div className="stat-content">
                                        <h4>Fragments Collectés</h4>
                                        <span className="stat-number">{profileData.fragments || 0}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FaUsers />
                                    </div>
                                    <div className="stat-content">
                                        <h4>Réseau</h4>
                                        <span className="stat-number">{stats.followers + stats.following}</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FaCalendarAlt />
                                    </div>
                                    <div className="stat-content">
                                        <h4>Membre depuis</h4>
                                        <span className="stat-number">
                                            {new Date(profileData.created_at || Date.now()).toLocaleDateString('fr-FR', { 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Achievements */}
                            <div className="achievements-section">
                                <div className="section-header">
                                    <h3>Derniers Accomplissements</h3>
                                    <FaTrophy className="section-icon" />
                                </div>
                                
                                {loadingStates.achievements ? (
                                    <div className="loading-state">
                                        <div className="spinner-small"></div>
                                        <span>Chargement...</span>
                                    </div>
                                ) : achievements.length > 0 ? (
                                    <div className="achievements-grid">
                                        {achievements.slice(0, 3).map((achievement) => (
                                            <div key={achievement.id} className="achievement-card">
                                                <div className="achievement-icon">
                                                    {achievement.icon || '🏆'}
                                                </div>
                                                <div className="achievement-info">
                                                    <h4>{achievement.name}</h4>
                                                    <p>{achievement.description}</p>
                                                    <span className="achievement-date">
                                                        {new Date(achievement.earned_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <FaTrophy />
                                        <h4>Aucun accomplissement</h4>
                                        <p>Continue tes quêtes pour débloquer des récompenses !</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="stats-content">
                            <div className="detailed-stats">
                                <div className="stats-category">
                                    <h3>Statistiques de Jeu</h3>
                                    <div className="stats-list">
                                        <div className="stat-row">
                                            <span className="stat-label">Quêtes complétées</span>
                                            <span className="stat-value">{profileData.quests_completed || 0}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="stat-label">Fragments collectés</span>
                                            <span className="stat-value">{profileData.fragments || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="stats-category">
                                    <h3>Statistiques Sociales</h3>
                                    <div className="stats-list">
                                        <div className="stat-row">
                                            <span className="stat-label">Abonnés</span>
                                            <span className="stat-value">{stats.followers}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="stat-label">Abonnements</span>
                                            <span className="stat-value">{stats.following}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="stat-label">Publications</span>
                                            <span className="stat-value">{stats.posts}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="posts-content">
                            <div className="posts-header">
                                <h3>Mes Publications</h3>
                                <Link to="/reseau" className="btn-primary">
                                    <FaEdit /> Nouvelle publication
                                </Link>
                            </div>

                            {loadingStates.posts ? (
                                <div className="loading-state">
                                    <div className="spinner-small"></div>
                                    <span>Chargement des publications...</span>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="empty-state">
                                    <FaComment />
                                    <h4>Aucune publication</h4>
                                    <p>Partagez vos premiers moments avec la communauté !</p>
                                    <Link to="/reseau" className="btn-primary">
                                        Créer ma première publication
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="posts-grid">
                                        {posts.slice((postsPage - 1) * POSTS_PER_PAGE, postsPage * POSTS_PER_PAGE).map((post) => (
                                            <div key={post.id} className="post-card">
                                                {post.image && (
                                                    <div className="post-image">
                                                        <img
                                                            src={`http://localhost:5000/uploads/${encodeURIComponent(post.image)}`}
                                                            alt="Publication"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                                <div className="post-content">
                                                    <p>{post.content}</p>
                                                    <div className="post-stats">
                                                        <span className="post-stat">
                                                            <FaHeart /> {post.likeCount || 0}
                                                        </span>
                                                        <span className="post-stat">
                                                            <FaComment /> {post.commentCount || 0}
                                                        </span>
                                                        <span className="post-stat">
                                                            <FaEye /> {post.viewCount || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {totalPostsPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                className="pagination-btn"
                                                onClick={() => fetchUserPosts(postsPage - 1)}
                                                disabled={postsPage === 1}
                                            >
                                                <FaChevronLeft />
                                            </button>
                                            <span className="pagination-info">
                                                {postsPage} / {totalPostsPages}
                                            </span>
                                            <button
                                                className="pagination-btn"
                                                onClick={() => fetchUserPosts(postsPage + 1)}
                                                disabled={postsPage === totalPostsPages}
                                            >
                                                <FaChevronRight />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;