import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BiComment, BiShare } from 'react-icons/bi';
import Comments from './Comments';
import './PostCard.css';

function PostCard({ post, refresh }) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount || 0);
    const { token } = useAuth();

    // Vérifier le statut de like au chargement
    useEffect(() => {
        checkLikeStatus();
    }, [post.id]);

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

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="avatar">
                    {post.name ? post.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="post-info">
                    <div className="username">{post.name || 'Utilisateur'}</div>
                    <div className="date">{formatDate(post.created_at)}</div>
                </div>
            </div>

            <div className="post-content">
                {post.content}
            </div>

            {post.image && (
                <div className="post-image-container">
                    <img
                        src={`http://localhost:5000/uploads/${post.image}`}
                        alt="Post"
                        className="post-image"
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
                    />
                </div>
            )}

            <div className="post-actions">
                <button
                    className={`action-button ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
                    <span>J'aime</span>
                    {likeCount > 0 && <span className="count">{likeCount}</span>}
                </button>

                <button
                    className="action-button"
                    onClick={handleCommentClick}
                >
                    <BiComment />
                    <span>Commenter</span>
                    {commentCount > 0 && <span className="count">{commentCount}</span>}
                </button>

                <button className="action-button">
                    <BiShare />
                    <span>Partager</span>
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <div className="add-comment">
                        <input
                            type="text"
                            placeholder="Ajouter un commentaire..."
                            className="comment-input"
                        />
                        <button className="comment-submit">Envoyer</button>
                    </div>
                    <div className="comments-list">
                        {/* Les commentaires seront affichés ici */}
                        <p className="no-comments">Aucun commentaire pour le moment</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PostCard;