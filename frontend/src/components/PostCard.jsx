import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BiComment, BiShare } from 'react-icons/bi';
import { FaUserPlus, FaUserCheck } from 'react-icons/fa';
import Comments from './Comments';
import ImageModal from '../pages/ImageModal';
import { useNavigate } from 'react-router-dom';
import './PostCard.css';

function PostCard({ post, refresh }) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount || 0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Vérifier le statut de like au chargement
    useEffect(() => {
        if (token && post.id) {
            checkLikeStatus();
            checkFollowStatus();
        }
    }, [post.id, token]);

    const checkLikeStatus = async () => {
        try {
            if (!token) return;

            const response = await axios.get(
                `http://localhost:5000/api/posts/${post.id}/like-status`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setIsLiked(response.data.liked);
        } catch (error) {
            console.error('Erreur lors de la vérification du like:', error);
        }
    };

    const checkFollowStatus = async () => {
        try {
            if (!token || !post.user_id || post.user_id === user?.id) return;

            // ROUTE API CORRIGÉE
            const response = await axios.get(
                `http://localhost:5000/api/auth/follow-status/${post.user_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error('Erreur lors de la vérification du follow:', error);
        }
    };

    const handleLike = async () => {
        try {
            if (!token) {
                alert('Vous devez être connecté pour liker');
                return;
            }

            const response = await axios.post(
                `http://localhost:5000/api/posts/${post.id}/like`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Toggle like state
            if (response.data.liked) {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            } else {
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
        }
    };

    const handleFollow = async () => {
        if (!token) {
            alert('Vous devez être connecté pour suivre des utilisateurs');
            return;
        }

        if (!post.user_id || post.user_id === user?.id) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                // ROUTE API CORRIGÉE
                await axios.post(
                    `http://localhost:5000/api/auth/unfollow/${post.user_id}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setIsFollowing(false);
            } else {
                // ROUTE API CORRIGÉE
                await axios.post(
                    `http://localhost:5000/api/auth/follow/${post.user_id}`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Erreur lors du follow/unfollow:', error);
            alert('Erreur lors de l\'action de suivi');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleUserClick = (userId) => {
        if (userId === user?.id) {
            navigate('/profil');
        } else {
            navigate(`/profile/${userId}`);
        }
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

    const handleCommentClick = () => {
        setShowComments(!showComments);
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Post de ${post.name}`,
                    text: post.content,
                    url: window.location.href
                });
            } else {
                // Fallback - copier le lien
                await navigator.clipboard.writeText(window.location.href);
                alert('Lien copié dans le presse-papiers !');
            }
        } catch (error) {
            console.error('Erreur lors du partage:', error);
            // Fallback en cas d'erreur
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Lien copié dans le presse-papiers !');
            } catch (clipboardError) {
                console.error('Erreur lors de la copie:', clipboardError);
                alert('Impossible de partager ce contenu');
            }
        }
    };

    const isOwnPost = post.user_id === user?.id;

    return (
        <div className="post-card">
            <div className="post-header">
                <div
                    className="avatar"
                    onClick={() => handleUserClick(post.user_id)}
                    style={{ cursor: 'pointer' }}
                >
                    {post.name ? post.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="post-info">
                    <div
                        className="username"
                        onClick={() => handleUserClick(post.user_id)}
                        style={{ cursor: 'pointer' }}
                    >
                        {post.name || 'Utilisateur'}
                    </div>
                    <div className="date">{formatDate(post.created_at)}</div>
                </div>

                {/* Bouton Follow/Unfollow */}
                {!isOwnPost && (
                    <button
                        className={`follow-button ${isFollowing ? 'following' : ''}`}
                        onClick={handleFollow}
                        disabled={followLoading}
                        title={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                    >
                        {followLoading ? (
                            <div className="loading-spinner"></div>
                        ) : isFollowing ? (
                            <>
                                <FaUserCheck />
                                <span>Suivi</span>
                            </>
                        ) : (
                            <>
                                <FaUserPlus />
                                <span>Suivre</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="post-content">
                {post.content}
            </div>

            {post.image && (
                <>
                    <div className="post-image-container">
                        <img
                            src={`http://localhost:5000/uploads/${post.image}`}
                            alt="Post"
                            className="post-image"
                            onClick={() => setShowImageModal(true)}
                            onLoad={(e) => {
                                // Ajuste automatiquement le mode d'affichage selon les proportions
                                const img = e.target;
                                const aspectRatio = img.naturalWidth / img.naturalHeight;
                                if (aspectRatio < 0.8) { // Image verticale
                                    img.style.objectFit = 'contain';
                                    img.style.maxHeight = '400px';
                                } else if (aspectRatio > 2) { // Image très horizontale
                                    img.style.objectFit = 'contain';
                                    img.style.maxHeight = '250px';
                                } else { // Image standard
                                    img.style.objectFit = 'contain';
                                    img.style.maxHeight = '350px';
                                }
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                console.error('Erreur lors du chargement de l\'image');
                            }}
                        />
                    </div>

                    <ImageModal
                        isOpen={showImageModal}
                        imageUrl={`http://localhost:5000/uploads/${post.image}`}
                        onClose={() => setShowImageModal(false)}
                    />
                </>
            )}

            <div className="post-actions">
                <button
                    className={`action-button ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                    title={isLiked ? 'Ne plus aimer' : 'Aimer ce post'}
                >
                    {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
                    <span>J'aime</span>
                    {likeCount > 0 && <span className="count">{likeCount}</span>}
                </button>

                <button
                    className="action-button"
                    onClick={handleCommentClick}
                    title={showComments ? 'Masquer les commentaires' : 'Voir les commentaires'}
                >
                    <BiComment />
                    <span>Commenter</span>
                    {commentCount > 0 && <span className="count">{commentCount}</span>}
                </button>

                <button
                    className="action-button"
                    onClick={handleShare}
                    title="Partager ce post"
                >
                    <BiShare />
                    <span>Partager</span>
                </button>
            </div>

            {showComments && (
                <Comments
                    postId={post.id}
                    isVisible={showComments}
                    onCommentCountChange={setCommentCount}
                />
            )}
        </div>
    );
}

export default PostCard;