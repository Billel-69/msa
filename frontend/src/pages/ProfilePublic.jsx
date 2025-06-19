import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FaUserPlus,
    FaUserCheck,
    FaEnvelope,
    FaArrowLeft,
    FaTrophy,
    FaStar,
    FaGamepad,
    FaCalendarAlt,
    FaHeart,
    FaComment,
    FaShare,
    FaUser
} from 'react-icons/fa';
import './ProfilePublic.css';

function ProfilePublic() {
    const { id } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({
        followers: 0,
        following: 0,
        posts: 0
    });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

    const { token, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || !user) {
            navigate('/connexion');
            return;
        }

        if (id === user.id.toString()) {
            navigate('/profil');
            return;
        }

        fetchProfileData();
        fetchUserPosts();
        fetchFollowStatus();
        fetchUserStats();
    }, [id, token, user, navigate]);

    const fetchProfileData = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/users/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setProfileData(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            if (error.response?.status === 404) {
                alert('Utilisateur introuvable');
                navigate('/');
            }
        }
    };

    const fetchUserPosts = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/posts/user/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setPosts(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des posts:', error);
            setPosts([]);
        }
    };

    const fetchFollowStatus = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/auth/follow-status/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error('Erreur lors de la vérification du follow:', error);
        }
    };

    const fetchUserStats = async () => {
        try {
            // Pour l'instant, utilisation de données simulées
            // TODO: Créer des endpoints pour récupérer les stats d'un utilisateur public
            setStats({
                followers: Math.floor(Math.random() * 100),
                following: Math.floor(Math.random() * 50),
                posts: posts.length
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            setStats({ followers: 0, following: 0, posts: posts.length });
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!token) {
            alert('Vous devez être connecté pour suivre des utilisateurs');
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await axios.post(
                    `http://localhost:5000/api/auth/unfollow/${id}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setIsFollowing(false);
                setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
            } else {
                await axios.post(
                    `http://localhost:5000/api/auth/follow/${id}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setIsFollowing(true);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
        } catch (error) {
            console.error('Erreur lors du follow/unfollow:', error);
            alert('Erreur lors de l\'action de suivi');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSendMessage = () => {
        // TODO: Implémenter le système de messages privés
        alert('Fonctionnalité de messages privés à venir !');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || !profileData) {
        return (
            <div className="profile-public-page loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    const renderPostsTab = () => (
        <div className="posts-tab">
            <div className="posts-header">
                <h3>Publications ({posts.length})</h3>
            </div>

            {posts.length === 0 ? (
                <div className="no-posts">
                    <FaComment className="no-posts-icon" />
                    <h4>Aucune publication</h4>
                    <p>Cet utilisateur n'a pas encore partagé de contenu.</p>
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
                                <div className="post-date">
                                    {formatDate(post.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderInfoTab = () => (
        <div className="info-tab">
            <div className="profile-stats-detailed">
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
                        <FaCalendarAlt />
                    </div>
                    <div className="stat-info">
                        <h3>Membre depuis</h3>
                        <p className="stat-value">
                            {new Date(profileData.created_at || Date.now()).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="achievements-section">
                <h3>Accomplissements récents</h3>
                <div className="achievements-list">
                    <div className="achievement-item">
                        <div className="achievement-icon">🏆</div>
                        <div className="achievement-details">
                            <h4>Explorateur</h4>
                            <p>A exploré 5 mondes différents</p>
                        </div>
                    </div>
                    <div className="achievement-item">
                        <div className="achievement-icon">📚</div>
                        <div className="achievement-details">
                            <h4>Érudit</h4>
                            <p>A complété 10 quêtes éducatives</p>
                        </div>
                    </div>
                    <div className="achievement-item">
                        <div className="achievement-icon">⭐</div>
                        <div className="achievement-details">
                            <h4>Collectionneur</h4>
                            <p>A collecté 50 fragments</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-public-page">
            <div className="profile-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Retour
                </button>

                <div className="profile-cover">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {profileData.profile_picture ? (
                                <img
                                    src={`http://localhost:5000/uploads/${profileData.profile_picture}`}
                                    alt="Profil"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {profileData.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                        </div>

                        <div className="profile-info">
                            <h1>{profileData.name}</h1>
                            <p className="username">@{profileData.username}</p>
                            <p className="account-type">
                                {profileData.account_type === 'child' ? '🧒 Enfant' :
                                    profileData.account_type === 'parent' ? '👨‍👩‍👧‍👦 Parent' : '👩‍🏫 Professeur'}
                            </p>

                            <div className="profile-quick-stats">
                                <span><strong>{stats.followers}</strong> abonnés</span>
                                <span>•</span>
                                <span><strong>{stats.following}</strong> abonnements</span>
                                <span>•</span>
                                <span><strong>{stats.posts}</strong> publications</span>
                            </div>

                            <div className="profile-actions">
                                <button
                                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                >
                                    {followLoading ? (
                                        <div className="spinner-small"></div>
                                    ) : isFollowing ? (
                                        <>
                                            <FaUserCheck />
                                            Suivi
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus />
                                            Suivre
                                        </>
                                    )}
                                </button>

                                <button
                                    className="message-btn"
                                    onClick={handleSendMessage}
                                >
                                    <FaEnvelope />
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FaComment /> Publications
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        <FaUser /> Informations
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'posts' && renderPostsTab()}
                    {activeTab === 'info' && renderInfoTab()}
                </div>
            </div>
        </div>
    );
}

export default ProfilePublic;