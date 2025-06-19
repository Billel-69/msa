import React, { useState, useEffect } from 'react';
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
    FaCalendarAlt,
    FaUserPlus,
    FaUsers,
    FaHeart,
    FaComment,
    FaShare
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

    const { user, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/connexion');
            return;
        }
        fetchProfileData();
        fetchUserPosts();
        fetchUserStats();
    }, [user, token, navigate]);

    const fetchProfileData = async () => {
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
        }
    };

    const fetchUserPosts = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/posts/user/${user.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setPosts(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            setPosts([]); // Fallback si pas de posts
        }
    };

    const fetchUserStats = async () => {
        try {
            const [followersRes, followingRes] = await Promise.all([
                axios.get('http://localhost:5000/api/auth/followers', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/auth/following', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats({
                followers: followersRes.data.length,
                following: followingRes.data.length,
                posts: posts.length
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            setStats({ followers: 0, following: 0, posts: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await axios.put(
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
            fetchProfileData();
            alert('Photo de profil mise à jour !');
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo:', error);
            alert('Erreur lors de la mise à jour de la photo');
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
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaStar />
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
                <div className="achievements-list">
                    <div className="achievement-item">
                        <div className="achievement-icon">🏆</div>
                        <div className="achievement-details">
                            <h4>Maître des Mathématiques</h4>
                            <p>Complété 10 quêtes de mathématiques</p>
                        </div>
                    </div>
                    <div className="achievement-item">
                        <div className="achievement-icon">📚</div>
                        <div className="achievement-details">
                            <h4>Lecteur Assidu</h4>
                            <p>Lu 5 histoires complètes</p>
                        </div>
                    </div>
                </div>
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

    const renderPostsTab = () => (
        <div className="posts-tab">
            <div className="posts-header">
                <h3>Mes publications ({posts.length})</h3>
                <Link to="/create-post" className="create-post-btn">
                    <FaEdit /> Nouvelle publication
                </Link>
            </div>

            {posts.length === 0 ? (
                <div className="no-posts">
                    <FaComment className="no-posts-icon" />
                    <h4>Aucune publication</h4>
                    <p>Partagez vos premiers moments avec la communauté !</p>
                    <Link to="/create-post" className="action-btn primary">
                        Créer ma première publication
                    </Link>
                </div>
            ) : (
                <div className="posts-grid">
                    {posts.map((post) => (
                        <div key={post.id} className="post-preview">
                            {post.image && (
                                <div className="post-image">
                                    <img
                                        src={`http://localhost:5000/uploads/${post.image}`}
                                        alt="Post"
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
            )}
        </div>
    );

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
            <div className="profile-header">
                <div className="profile-cover">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {profileData.profilePicture ? (
                                <img
                                    src={`http://localhost:5000/uploads/${profileData.profilePicture}`}
                                    alt="Profil"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {profileData.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            <label className="avatar-upload">
                                <FaCamera />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureUpload}
                                    style={{ display: 'none' }}
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