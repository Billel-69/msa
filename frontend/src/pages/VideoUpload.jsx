import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    FaUpload,
    FaVideo,
    FaImage,
    FaSpinner,
    FaCheckCircle,
    FaExclamationTriangle,
    FaArrowLeft,
    FaPlay,
    FaBook,
    FaGraduationCap,
    FaClock,
    FaEye
} from 'react-icons/fa';
import './VideoUpload.css';

function VideoUpload() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        level: '',
        status: 'draft'
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const subjects = [
        'Mathématiques', 'Français', 'Sciences', 'Histoire', 'Anglais',
        'Espagnol', 'Philosophie', 'Économie', 'Géographie', 'Musique', 'Art'
    ];

    const levels = [
        '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'
    ];

    // Vérifier si l'utilisateur est un professeur
    React.useEffect(() => {
        if (!user || user.accountType !== 'teacher') {
            navigate('/videos');
        }
    }, [user, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
            if (!allowedTypes.includes(file.type)) {
                setErrorMessage('Format de vidéo non supporté. Utilisez MP4, AVI, MOV, WMV ou WebM.');
                return;
            }

            // Vérifier la taille (500MB max)
            if (file.size > 500 * 1024 * 1024) {
                setErrorMessage('La vidéo est trop volumineuse. Taille maximale : 500 MB.');
                return;
            }

            setVideoFile(file);
            setErrorMessage('');

            // Créer une URL de prévisualisation
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier le type de fichier
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrorMessage('Format d\'image non supporté. Utilisez JPEG, PNG, GIF ou WebP.');
                return;
            }

            // Vérifier la taille (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setErrorMessage('L\'image est trop volumineuse. Taille maximale : 10 MB.');
                return;
            }

            setThumbnailFile(file);
            setErrorMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!videoFile) {
            setErrorMessage('Veuillez sélectionner une vidéo');
            return;
        }

        if (!formData.title.trim()) {
            setErrorMessage('Le titre est obligatoire');
            return;
        }

        setIsUploading(true);
        setUploadStatus('uploading');
        setErrorMessage('');

        try {
            const uploadData = new FormData();
            uploadData.append('title', formData.title);
            uploadData.append('description', formData.description);
            uploadData.append('subject', formData.subject);
            uploadData.append('level', formData.level);
            uploadData.append('status', formData.status);
            uploadData.append('video', videoFile);

            if (thumbnailFile) {
                uploadData.append('thumbnail', thumbnailFile);
            }

            const response = await axios.post(`${API_URL}/api/videos/upload`, uploadData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadStatus('success');

            // Rediriger vers la page de gestion des vidéos après 2 secondes
            setTimeout(() => {
                navigate('/videos/my-videos');
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.error || 'Erreur lors de l\'upload de la vidéo');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            subject: '',
            level: '',
            status: 'draft'
        });
        setVideoFile(null);
        setThumbnailFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
        setPreviewUrl('');
    };

    return (
        <div className="video-upload-container">
            <div className="upload-header">
                <button onClick={() => navigate('/videos')} className="back-button">
                    <FaArrowLeft /> Retour
                </button>
                <div className="upload-title">
                    <h1>📹 Ajouter une nouvelle vidéo</h1>
                    <p>Partagez vos connaissances avec vos élèves</p>
                </div>
            </div>

            <div className="upload-content">
                <div className="upload-form-section">
                    <form onSubmit={handleSubmit} className="upload-form">
                        {/* Informations de base */}
                        <div className="form-section">
                            <h3>📝 Informations de base</h3>

                            <div className="form-group">
                                <label htmlFor="title">Titre de la vidéo *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Les fractions en mathématiques - Niveau 6ème"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="subject">Matière</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Sélectionnez une matière</option>
                                        {subjects.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="level">Niveau</label>
                                    <select
                                        id="level"
                                        name="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Sélectionnez un niveau</option>
                                        {levels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Décrivez le contenu de votre vidéo..."
                                    rows={4}
                                    maxLength={1000}
                                />
                                <small>{formData.description.length}/1000 caractères</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Statut de publication</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="published">Publié</option>
                                </select>
                                <small>Vous pourrez modifier ce statut plus tard</small>
                            </div>
                        </div>

                        {/* Upload des fichiers */}
                        <div className="form-section">
                            <h3>📁 Fichiers</h3>

                            <div className="upload-area">
                                <label htmlFor="video-upload" className="upload-label">
                                    <div className="upload-icon">
                                        <FaVideo />
                                    </div>
                                    <div className="upload-text">
                                        <strong>Cliquez pour sélectionner la vidéo</strong>
                                        <p>MP4, AVI, MOV, WMV, WebM - Max 500MB</p>
                                    </div>
                                </label>
                                <input
                                    type="file"
                                    id="video-upload"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    style={{ display: 'none' }}
                                />

                                {videoFile && (
                                    <div className="file-info">
                                        <FaCheckCircle className="success-icon" />
                                        <span>{videoFile.name}</span>
                                        <span className="file-size">
                                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="upload-area">
                                <label htmlFor="thumbnail-upload" className="upload-label">
                                    <div className="upload-icon">
                                        <FaImage />
                                    </div>
                                    <div className="upload-text">
                                        <strong>Miniature (optionnel)</strong>
                                        <p>JPG, PNG, GIF, WebP - Max 10MB</p>
                                    </div>
                                </label>
                                <input
                                    type="file"
                                    id="thumbnail-upload"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    style={{ display: 'none' }}
                                />

                                {thumbnailFile && (
                                    <div className="file-info">
                                        <FaCheckCircle className="success-icon" />
                                        <span>{thumbnailFile.name}</span>
                                        <span className="file-size">
                                            {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages d'erreur */}
                        {errorMessage && (
                            <div className="error-message">
                                <FaExclamationTriangle />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Boutons d'action */}
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="reset-btn"
                                disabled={isUploading}
                            >
                                Réinitialiser
                            </button>

                            <button
                                type="submit"
                                className="upload-btn"
                                disabled={isUploading || !videoFile || !formData.title.trim()}
                            >
                                {isUploading ? (
                                    <>
                                        <FaSpinner className="spinning" />
                                        Uploading... {uploadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <FaUpload />
                                        Publier la vidéo
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Prévisualisation */}
                <div className="preview-section">
                    <h3>👁️ Prévisualisation</h3>

                    {previewUrl ? (
                        <div className="video-preview">
                            <video
                                src={previewUrl}
                                controls
                                className="preview-video"
                            />
                        </div>
                    ) : (
                        <div className="preview-placeholder">
                            <FaPlay size={50} />
                            <p>Sélectionnez une vidéo pour la prévisualiser</p>
                        </div>
                    )}

                    {formData.title && (
                        <div className="preview-info">
                            <h4>{formData.title}</h4>
                            <div className="preview-meta">
                                <span className="preview-teacher">
                                    <FaGraduationCap /> {user?.name}
                                </span>
                                {formData.subject && (
                                    <span className="preview-subject">
                                        <FaBook /> {formData.subject}
                                    </span>
                                )}
                                {formData.level && (
                                    <span className="preview-level">{formData.level}</span>
                                )}
                            </div>
                            {formData.description && (
                                <p className="preview-description">{formData.description}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Statut d'upload */}
            {uploadStatus === 'uploading' && (
                <div className="upload-modal">
                    <div className="upload-modal-content">
                        <div className="upload-spinner">
                            <FaSpinner className="spinning" size={40} />
                        </div>
                        <h3>Upload en cours...</h3>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p>{uploadProgress}% terminé</p>
                    </div>
                </div>
            )}

            {uploadStatus === 'success' && (
                <div className="upload-modal">
                    <div className="upload-modal-content success">
                        <FaCheckCircle size={60} className="success-icon" />
                        <h3>Vidéo uploadée avec succès !</h3>
                        <p>Redirection vers vos vidéos...</p>
                    </div>
                </div>
            )}

            {uploadStatus === 'error' && (
                <div className="upload-modal">
                    <div className="upload-modal-content error">
                        <FaExclamationTriangle size={60} className="error-icon" />
                        <h3>Erreur lors de l'upload</h3>
                        <p>{errorMessage}</p>
                        <button
                            onClick={() => setUploadStatus('idle')}
                            className="retry-btn"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoUpload;