import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IoAdd } from 'react-icons/io5';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import './Feed.css';

function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { token, user } = useAuth();

    const fetchFeed = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!token) {
                setError('Token d\'authentification manquant');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/feed', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Données reçues:', response.data);
            setPosts(response.data || []);

        } catch (error) {
            console.error('Erreur lors du chargement du feed:', error);

            if (error.response?.status === 401) {
                setError('Session expirée, veuillez vous reconnecter');
                // Optionnel: rediriger vers la page de connexion
                // localStorage.removeItem('token');
                // window.location.href = '/login';
            } else {
                setError('Erreur lors du chargement des posts');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchFeed();
        }
    }, [token]);

    const handleRefresh = () => {
        console.log('Rafraîchissement du feed...');
        fetchFeed();
    };

    if (loading) {
        return (
            <div className="feed">
                <div className="loading">Chargement des posts...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="feed">
                <div className="error">
                    {error}
                    <button onClick={handleRefresh} className="retry-button">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="feed">
            {/* Floating Add Button */}
            <button
                className="floating-add-button"
                onClick={() => setIsModalOpen(true)}
                title="Créer une publication"
            >
                <IoAdd />
            </button>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPostCreated={handleRefresh}
            />

            <div className="posts-container">
                {posts.length === 0 ? (
                    <div className="no-posts">
                        <p>Aucun post à afficher pour le moment.</p>
                        <p>Créez votre premier post ou suivez d'autres utilisateurs !</p>
                        <button
                            className="create-first-post-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <IoAdd /> Créer votre premier post
                        </button>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            refresh={handleRefresh}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default Feed;