import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    FaPlay,
    FaPause,
    FaVolumeUp,
    FaVolumeMute,
    FaExpand,
    FaCompress,
    FaHeart,
    FaRegHeart,
    FaShare,
    FaArrowLeft,
    FaGraduationCap,
    FaEye,
    FaClock,
    FaThumbsUp,
    FaBookmark,
    FaRegBookmark,
    FaDownload,
    FaFlag
} from 'react-icons/fa';
import './VideoPlayer.css';

function VideoPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const [video, setVideo] = useState(null);
    const [similarVideos, setSimilarVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // États du lecteur vidéo
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [watchTime, setWatchTime] = useState(0);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchVideoData();

        // Sauvegarder le temps de visionnage toutes les 10 secondes
        const interval = setInterval(() => {
            if (isPlaying && currentTime > 0) {
                saveProgress();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [id, isPlaying, currentTime]);

    const fetchVideoData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/videos/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            setVideo(response.data.video);
            setSimilarVideos(response.data.similarVideos || []);
            setIsLiked(response.data.video.user_liked > 0);
            setWatchTime(response.data.video.user_progress || 0);

            // Définir le temps de début si l'utilisateur a déjà commencé à regarder
            if (response.data.video.user_progress > 0) {
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.currentTime = response.data.video.user_progress;
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la vidéo:', error);
            setError('Impossible de charger la vidéo');
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async () => {
        if (!token || !video) return;

        try {
            const completed = currentTime >= duration * 0.9; // 90% = terminé
            await axios.post(`${API_URL}/api/videos/${id}/view`, {
                watchTime: Math.floor(currentTime),
                completed: completed
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Erreur sauvegarde progression:', error);
        }
    };

    const handleLike = async () => {
        if (!token) {
            navigate('/connexion');
            return;
        }

        try {
            await axios.post(`${API_URL}/api/videos/${id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsLiked(!isLiked);
            setVideo(prev => ({
                ...prev,
                likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
            }));
        } catch (error) {
            console.error('Erreur lors du like:', error);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: `Regardez cette vidéo de ${video.teacher_name}`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Partage annulé');
            }
        } else {
            // Fallback: copier le lien
            navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papiers !');
        }
    };

    // Gestionnaires du lecteur vidéo
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleProgressClick = (e) => {
        if (progressRef.current && videoRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current.parentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changePlaybackRate = (rate) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return duration > 0 ? (currentTime / duration) * 100 : 0;
    };

    const getWatchedPercentage = () => {
        return duration > 0 ? (watchTime / duration) * 100 : 0;
    };

    if (loading) {
        return (
            <div className="video-player-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement de la vidéo...</p>
                </div>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="video-player-container">
                <div className="error-message">
                    <h2>Erreur</h2>
                    <p>{error || 'Vidéo non trouvée'}</p>
                    <button onClick={() => navigate('/videos')} className="back-btn">
                        Retour aux vidéos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-player-container">
            {/* Header */}
            <div className="video-header">
                <button onClick={() => navigate('/videos')} className="back-button">
                    <FaArrowLeft /> Retour
                </button>
                <div className="video-title-header">
                    <h1>{video.title}</h1>
                    <div className="video-meta-header">
                        <span className="teacher-info">
                            <FaGraduationCap /> {video.teacher_name}
                        </span>
                        <span className="subject-info">{video.subject} • {video.level}</span>
                    </div>
                </div>
            </div>

            {/* Lecteur vidéo */}
            <div className="video-player-wrapper">
                <div
                    className="video-player"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                >
                    <video
                        ref={videoRef}
                        src={`${API_URL}/api/videos/${id}/stream`}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onClick={togglePlayPause}
                        className="video-element"
                    />

                    {/* Indicateur de progression déjà vue */}
                    {watchTime > 0 && (
                        <div className="watch-progress-indicator">
                            <div
                                className="watched-bar"
                                style={{ width: `${getWatchedPercentage()}%` }}
                            />
                        </div>
                    )}

                    {/* Contrôles vidéo */}
                    <div className={`video-controls ${showControls ? 'visible' : ''}`}>
                        <div className="progress-section">
                            <div
                                ref={progressRef}
                                className="progress-bar"
                                onClick={handleProgressClick}
                            >
                                <div
                                    className="progress-fill"
                                    style={{ width: `${getProgressPercentage()}%` }}
                                />
                            </div>
                        </div>

                        <div className="controls-row">
                            <div className="left-controls">
                                <button onClick={togglePlayPause} className="control-btn">
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>

                                <button onClick={toggleMute} className="control-btn">
                                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>

                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="volume-slider"
                                />

                                <div className="time-display">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                            </div>

                            <div className="right-controls">
                                <select
                                    value={playbackRate}
                                    onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                                    className="playback-rate-select"
                                >
                                    <option value={0.5}>0.5x</option>
                                    <option value={0.75}>0.75x</option>
                                    <option value={1}>1x</option>
                                    <option value={1.25}>1.25x</option>
                                    <option value={1.5}>1.5x</option>
                                    <option value={2}>2x</option>
                                </select>

                                <button onClick={toggleFullscreen} className="control-btn">
                                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations et actions */}
            <div className="video-info-section">
                <div className="video-main-info">
                    <div className="video-stats">
                        <span className="views-count">
                            <FaEye /> {video.views_count} vues
                        </span>
                        <span className="duration">
                            <FaClock /> {formatTime(video.duration)}
                        </span>
                    </div>

                    <div className="video-actions">
                        <button
                            onClick={handleLike}
                            className={`action-btn ${isLiked ? 'liked' : ''}`}
                        >
                            {isLiked ? <FaHeart /> : <FaRegHeart />}
                            <span>{video.likes_count}</span>
                        </button>

                        <button onClick={handleShare} className="action-btn">
                            <FaShare />
                            <span>Partager</span>
                        </button>

                        <button
                            onClick={() => setIsBookmarked(!isBookmarked)}
                            className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`}
                        >
                            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                            <span>Sauvegarder</span>
                        </button>

                        <button className="action-btn">
                            <FaDownload />
                            <span>Télécharger</span>
                        </button>

                        <button className="action-btn report-btn">
                            <FaFlag />
                            <span>Signaler</span>
                        </button>
                    </div>
                </div>

                <div className="video-description">
                    <h3>Description</h3>
                    <p>{video.description || 'Aucune description disponible.'}</p>
                </div>

                <div className="teacher-info-section">
                    <div className="teacher-avatar">
                        {video.teacher_avatar ? (
                            <img
                                src={`${API_URL}/uploads/${video.teacher_avatar}`}
                                alt={video.teacher_name}
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                <FaGraduationCap />
                            </div>
                        )}
                    </div>
                    <div className="teacher-details">
                        <h4>{video.teacher_name}</h4>
                        <p>Professeur de {video.subject}</p>
                        {video.teacher_bio && <p className="teacher-bio">{video.teacher_bio}</p>}
                    </div>
                </div>
            </div>

            {/* Vidéos similaires */}
            {similarVideos.length > 0 && (
                <div className="similar-videos-section">
                    <h3>Vidéos similaires</h3>
                    <div className="similar-videos-grid">
                        {similarVideos.map(similarVideo => (
                            <div
                                key={similarVideo.id}
                                className="similar-video-card"
                                onClick={() => navigate(`/videos/${similarVideo.id}`)}
                            >
                                <div className="similar-video-thumbnail">
                                    <img
                                        src={similarVideo.thumbnail
                                            ? `${API_URL}/uploads/thumbnails/${similarVideo.thumbnail}`
                                            : '/default-thumbnail.jpg'
                                        }
                                        alt={similarVideo.title}
                                    />
                                    <div className="similar-video-duration">
                                        {formatTime(similarVideo.duration)}
                                    </div>
                                </div>
                                <div className="similar-video-info">
                                    <h5>{similarVideo.title}</h5>
                                    <p className="similar-video-teacher">{similarVideo.teacher_name}</p>
                                    <div className="similar-video-stats">
                                        <span><FaEye /> {similarVideo.views_count}</span>
                                        <span>{similarVideo.subject}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoPlayer;