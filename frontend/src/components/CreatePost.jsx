import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './CreatePost.css';

function CreatePost({ refresh }) {
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
            formData.append('text', content);
            if (image) {
                formData.append('image', image);
            }

            await axios.post('http://localhost:5000/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setContent('');
            setImage(null);
            // Reset file input
            const fileInput = document.getElementById('image-input');
            if (fileInput) fileInput.value = '';

            // Refresh the feed
            if (refresh) refresh();

        } catch (error) {
            console.error('Erreur lors de la création du post:', error);
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

    return (
        <div className="create-post">
            <h3>Créer un Post</h3>
            <textarea
                placeholder="Que voulez-vous partager ?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
            />
            <div className="post-options">
                <input
                    type="file"
                    id="image-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />
                <label htmlFor="image-input" className="image-button">
                    📷 Ajouter une image
                </label>
                {image && <span className="image-selected">Image sélectionnée: {image.name}</span>}
            </div>
            <button
                onClick={handlePost}
                disabled={loading}
                className="publish-button"
            >
                {loading ? 'Publication...' : 'Publier'}
            </button>
        </div>
    );
}

export default CreatePost;