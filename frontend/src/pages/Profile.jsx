import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    FaExclamationCircle
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
    const [activeTab, setActiveTab] = useState('overview'); // overview, posts, stats
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
        
        // Fetch all data in parallel
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

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La taille du fichier ne doit pas dépasser 5MB', 'error');
            return;
        }

        // Validate file type
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

            // Mettre à jour les données du profil
            await fetchProfileData();
            showNotification('Photo de profil mise à jour avec succès!', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo:', error);
            showNotification('Erreur lors de la mise à jour de la photo', 'error');
        }
    };

    if (loading || !profileData) {
        return (
            <div className="profile-page loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    const renderOverviewTab = () => (
        <div className="overview-tab">
            <div className="profile-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaTrophy />
                    </div>
                    <div className="stat-info">
                        <h3>Niveau</h3>
                        <p className="stat-value">{profileData.level || 1}</p>
                        {profileData.xpToNextLevel !== undefined && (
                            <div className="level-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${((profileData.currentLevelXP || 0) / (profileData.nextLevelXP || 1)) * 100}%` 
                                        }}
                                    ></div>
                                </div>
                                <small className="progress-text">
                                    {profileData.xpToNextLevel || 0} XP jusqu'au prochain niveau
                                </small>
                            </div>
                        )}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaStar />
                    </div>
                    <div className="stat-info">
                        <h3>XP Total</h3>
                        <p className="stat-value">{profileData.totalXP || 0}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaGem />
                    </div>
                    <div className="stat-info">
                        <h3>Fragments</h3>
                        <p className="stat-value">{profileData.fragments || 0}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaGamepad />
                    </div>
                    <div className="stat-info">
                        <h3>Quêtes</h3>
                        <p className="stat-value">{profileData.quests_completed || 0}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h3>Abonnés</h3>
                        <p className="stat-value">{stats.followers}</p>
                    </div>
                </div>
            </div>

            <div className="recent-achievements">
                <h3>Derniers accomplissements</h3>
                {loadingStates.achievements ? (
                    <div className="loading-section">
                        <div className="spinner-small"></div>
                        <p>Chargement des accomplissements...</p>
                    </div>
                ) : achievements.length > 0 ? (
                    <div className="achievements-list">
                        {achievements.slice(0, 3).map((achievement) => (
                            <div key={achievement.id} className="achievement-item">
                                <div className="achievement-icon">{achievement.icon || '🏆'}</div>
                                <div className="achievement-details">
                                    <h4>{achievement.name}</h4>
                                    <p>{achievement.description}</p>
                                    <small>{new Date(achievement.earned_at).toLocaleDateString('fr-FR')}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-achievements">
                        <p>Aucun accomplissement pour le moment. Continue tes quêtes!</p>
                    </div>
                )}
            </div>

            {/* Boutons d'action selon le type de compte */}
            <div className="profile-actions">
                <Link to="/modifier-profil" className="action-btn primary">
                    <FaEdit /> Modifier le profil
                </Link>

                {user.accountType === 'parent' && (
                    <Link to="/parent-dashboard" className="action-btn secondary">
                        <FaUserPlus /> Gestion Enfants
                    </Link>
                )}

                <Link to="/reseau" className="action-btn secondary">
                    <FaUsers /> Réseau Social
                </Link>
            </div>
        </div>
    );

    const renderPostsTab = () => {
        const startIndex = (postsPage - 1) * POSTS_PER_PAGE;
        const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

        return (
            <div className="posts-tab">
                <div className="posts-header">
                    <h3>Mes publications ({stats.posts})</h3>
                    <Link to="/create-post" className="create-post-btn">
                        <FaEdit /> Nouvelle publication
                    </Link>
                </div>

                {loadingStates.posts ? (
                    <div className="loading-section">
                        <div className="spinner"></div>
                        <p>Chargement des publications...</p>
                    </div>
                ) : posts.length === 0 ? (
                <div className="no-posts">
                    <FaComment className="no-posts-icon" />
                    <h4>Aucune publication</h4>
                    <p>Partagez vos premiers moments avec la communauté !</p>
                    <Link to="/create-post" className="action-btn primary">
                        Créer ma première publication
                    </Link>
                </div>
                ) : (
                    <>
                        <div className="posts-grid">
                            {paginatedPosts.map((post) => (
                                <div key={post.id} className="post-preview">
                                    {post.image && (
                                        <div className="post-image">
                                            <img
                                                src={`http://localhost:5000/uploads/${encodeURIComponent(post.image)}`}
                                                alt={`Publication de ${profileData?.name || 'utilisateur'}`}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="post-content">
                                        <p>{post.content}</p>
                                        <div className="post-stats">
                                            <span><FaHeart /> {post.likeCount || 0}</span>
                                            <span><FaComment /> {post.commentCount || 0}</span>
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
                                    Page {postsPage} sur {totalPostsPages}
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
        );
    };

    const renderStatsTab = () => (
        <div className="stats-tab">
            <div className="detailed-stats">
                <div className="stats-section">
                    <h3>Statistiques de jeu</h3>
                    <div className="stats-grid">
                        <div className="stat-detail">
                            <span className="stat-label">Temps de jeu total</span>
                            <span className="stat-value">24h 30m</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Quêtes complétées</span>
                            <span className="stat-value">{profileData.quests_completed || 0}</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Fragments collectés</span>
                            <span className="stat-value">{profileData.fragments || 0}</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Rang actuel</span>
                            <span className="stat-value">{profileData.rank || 'Débutant'}</span>
                        </div>
                    </div>
                </div>

                <div className="stats-section">
                    <h3>Statistiques sociales</h3>
                    <div className="stats-grid">
                        <div className="stat-detail">
                            <span className="stat-label">Abonnés</span>
                            <span className="stat-value">{stats.followers}</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Abonnements</span>
                            <span className="stat-value">{stats.following}</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Publications</span>
                            <span className="stat-value">{stats.posts}</span>
                        </div>
                        <div className="stat-detail">
                            <span className="stat-label">Membre depuis</span>
                            <span className="stat-value">
                                {new Date(profileData.created_at || Date.now()).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-page">
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.type === 'error' && <FaExclamationCircle />}
                    {notification.message}
                </div>
            )}
            <div className="profile-header">
                <div className="profile-cover">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {profileData.profilePicture ? (
                                <img
                                    src={`http://localhost:5000/uploads/${encodeURIComponent(profileData.profilePicture)}`}
                                    alt={`Photo de profil de ${profileData.name}`}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {profileData.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <label className="avatar-upload" htmlFor="avatar-upload-input" aria-label="Télécharger une photo de profil">
                                <FaCamera />
                                <input
                                    id="avatar-upload-input"
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleProfilePictureUpload}
                                    style={{ display: 'none' }}
                                    aria-label="Sélectionner une photo de profil"
                                />
                            </label>
                        </div>

                        <div className="profile-info">
                            <h1>{profileData.name}</h1>
                            <p className="username">@{profileData.username}</p>
                            <p className="account-type">
                                Compte {profileData.accountType === 'child' ? 'Enfant' :
                                profileData.accountType === 'parent' ? 'Parent' : 'Professeur'}
                            </p>
                            <div className="profile-quick-stats">
                                <span>Niveau {profileData.level || 1}</span>
                                <span>•</span>
                                <span>{profileData.totalXP || 0} XP</span>
                                <span>•</span>
                                <span>{profileData.fragments || 0} fragments</span>
                                <span>•</span>
                                <span>{stats.followers} abonnés</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaUser /> Vue d'ensemble
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FaComment /> Publications
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        <FaTrophy /> Statistiques
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'posts' && renderPostsTab()}
                    {activeTab === 'stats' && renderStatsTab()}
                </div>
            </div>
        </div>
    );
}

export default Profile;