import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane, FaHeart, FaReply, FaTrash } from 'react-icons/fa';
import './Comments.css';

function Comments({ postId, isVisible, onCommentCountChange }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const { token, user } = useAuth();

    useEffect(() => {
        if (isVisible && postId) {
            fetchComments();
        }
    }, [isVisible, postId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/comments/${postId}`);

            setComments(response.data);

            // Notifier le parent du nombre de commentaires
            if (onCommentCountChange) {
                onCommentCountChange(response.data.length);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des commentaires:', error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) return;
        if (!token) {
            alert('Vous devez être connecté pour commenter');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axiosInstance.post(
                '/comments',
                {
                    postId: postId,
                    content: newComment.trim()
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Ajouter le nouveau commentaire à la liste
            const newCommentData = {
                ...response.data,
                user_name: user.name,
                user_username: user.username
            };

            setComments(prev => [newCommentData, ...prev]);
            setNewComment('');

            // Notifier le parent du nouveau nombre
            if (onCommentCountChange) {
                onCommentCountChange(comments.length + 1);
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du commentaire:', error);
            alert('Erreur lors de l\'ajout du commentaire');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
            return;
        }

        try {
            await axiosInstance.delete(`/comments/${commentId}`);

            // Retirer le commentaire de la liste
            setComments(prev => prev.filter(comment => comment.id !== commentId));

            // Notifier le parent du nouveau nombre
            if (onCommentCountChange) {
                onCommentCountChange(comments.length - 1);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du commentaire:', error);
            alert('Erreur lors de la suppression du commentaire');
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            await axiosInstance.post(`/comments/${commentId}/like`);

            // Mettre à jour le statut de like localement
            setComments(prev => prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        liked: !comment.liked,
                        like_count: comment.liked
                            ? (comment.like_count || 0) - 1
                            : (comment.like_count || 0) + 1
                    }
                    : comment
            ));
        } catch (error) {
            console.error('Erreur lors du like du commentaire:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
        return date.toLocaleDateString('fr-FR');
    };

    if (!isVisible) return null;

    return (
        <div className="comments-section">
            <div className="comments-header">
                <h4>Commentaires ({comments.length})</h4>
            </div>

            {/* Formulaire d'ajout de commentaire */}
            {token ? (
                <form className="comment-form" onSubmit={handleSubmitComment}>
                    <div className="comment-input-wrapper">
                        <div className="comment-avatar">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="comment-input-container">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Écrivez votre commentaire..."
                                rows="2"
                                disabled={submitting}
                            />
                            <button
                                type="submit"
                                className="comment-submit"
                                disabled={submitting || !newComment.trim()}
                            >
                                {submitting ? (
                                    <div className="spinner-small"></div>
                                ) : (
                                    <FaPaperPlane />
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="comment-login-prompt">
                    <p>Connectez-vous pour laisser un commentaire</p>
                </div>
            )}

            {/* Liste des commentaires */}
            <div className="comments-list">
                {loading ? (
                    <div className="comments-loading">
                        <div className="spinner"></div>
                        <p>Chargement des commentaires...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="no-comments">
                        <p>Aucun commentaire pour le moment.</p>
                        <p>Soyez le premier à commenter !</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-avatar">
                                {comment.user_name?.charAt(0).toUpperCase() || '?'}
                            </div>

                            <div className="comment-content">
                                <div className="comment-header">
                                    <span className="comment-author">
                                        {comment.user_name || 'Utilisateur'}
                                    </span>
                                    <span className="comment-username">
                                        @{comment.user_username || 'user'}
                                    </span>
                                    <span className="comment-date">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>

                                <div className="comment-text">
                                    {comment.content}
                                </div>

                                <div className="comment-actions">
                                    <button
                                        className={`comment-action-btn ${comment.liked ? 'liked' : ''}`}
                                        onClick={() => handleLikeComment(comment.id)}
                                        disabled={!token}
                                    >
                                        <FaHeart />
                                        {comment.like_count > 0 && (
                                            <span>{comment.like_count}</span>
                                        )}
                                    </button>

                                    <button
                                        className="comment-action-btn"
                                        onClick={() => setReplyingTo(comment.id)}
                                        disabled={!token}
                                    >
                                        <FaReply />
                                        Répondre
                                    </button>

                                    {/* Bouton de suppression pour l'auteur du commentaire */}
                                    {user && comment.user_id === user.id && (
                                        <button
                                            className="comment-action-btn delete"
                                            onClick={() => handleDeleteComment(comment.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>

                                {/* Formulaire de réponse */}
                                {replyingTo === comment.id && (
                                    <div className="reply-form">
                                        <div className="comment-input-wrapper">
                                            <div className="comment-avatar small">
                                                {user?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="comment-input-container">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder={`Répondre à @${comment.user_username}...`}
                                                    rows="2"
                                                />
                                                <div className="reply-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                        className="cancel-reply"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="submit-reply"
                                                        disabled={!replyText.trim()}
                                                        onClick={() => {
                                                            // TODO: Implémenter la logique de réponse
                                                            console.log('Réponse:', replyText);
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                    >
                                                        <FaPaperPlane />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Comments;