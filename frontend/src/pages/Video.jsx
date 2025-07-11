import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaPlay,
    FaHeart,
    FaRegHeart,
    FaEye,
    FaSearch,
    FaFilter,
    FaGraduationCap,
    FaBook,
    FaClock,
    FaUsers,
    FaChevronLeft,
    FaChevronRight,
    FaPlus,
    FaStar,
    FaCheckCircle
} from 'react-icons/fa';
import './Videos.css';

function Videos() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [featuredVideo, setFeaturedVideo] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Sujets et niveaux disponibles
    const subjects = [
        'Mathématiques', 'Français', 'Sciences', 'Histoire', 'Anglais',
        'Espagnol', 'Philosophie', 'Économie', 'Géographie', 'Musique', 'Art'
    ];

    const levels = [
        '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'
    ];

    useEffect(() => {
        fetchVideoCategories();
    }, []);

    const fetchVideoCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/videos/by-category`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setCategories(response.data);

            // Définir une vidéo mise en avant
            const allVideos = Object.values(response.data).flat();
            if (allVideos.length > 0) {
                setFeaturedVideo(allVideos[0]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des vidéos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        try {
            const response = await axios.get(`${API_URL}/api/videos/search/${searchTerm}`, {
                params: {
                    subject: selectedSubject,
                    level: selectedLevel
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        }
    };

    const handleLike = async (videoId) => {
        if (!token) {
            navigate('/connexion');
            return;
        }

        try {
            await axios.post(`${API_URL}/api/videos/${videoId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Rafraîchir les données
            fetchVideoCategories();
        } catch (error) {
            console.error('Erreur lors du like:', error);
        }
    };

    const handlePlayVideo = (videoId) => {
        navigate(`/videos/${videoId}`);
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const scrollCategory = (categoryKey, direction) => {
        const container = document.getElementById(`category-${categoryKey}`);
        if (container) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="videos-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement des vidéos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="videos-container">
            {/* Header avec recherche */}
            <div className="videos-header">
                <div className="header-content">
                    <h1>📚 Bibliothèque Vidéo MSA</h1>
                    <p>Découvrez des milliers de cours en vidéo pour tous les niveaux</p>
                </div>

                {/* Barre de recherche */}
                <div className="search-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher une vidéo, un sujet, un professeur..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-btn">
                                Rechercher
                            </button>
                        </div>
                    </form>

                    {/* Filtres */}
                    <div className="filters-section">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="filters-toggle"
                        >
                            <FaFilter /> Filtres
                        </button>

                        {showFilters && (
                            <div className="filters-dropdown">
                                <div className="filter-group">
                                    <label>Matière</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                    >
                                        <option value="">Toutes les matières</option>
                                        {subjects.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Niveau</label>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                    >
                                        <option value="">Tous les niveaux</option>
                                        {levels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vidéo mise en avant */}
            {featuredVideo && (
                <div className="featured-video">
                    <div className="featured-background">
                        <img
                            src={featuredVideo.thumbnail
                                ? `${API_URL}/uploads/thumbnails/${featuredVideo.thumbnail}`
                                : '/default-thumbnail.jpg'
                            }
                            alt={featuredVideo.title}
                        />
                        <div className="featured-overlay"></div>
                    </div>

                    <div className="featured-content">
                        <div className="featured-badge">⭐ À la une</div>
                        <h2>{featuredVideo.title}</h2>
                        <p className="featured-description">{featuredVideo.description}</p>

                        <div className="featured-meta">
                            <span className="subject-tag">{featuredVideo.subject}</span>
                            <span className="level-tag">{featuredVideo.level}</span>
                            <span className="teacher-info">
                                <FaGraduationCap /> {featuredVideo.teacher_name}
                            </span>
                            <span className="duration">
                                <FaClock /> {formatDuration(featuredVideo.duration)}
                            </span>
                            <span className="views">
                                <FaEye /> {featuredVideo.views_count} vues
                            </span>
                        </div>

                        <div className="featured-actions">
                            <button
                                onClick={() => handlePlayVideo(featuredVideo.id)}
                                className="play-btn-large"
                            >
                                <FaPlay /> Regarder maintenant
                            </button>

                            <button
                                onClick={() => handleLike(featuredVideo.id)}
                                className="like-btn-large"
                            >
                                {featuredVideo.user_liked ? <FaHeart /> : <FaRegHeart />}
                                J'aime
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
                <div className="search-results">
                    <h2>Résultats de recherche pour "{searchTerm}"</h2>
                    <div className="videos-grid">
                        {searchResults.map(video => (
                            <VideoCard key={video.id} video={video} onPlay={handlePlayVideo} onLike={handleLike} />
                        ))}
                    </div>
                </div>
            )}

            {/* Catégories de vidéos */}
            <div className="categories-section">
                {Object.entries(categories).map(([categoryName, videos]) => (
                    <div key={categoryName} className="category-section">
                        <div className="category-header">
                            <h3>{categoryName}</h3>
                            <div className="category-nav">
                                <button
                                    onClick={() => scrollCategory(categoryName, 'left')}
                                    className="nav-btn"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    onClick={() => scrollCategory(categoryName, 'right')}
                                    className="nav-btn"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>

                        <div
                            id={`category-${categoryName}`}
                            className="videos-carousel"
                        >
                            {videos.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onPlay={handlePlayVideo}
                                    onLike={handleLike}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bouton pour les professeurs */}
            {user?.accountType === 'teacher' && (
                <div className="teacher-actions">
                    <button
                        onClick={() => navigate('/videos/upload')}
                        className="upload-btn"
                    >
                        <FaPlus /> Ajouter une vidéo
                    </button>
                </div>
            )}
        </div>
    );
}

// Composant carte vidéo
function VideoCard({ video, onPlay, onLike }) {
    const [isHovered, setIsHovered] = useState(false);

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="video-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="video-thumbnail">
                <img
                    src={video.thumbnail
                        ? `${process.env.REACT_APP_API_URL}/uploads/thumbnails/${video.thumbnail}`
                        : '/default-thumbnail.jpg'
                    }
                    alt={video.title}
                />

                {video.duration && (
                    <div className="duration-badge">
                        {formatDuration(video.duration)}
                    </div>
                )}

                {video.user_completed && (
                    <div className="completed-badge">
                        <FaCheckCircle />
                    </div>
                )}

                {video.user_progress > 0 && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${(video.user_progress / video.duration) * 100}%`
                            }}
                        ></div>
                    </div>
                )}

                <div className="video-overlay">
                    <button
                        onClick={() => onPlay(video.id)}
                        className="play-btn"
                    >
                        <FaPlay />
                    </button>
                </div>
            </div>

            <div className="video-info">
                <h4>{video.title}</h4>
                <p className="teacher-name">
                    <FaGraduationCap /> {video.teacher_name}
                </p>

                <div className="video-meta">
                    <span className="subject">{video.subject}</span>
                    <span className="level">{video.level}</span>
                </div>

                <div className="video-stats">
                    <span className="views">
                        <FaEye /> {video.views_count}
                    </span>
                    <span className="likes">
                        <FaHeart /> {video.likes_count}
                    </span>
                </div>

                {isHovered && (
                    <div className="video-actions">
                        <button
                            onClick={() => onLike(video.id)}
                            className={`like-btn ${video.user_liked ? 'liked' : ''}`}
                        >
                            {video.user_liked ? <FaHeart /> : <FaRegHeart />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Videos;