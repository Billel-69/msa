import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    FaArrowLeft,
    FaPlus,
    FaEye,
    FaHeart,
    FaEdit,
    FaTrash,
    FaPlay,
    FaClock,
    FaUsers,
    FaChartLine,
    FaToggleOn,
    FaToggleOff,
    FaSearch,
    FaFilter,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaCheckCircle
} from 'react-icons/fa';
import './MyVideos.css';

function MyVideos() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [stats, setStats] = useState({
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        publishedVideos: 0
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Vérifier si l'utilisateur est un professeur
    useEffect(() => {
        if (!user || user.accountType !== 'teacher') {
            navigate('/videos');
        } else {
            fetchMyVideos();
        }
    }, [user, navigate]);

    const fetchMyVideos = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/videos/teacher/my-videos`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setVideos(response.data);
            calculateStats(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des vidéos:', error);
            setError('Impossible de charger vos vidéos');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (videosData) => {
        const totalVideos = videosData.length;
        const totalViews = videosData.reduce((sum, video) => sum + (video.total_views || 0), 0);
        const totalLikes = videosData.reduce((sum, video) => sum + (video.total_likes || 0), 0);
        const publishedVideos = videosData.filter(video => video.status === 'published').length;

        setStats({
            totalVideos,
            totalViews,
            totalLikes,
            publishedVideos
        });
    };

    const handleStatusToggle = async (videoId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'published' ? 'draft' : 'published';
            await axios.put(`${API_URL}/api/videos/${videoId}`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setVideos(videos.map(video =>
                video.id === videoId ? { ...video, status: newStatus } : video
            ));

            // Recalculer les stats
            const updatedVideos = videos.map(video =>
                video.id === videoId ? { ...video, status: newStatus } : video
            );
            calculateStats(updatedVideos);
        } catch (error) {
            console.error('Erreur lors du changement de statut:', error);
            alert('Impossible de modifier le statut');
        }
    };

    const handleDeleteClick = (video) => {
        setVideoToDelete(video);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!videoToDelete) return;

        try {
            await axios.delete(`${API_URL}/api/videos/${videoToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setVideos(videos.filter(video => video.id !== videoToDelete.id));
            setShowDeleteModal(false);
            setVideoToDelete(null);

            // Recalculer les stats
            const updatedVideos = videos.filter(video => video.id !== videoToDelete.id);
            calculateStats(updatedVideos);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Impossible de supprimer la vidéo');
        }
    };

    const handleViewStats = (videoId) => {
        navigate(`/videos/${videoId}/stats`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Filtrer et trier les vidéos
    const filteredVideos = videos.filter(video => {
        const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
        const matchesSubject = subjectFilter === 'all' || video.subject === subjectFilter;

        return matchesSearch && matchesStatus && matchesSubject;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'recent':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'views':
                return (b.total_views || 0) - (a.total_views || 0);
            case 'likes':
                return (b.total_likes || 0) - (a.total_likes || 0);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    const subjects = [...new Set(videos.map(video => video.subject).filter(Boolean))];

    if (loading) {
        return (
            <div className="my-videos-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement de vos vidéos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-videos-container">
            {/* Header */}
            <div className="my-videos-header">
                <div className="header-top">
                    <button onClick={() => navigate('/videos')} className="back-button">
                        <FaArrowLeft /> Retour
                    </button>
                    <div className="header-title">
                        <h1>📹 Mes Vidéos</h1>
                        <p>Gérez vos contenus éducatifs</p>
                    </div>
                    <button
                        onClick={() => navigate('/videos/upload')}
                        className="add-video-btn"
                    >
                        <FaPlus /> Nouvelle vidéo
                    </button>
                </div>

                {/* Statistiques */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaPlay />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalVideos}</h3>
                            <p>Vidéos totales</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon published">
                            <FaCheckCircle />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.publishedVideos}</h3>
                            <p>Publiées</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon views">
                            <FaEye />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalViews}</h3>
                            <p>Vues totales</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon likes">
                            <FaHeart />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalLikes}</h3>
                            <p>Likes totaux</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres et recherche */}
            <div className="filters-section">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher dans vos vidéos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filters-row">
                    <div className="filter-group">
                        <label>Statut</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Tous les statuts</option>
                            <option value="published">Publiées</option>
                            <option value="draft">Brouillons</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Matière</label>
                        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                            <option value="all">Toutes les matières</option>
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Trier par</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="recent">Plus récentes</option>
                            <option value="oldest">Plus anciennes</option>
                            <option value="views">Plus vues</option>
                            <option value="likes">Plus aimées</option>
                            <option value="title">Titre A-Z</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des vidéos */}
            <div className="videos-section">
                {error && (
                    <div className="error-message">
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                )}

                {filteredVideos.length === 0 ? (
                    <div className="no-videos">
                        <FaPlay size={60} />
                        <h3>Aucune vidéo trouvée</h3>
                        <p>
                            {searchTerm || statusFilter !== 'all' || subjectFilter !== 'all'
                                ? 'Aucune vidéo ne correspond à vos critères de recherche'
                                : 'Vous n\'avez pas encore créé de vidéo'
                            }
                        </p>
                        <button
                            onClick={() => navigate('/videos/upload')}
                            className="create-first-video-btn"
                        >
                            <FaPlus /> Créer ma première vidéo
                        </button>
                    </div>
                ) : (
                    <div className="videos-grid">
                        {filteredVideos.map(video => (
                            <div key={video.id} className={`video-card ${video.status}`}>
                                <div className="video-thumbnail">
                                    <img
                                        src={video.thumbnail
                                            ? `${API_URL}/uploads/thumbnails/${video.thumbnail}`
                                            : '/default-thumbnail.jpg'
                                        }
                                        alt={video.title}
                                    />
                                    <div className="video-duration">
                                        <FaClock />
                                        {formatDuration(video.duration || 0)}
                                    </div>
                                    <div className={`status-badge ${video.status}`}>
                                        {video.status === 'published' ? 'Publiée' : 'Brouillon'}
                                    </div>
                                </div>

                                <div className="video-info">
                                    <h3>{video.title}</h3>
                                    <p className="video-description">{video.description}</p>

                                    <div className="video-meta">
                                        <span className="subject">{video.subject}</span>
                                        <span className="level">{video.level}</span>
                                        <span className="date">
                                            <FaCalendarAlt />
                                            {formatDate(video.created_at)}
                                        </span>
                                    </div>

                                    <div className="video-stats">
                                        <span className="views">
                                            <FaEye /> {video.total_views || 0}
                                        </span>
                                        <span className="likes">
                                            <FaHeart /> {video.total_likes || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="video-actions">
                                    <button
                                        onClick={() => navigate(`/videos/${video.id}`)}
                                        className="action-btn view-btn"
                                        title="Voir la vidéo"
                                    >
                                        <FaEye />
                                    </button>

                                    <button
                                        onClick={() => handleViewStats(video.id)}
                                        className="action-btn stats-btn"
                                        title="Voir les statistiques"
                                    >
                                        <FaChartLine />
                                    </button>

                                    <button
                                        onClick={() => handleStatusToggle(video.id, video.status)}
                                        className={`action-btn status-btn ${video.status === 'published' ? 'published' : 'draft'}`}
                                        title={video.status === 'published' ? 'Dépublier' : 'Publier'}
                                    >
                                        {video.status === 'published' ? <FaToggleOn /> : <FaToggleOff />}
                                    </button>

                                    <button
                                        onClick={() => navigate(`/videos/${video.id}/edit`)}
                                        className="action-btn edit-btn"
                                        title="Modifier"
                                    >
                                        <FaEdit />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteClick(video)}
                                        className="action-btn delete-btn"
                                        title="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de suppression */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <div className="modal-header">
                            <h3>Confirmer la suppression</h3>
                        </div>
                        <div className="modal-content">
                            <FaExclamationTriangle className="warning-icon" />
                            <p>Êtes-vous sûr de vouloir supprimer cette vidéo ?</p>
                            <p className="video-title">"{videoToDelete?.title}"</p>
                            <p className="warning-text">Cette action est irréversible.</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="cancel-btn"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="confirm-delete-btn"
                            >
                                <FaTrash /> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyVideos;