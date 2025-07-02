import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import {
    FaArrowLeft,
    FaPaperPlane,
    FaUsers,
    FaVideo,
    FaCrown,
    FaUserGraduate,
    FaChild,
    FaSignOutAlt,
    FaMicrophone,
    FaMicrophoneSlash,
    FaDesktop,
    FaStop,
    FaFileUpload,
    FaVolumeUp,
    FaVolumeMute,
    FaVideoSlash,
    FaExpand,
    FaCompress,
    FaPlay
} from 'react-icons/fa';
import './LiveSession.css';

function LiveSession() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { isConnected, joinSession, leaveSession, sendMessage, onNewMessage, onJoinedSession, onError } = useSocket();

    // États existants
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isParticipant, setIsParticipant] = useState(false);

    // États pour audio/vidéo
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [audioStream, setAudioStream] = useState(null);
    const [videoStream, setVideoStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [uploadedDocument, setUploadedDocument] = useState(null);

    // États pour l'interface vidéo
    const [isVideoExpanded, setIsVideoExpanded] = useState(false);
    const [videoLayout, setVideoLayout] = useState('picture-in-picture');

    // Refs
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const fileInputRef = useRef(null);

    // Check if user is teacher
    const isTeacher = user?.accountType === 'teacher' || session?.teacher_id === user?.id;

    useEffect(() => {
        console.log('=== DEBUT CHARGEMENT SESSION ===');
        console.log('Token disponible:', !!token);
        console.log('User:', user);
        console.log('SessionId:', sessionId);

        if (!token || !user) {
            console.log('Redirection vers connexion - pas de token ou user');
            navigate('/connexion');
            return;
        }

        fetchSessionDetails();
    }, [sessionId, token, user, navigate]);

    useEffect(() => {
        if (isConnected && session && isParticipant && !connected) {
            console.log('Tentative de connexion socket...');
            handleJoinSession();
        }
    }, [isConnected, session, isParticipant, connected]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup streams on unmount
    useEffect(() => {
        return () => {
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioStream, videoStream, screenStream]);

    // Écouteurs Socket.io
    useEffect(() => {
        const unsubscribeNewMessage = onNewMessage((message) => {
            console.log('Nouveau message reçu:', message);
            setMessages(prev => [...prev, message]);
        });

        const unsubscribeJoined = onJoinedSession((data) => {
            console.log('Session rejointe via socket:', data);
            setConnected(true);
            setError(null);
        });

        const unsubscribeError = onError((error) => {
            console.error('Erreur Socket:', error);
            setError(error.message);
        });

        return () => {
            if (unsubscribeNewMessage) unsubscribeNewMessage();
            if (unsubscribeJoined) unsubscribeJoined();
            if (unsubscribeError) unsubscribeError();
        };
    }, [onNewMessage, onJoinedSession, onError]);

    const fetchSessionDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('=== FETCH SESSION DETAILS ===');
            console.log('URL:', `http://localhost:5000/api/live/session/${sessionId}`);

            const response = await axios.get(`http://localhost:5000/api/live/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('=== REPONSE RECUE ===');
            console.log('Status:', response.status);
            console.log('Data:', response.data);

            setSession(response.data.session);
            setParticipants(response.data.participants || []);
            setIsParticipant(response.data.isParticipant);

            // Si pas encore participant, essayer de rejoindre automatiquement
            if (!response.data.isParticipant) {
                console.log('Pas encore participant, tentative de connexion...');
                await handleJoinSessionAPI();
            } else {
                console.log('Utilisateur est participant, chargement des messages...');
                await loadMessages();
            }

        } catch (error) {
            console.log('=== ERREUR FETCH SESSION ===');
            console.log('Error status:', error.response?.status);
            console.log('Error data:', error.response?.data);
            console.log('Error message:', error.message);

            if (error.response?.status === 404) {
                setError('Session introuvable');
            } else if (error.response?.status === 403) {
                setError('Accès refusé à cette session');
            } else {
                setError(error.response?.data?.error || 'Impossible de charger la session');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSessionAPI = async () => {
        try {
            console.log('=== TENTATIVE CONNEXION API ===');

            const response = await axios.post(`http://localhost:5000/api/live/join-session/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Connexion API réussie:', response.data);

            if (response.data.alreadyJoined || response.data.message.includes('réussie')) {
                setIsParticipant(true);
                // Recharger les données de session pour avoir les participants mis à jour
                await fetchSessionDetails();
                await loadMessages();
            }

        } catch (error) {
            console.error('=== ERREUR CONNEXION API ===', error);

            if (error.response?.status === 401) {
                // Session protégée par mot de passe
                const password = prompt('Cette session est protégée par un mot de passe :');
                if (password) {
                    try {
                        const passwordResponse = await axios.post(`http://localhost:5000/api/live/join-session/${sessionId}`,
                            { password },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        console.log('Connexion avec mot de passe réussie:', passwordResponse.data);
                        setIsParticipant(true);
                        await fetchSessionDetails();
                        await loadMessages();
                    } catch (passwordError) {
                        setError('Mot de passe incorrect');
                    }
                }
            } else if (error.response?.status === 400) {
                setError('Session complète ou non disponible');
            } else {
                setError('Impossible de rejoindre la session');
            }
        }
    };

    const loadMessages = async () => {
        try {
            console.log('Chargement des messages...');
            const response = await axios.get(`http://localhost:5000/api/live/session/${sessionId}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Messages chargés:', response.data.length);
            setMessages(response.data);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            // Ne pas bloquer l'interface si les messages ne se chargent pas
        }
    };

    const handleJoinSession = () => {
        if (session && isConnected && isParticipant) {
            console.log('Connexion socket à la session...');
            joinSession(sessionId);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !connected) return;

        console.log('Envoi message:', newMessage.trim());
        sendMessage(sessionId, newMessage.trim());
        setNewMessage('');

        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 100);
    };

    const handleLeaveSession = () => {
        if (window.confirm('Êtes-vous sûr de vouloir quitter cette session ?')) {
            // Stop all streams before leaving
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }

            leaveSession(sessionId);
            navigate('/live');
        }
    };

    // NOUVELLE FONCTION : Démarrer une session directement depuis la session
    const handleStartSession = async () => {
        if (!isTeacher) return;

        try {
            console.log('Démarrage de la session depuis l\'interface...');

            await axios.post(`http://localhost:5000/api/live/start-session/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Session démarrée avec succès');

            // Mettre à jour l'état local
            setSession(prev => ({
                ...prev,
                status: 'live',
                started_at: new Date().toISOString()
            }));

            // Envoyer un message système
            if (connected) {
                sendMessage(sessionId, '🎥 La session a commencé !');
            }

        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            setError('Impossible de démarrer la session');
        }
    };

    // Camera functions
    const toggleVideo = async () => {
        if (!isTeacher) return;

        try {
            if (!isVideoEnabled) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false // Audio géré séparément
                });

                setVideoStream(stream);
                setIsVideoEnabled(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }

                if (connected) {
                    sendMessage(sessionId, "📹 Le professeur a activé sa caméra");
                }

            } else {
                if (videoStream) {
                    videoStream.getTracks().forEach(track => track.stop());
                }
                setVideoStream(null);
                setIsVideoEnabled(false);

                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }

                if (connected) {
                    sendMessage(sessionId, "📹❌ Le professeur a désactivé sa caméra");
                }
            }
        } catch (error) {
            console.error('Erreur caméra:', error);
            setError('Impossible d\'accéder à la caméra');
        }
    };

    // Audio functions
    const toggleAudio = async () => {
        if (!isTeacher) return;

        try {
            if (!isAudioEnabled) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                setAudioStream(stream);
                setIsAudioEnabled(true);

                if (audioRef.current) {
                    audioRef.current.srcObject = stream;
                    audioRef.current.play();
                }

                if (connected) {
                    sendMessage(sessionId, "🎤 Le professeur a activé son microphone");
                }

            } else {
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
                setAudioStream(null);
                setIsAudioEnabled(false);
                setIsMuted(false);

                if (audioRef.current) {
                    audioRef.current.srcObject = null;
                }

                if (connected) {
                    sendMessage(sessionId, "🔇 Le professeur a désactivé son microphone");
                }
            }
        } catch (error) {
            console.error('Erreur audio:', error);
            setError('Impossible d\'accéder au microphone');
        }
    };

    const toggleMute = () => {
        if (audioStream) {
            audioStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    // Screen sharing functions
    const toggleScreenShare = async () => {
        if (!isTeacher) return;

        try {
            if (!isScreenSharing) {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always',
                        frameRate: 30
                    },
                    audio: true
                });

                setScreenStream(stream);
                setIsScreenSharing(true);

                if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = stream;
                    screenVideoRef.current.play();
                }

                // Handle stream ending
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };

                if (connected) {
                    sendMessage(sessionId, "🖥️ Le professeur partage son écran");
                }

            } else {
                stopScreenShare();
            }
        } catch (error) {
            console.error('Erreur partage d\'écran:', error);
            setError('Impossible de partager l\'écran');
        }
    };

    const stopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setIsScreenSharing(false);

        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }

        if (connected) {
            sendMessage(sessionId, "🚫 Le professeur a arrêté le partage d'écran");
        }
    };

    // Layout functions
    const toggleVideoExpanded = () => {
        setIsVideoExpanded(!isVideoExpanded);
    };

    const changeVideoLayout = (layout) => {
        setVideoLayout(layout);
    };

    // Document upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file type and size
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            setError('Format de fichier non supporté. Utilisez PDF, images ou PowerPoint.');
            return;
        }

        if (file.size > maxSize) {
            setError('Le fichier est trop volumineux (max 10MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedDocument({
                name: file.name,
                type: file.type,
                url: e.target.result
            });
            if (connected) {
                sendMessage(sessionId, `📄 Le professeur a partagé un document: ${file.name}`);
            }
        };
        reader.readAsDataURL(file);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserIcon = (accountType) => {
        switch (accountType) {
            case 'teacher': return <FaUserGraduate className="user-icon teacher" />;
            case 'parent': return <FaCrown className="user-icon parent" />;
            case 'child': return <FaChild className="user-icon child" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="live-session-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement de la session...</p>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="live-session-container">
                <div className="error-message">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/live')} className="back-btn">
                        Retour au menu Live
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="live-session-container">
            {/* Header de la session - VERSION AVEC CLASSE UNIQUE */}
            <div className="session-header">
                <div className="header-left">
                    {/* NOUVELLE CLASSE UNIQUE pour éviter les conflits */}
                    <button onClick={() => navigate('/live')} className="live-session-back-button">
                        <FaArrowLeft />
                    </button>
                    <div className="session-info">
                        <div className="session-status">
                            <div className={`status-indicator ${session?.status}`}></div>
                            <span className="status-text">
                                {session?.status === 'live' ? 'EN DIRECT' : 'EN ATTENTE'}
                            </span>
                        </div>
                        <h1>{session?.title}</h1>
                        <p className="session-details">
                            <span>Par {session?.teacher_name}</span>
                            <span>•</span>
                            <span>{session?.subject}</span>
                            <span>•</span>
                            <span>Code: {session?.room_code}</span>
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    {/* NOUVEAU : Bouton pour démarrer la session si c'est le professeur et que la session est en attente */}
                    {isTeacher && session?.status === 'waiting' && (
                        <button
                            onClick={handleStartSession}
                            className="start-session-btn"
                            style={{
                                background: 'linear-gradient(45deg, #28a745, #20c997)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                marginRight: '15px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            <FaPlay /> Démarrer la session
                        </button>
                    )}

                    {/* Controls pour professeur - SEULEMENT SI SESSION LIVE */}
                    {isTeacher && isParticipant && session?.status === 'live' && (
                        <div className="teacher-controls">
                            <button
                                onClick={toggleVideo}
                                className={`control-btn video-btn ${isVideoEnabled ? 'active' : ''}`}
                                title={isVideoEnabled ? 'Désactiver la caméra' : 'Activer la caméra'}
                            >
                                {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                            </button>

                            <button
                                onClick={toggleAudio}
                                className={`control-btn audio-btn ${isAudioEnabled ? 'active' : ''}`}
                                title={isAudioEnabled ? 'Désactiver le micro' : 'Activer le micro'}
                            >
                                {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                            </button>

                            {isAudioEnabled && (
                                <button
                                    onClick={toggleMute}
                                    className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
                                    title={isMuted ? 'Réactiver le son' : 'Couper le son'}
                                >
                                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>
                            )}

                            <button
                                onClick={toggleScreenShare}
                                className={`control-btn screen-btn ${isScreenSharing ? 'active' : ''}`}
                                title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
                            >
                                {isScreenSharing ? <FaStop /> : <FaDesktop />}
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.pptx"
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="control-btn upload-btn"
                                title="Partager un document"
                            >
                                <FaFileUpload />
                            </button>

                            {isVideoEnabled && (
                                <button
                                    onClick={toggleVideoExpanded}
                                    className="control-btn expand-btn"
                                    title={isVideoExpanded ? 'Réduire' : 'Agrandir la vidéo'}
                                >
                                    {isVideoExpanded ? <FaCompress /> : <FaExpand />}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="connection-status">
                        <div className={`connection-indicator ${isConnected && connected ? 'connected' : 'disconnected'}`}></div>
                        <span>{isConnected && connected ? 'Connecté' : 'Déconnecté'}</span>
                    </div>
                    <button onClick={handleLeaveSession} className="leave-button">
                        <FaSignOutAlt />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            <div className={`session-content ${videoLayout}`}>
                {/* Zone vidéo/présentation */}
                <div className="video-section">
                    <div className="main-video-container">
                        {/* Contenu principal (écran partagé ou document) */}
                        <div className="primary-content">
                            {isScreenSharing ? (
                                <div className="screen-share-container">
                                    <video
                                        ref={screenVideoRef}
                                        className="screen-video"
                                        controls={false}
                                        muted
                                    />
                                    <div className="screen-share-overlay">
                                        <span>🖥️ Partage d'écran actif</span>
                                    </div>
                                </div>
                            ) : uploadedDocument ? (
                                <div className="document-container">
                                    {uploadedDocument.type === 'application/pdf' ? (
                                        <iframe
                                            src={uploadedDocument.url}
                                            className="document-viewer"
                                            title={uploadedDocument.name}
                                        />
                                    ) : (
                                        <img
                                            src={uploadedDocument.url}
                                            alt={uploadedDocument.name}
                                            className="document-image"
                                        />
                                    )}
                                    <div className="document-overlay">
                                        <span>📄 {uploadedDocument.name}</span>
                                        {isTeacher && (
                                            <button
                                                onClick={() => setUploadedDocument(null)}
                                                className="close-document"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="video-placeholder">
                                    <FaVideo className="video-icon" />
                                    <h3>Zone de présentation</h3>
                                    <p>
                                        {isTeacher ?
                                            session?.status === 'waiting' ?
                                                'Démarrez la session pour commencer le partage' :
                                                'Utilisez les boutons ci-dessus pour partager votre écran, un document ou activer votre caméra'
                                            :
                                            'En attente du partage du professeur...'
                                        }
                                    </p>

                                    {/* MESSAGE POUR SESSION EN ATTENTE */}
                                    {session?.status !== 'live' && (
                                        <div className="waiting-message">
                                            <p>
                                                {isTeacher ?
                                                    '⏳ Cliquez sur "Démarrer la session" pour commencer' :
                                                    '⏳ En attente du début de la session...'
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {!isParticipant && (
                                        <div className="waiting-message">
                                            <p>📝 Connexion à la session en cours...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Vidéo du professeur (Picture-in-Picture ou côte à côte) - SEULEMENT SI SESSION LIVE */}
                        {isVideoEnabled && session?.status === 'live' && (
                            <div className={`teacher-video-container ${isVideoExpanded ? 'expanded' : 'pip'} ${videoLayout}`}>
                                <video
                                    ref={videoRef}
                                    className="teacher-video"
                                    controls={false}
                                    muted={true} // Toujours muted pour éviter le feedback
                                    autoPlay
                                />
                                <div className="video-overlay">
                                    <span>📹 {session?.teacher_name}</span>
                                    {isTeacher && (
                                        <div className="video-controls">
                                            <button
                                                onClick={() => changeVideoLayout('picture-in-picture')}
                                                className={`layout-btn ${videoLayout === 'picture-in-picture' ? 'active' : ''}`}
                                                title="Picture-in-Picture"
                                            >
                                                PiP
                                            </button>
                                            <button
                                                onClick={() => changeVideoLayout('side-by-side')}
                                                className={`layout-btn ${videoLayout === 'side-by-side' ? 'active' : ''}`}
                                                title="Côte à côte"
                                            >
                                                ⚏
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Audio element for teacher's voice - SEULEMENT SI SESSION LIVE */}
                    {isAudioEnabled && session?.status === 'live' && (
                        <audio
                            ref={audioRef}
                            className="teacher-audio"
                            controls={false}
                            muted={false}
                        />
                    )}

                    {/* Participants */}
                    <div className="participants-panel">
                        <div className="participants-header">
                            <FaUsers />
                            <span>Participants ({participants.length})</span>
                            {/* INDICATEURS SEULEMENT SI SESSION LIVE */}
                            {session?.status === 'live' && (
                                <>
                                    {isAudioEnabled && (
                                        <div className="audio-indicator">
                                            <FaMicrophone className={`mic-icon ${isMuted ? 'muted' : 'active'}`} />
                                            <span>Audio {isMuted ? 'coupé' : 'actif'}</span>
                                        </div>
                                    )}
                                    {isVideoEnabled && (
                                        <div className="video-indicator">
                                            <FaVideo className="video-icon active" />
                                            <span>Vidéo active</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="participants-list">
                            {participants.map(participant => (
                                <div key={participant.user_id} className={`participant ${participant.role}`}>
                                    <div className="participant-avatar">
                                        {participant.profile_picture ? (
                                            <img src={`http://localhost:5000/uploads/${participant.profile_picture}`} alt={participant.user_name} />
                                        ) : (
                                            <span>{participant.user_name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="participant-info">
                                        <span className="participant-name">{participant.user_name}</span>
                                        <div className="participant-role">
                                            {getUserIcon(participant.role)}
                                            {participant.role === 'teacher' ? 'Professeur' :
                                                participant.role === 'parent' ? 'Parent' : 'Élève'}
                                        </div>
                                    </div>
                                    {participant.role === 'teacher' && (
                                        <FaCrown className="teacher-crown" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat */}
                <div className="chat-section">
                    <div className="chat-header">
                        <h3>💬 Chat de la session</h3>
                        {error && (
                            <div className="chat-error">⚠️ {error}</div>
                        )}
                    </div>

                    <div className="chat-messages">
                        {messages.map(message => (
                            <div key={message.id} className={`message ${message.message_type} ${message.user_id === user.id ? 'own' : 'other'}`}>
                                {message.message_type === 'system' ? (
                                    <div className="system-message">
                                        <span>{message.message}</span>
                                        <time>{formatTime(message.created_at)}</time>
                                    </div>
                                ) : (
                                    <>
                                        {message.user_id !== user.id && (
                                            <div className="message-avatar">
                                                {message.profile_picture ? (
                                                    <img src={`http://localhost:5000/uploads/${message.profile_picture}`} alt={message.user_name} />
                                                ) : (
                                                    <span>{message.user_name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="message-content">
                                            {message.user_id !== user.id && (
                                                <div className="message-header">
                                                    <span className="message-author">{message.user_name}</span>
                                                    {getUserIcon(message.account_type)}
                                                    <time className="message-time">{formatTime(message.created_at)}</time>
                                                </div>
                                            )}
                                            <div className="message-bubble">
                                                <p>{message.message}</p>
                                                {message.user_id === user.id && (
                                                    <time className="message-time">{formatTime(message.created_at)}</time>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <div className="chat-input-container">
                            <input
                                ref={messageInputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={
                                    connected && isParticipant ?
                                        session?.status === 'live' ?
                                            "Tapez votre message..." :
                                            "En attente du début de la session..."
                                        : "Connexion au chat..."
                                }
                                className="chat-input"
                                maxLength={500}
                                disabled={!connected || !isParticipant || session?.status !== 'live'}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!newMessage.trim() || !connected || !isParticipant || session?.status !== 'live'}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                        <div className="chat-status">
                            {!isConnected && <span className="status-offline">❌ Déconnecté</span>}
                            {isConnected && !connected && <span className="status-connecting">🔄 Connexion...</span>}
                            {isConnected && connected && isParticipant && session?.status === 'live' && <span className="status-online">✅ En ligne</span>}
                            {isConnected && connected && isParticipant && session?.status === 'waiting' && <span className="status-connecting">⏳ En attente du début</span>}
                            {!isParticipant && <span className="status-connecting">📝 Rejointe de la session...</span>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LiveSession;