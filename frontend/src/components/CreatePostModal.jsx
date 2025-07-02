import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IoClose, IoImageOutline, IoSendSharp } from 'react-icons/io5';
import './CreatePostModal.css';

function CreatePostModal({ isOpen, onClose, onPostCreated }) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handlePost = async () => {
        if (!content.trim()) {
            alert('Veuillez saisir du contenu pour votre post');
            return;
        }

        setLoading(true);
        try {
            if (!token) {
                alert('Vous devez être connecté pour publier');
                return;
            }

            const formData = new FormData();
            formData.append('content', content); // ✅ CHANGÉ: 'text' -> 'content'
            if (image) {
                formData.append('image', image);
            }

            // Debug logs (à retirer après correction)
            console.log('Envoi du post:', { content, hasImage: !!image });

            const response = await axios.post('http://localhost:5000/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Post créé avec succès:', response.data);

            // Reset form
            setContent('');
            setImage(null);
            const fileInput = document.getElementById('modal-image-input');
            if (fileInput) fileInput.value = '';

            // Close modal and refresh
            onClose();
            if (onPostCreated) onPostCreated();

        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
            console.error('Détails de l\'erreur:', error.response?.data);
            alert('Erreur lors de la publication du post');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        const fileInput = document.getElementById('modal-image-input');
        if (fileInput) fileInput.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Créer une publication</h3>
                    <button className="close-button" onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <div className="modal-content">
                    <textarea
                        placeholder="Que voulez-vous partager ?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="4"
                        className="modal-textarea"
                    />

                    {image && (
                        <div className="image-preview">
                            <img
                                src={URL.createObjectURL(image)}
                                alt="Aperçu"
                                className="preview-image"
                            />
                            <button className="remove-image" onClick={removeImage}>
                                <IoClose />
                            </button>
                        </div>
                    )}

                    <div className="modal-actions">
                        <div className="action-buttons">
                            <input
                                type="file"
                                id="modal-image-input"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="modal-image-input" className="image-button">
                                <IoImageOutline /> Photo
                            </label>
                        </div>

                        <button
                            className="publish-button"
                            onClick={handlePost}
                            disabled={loading || !content.trim()}
                        >
                            <IoSendSharp />
                            {loading ? 'Publication...' : 'Publier'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePostModal;