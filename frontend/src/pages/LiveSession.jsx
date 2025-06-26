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
    FaVolumeMute
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

    // Nouveaux états pour audio/vidéo
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [audioStream, setAudioStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [uploadedDocument, setUploadedDocument] = useState(null);

    // Refs
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const audioRef = useRef(null);
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
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioStream, screenStream]);

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
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }

            leaveSession(sessionId);
            navigate('/live');
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

                // Send notification to chat
                sendMessage(sessionId, "🎤 Le professeur a activé son microphone");

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

                sendMessage(sessionId, "🔇 Le professeur a désactivé son microphone");
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

                sendMessage(sessionId, "🖥️ Le professeur partage son écran");

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

        sendMessage(sessionId, "🚫 Le professeur a arrêté le partage d'écran");
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
            sendMessage(sessionId, `📄 Le professeur a partagé un document: ${file.name}`);
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
            {/* Header de la session */}
            <div className="session-header">
                <div className="header-left">
                    <button onClick={() => navigate('/live')} className="back-button">
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
                    {/* Controls pour professeur */}
                    {isTeacher && isParticipant && (
                        <div className="teacher-controls">
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
            <div className="session-content">
                {/* Zone vidéo/présentation */}
                <div className="video-section">
                    <div className="video-placeholder">
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
                            <>
                                <FaVideo className="video-icon" />
                                <h3>Zone de présentation</h3>
                                <p>
                                    {isTeacher ?
                                        'Utilisez les boutons ci-dessus pour partager votre écran ou un document' :
                                        'En attente du partage du professeur...'
                                    }
                                </p>

                                {session?.status !== 'live' && (
                                    <div className="waiting-message">
                                        <p>⏳ En attente du début de la session...</p>
                                    </div>
                                )}

                                {!isParticipant && (
                                    <div className="waiting-message">
                                        <p>📝 Connexion à la session en cours...</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Audio element for teacher's voice */}
                        {isAudioEnabled && (
                            <audio
                                ref={audioRef}
                                className="teacher-audio"
                                controls={false}
                                muted={false}
                            />
                        )}
                    </div>

                    {/* Participants */}
                    <div className="participants-panel">
                        <div className="participants-header">
                            <FaUsers />
                            <span>Participants ({participants.length})</span>
                            {isAudioEnabled && (
                                <div className="audio-indicator">
                                    <FaMicrophone className={`mic-icon ${isMuted ? 'muted' : 'active'}`} />
                                    <span>Audio {isMuted ? 'coupé' : 'actif'}</span>
                                </div>
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
                                placeholder={connected && isParticipant ? "Tapez votre message..." : "Connexion au chat..."}
                                className="chat-input"
                                maxLength={500}
                                disabled={!connected || !isParticipant}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!newMessage.trim() || !connected || !isParticipant}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                        <div className="chat-status">
                            {!isConnected && <span className="status-offline">❌ Déconnecté</span>}
                            {isConnected && !connected && <span className="status-connecting">🔄 Connexion...</span>}
                            {isConnected && connected && isParticipant && <span className="status-online">✅ En ligne</span>}
                            {!isParticipant && <span className="status-connecting">📝 Rejointe de la session...</span>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LiveSession;