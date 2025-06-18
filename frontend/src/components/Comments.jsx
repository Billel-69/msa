import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Comments.css';

function Comments({ postId, isVisible }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { token, user } = useAuth();

    const fetchComments = async () => {
        if (!isVisible || !token) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/posts/${postId}/comments`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setComments(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des commentaires:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !token) return;

        setSubmitting(true);
        try {
            await axios.post(
                `http://localhost:5000/api/posts/${postId}/comments`,
                { content: newComment },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setNewComment('');
            fetchComments(); // Recharger les commentaires
        } catch (error) {
            console.error('Erreur lors de l\'ajout du commentaire:', error);
            alert('Erreur lors de l\'ajout du commentaire');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:5000/api/comments/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            fetchComments(); // Recharger les commentaires
        } catch (error) {
            console.error('Erreur lors de la suppression du commentaire:', error);
            alert('Erreur lors de la suppression du commentaire');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        fetchComments();
    }, [isVisible, postId]);

    if (!isVisible) return null;

    return (
        <div className="comments-section">
            <div className="comments-header">
                <h4>Commentaires ({comments.length})</h4>
            </div>

            <form className="add-comment-form" onSubmit={handleSubmitComment}>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="comment-textarea"
                    rows="2"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="comment-submit-btn"
                >
                    {submitting ? 'Envoi...' : 'Commenter'}
                </button>
            </form>

            <div className="comments-list">
                {loading ? (
                    <div className="comments-loading">Chargement des commentaires...</div>
                ) : comments.length === 0 ? (
                    <div className="no-comments">Aucun commentaire pour le moment</div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-avatar">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="comment-info">
                                    <span className="comment-author">{comment.user_name}</span>
                                    <span className="comment-date">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>
                                {comment.user_id === user?.id && (
                                    <button
                                        className="delete-comment-btn"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        title="Supprimer le commentaire"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <div className="comment-content">
                                {comment.content}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Comments;