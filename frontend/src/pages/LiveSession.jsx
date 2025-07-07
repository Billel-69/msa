// Fichier: src/components/LiveSession.jsx
// VERSION CORRIGÉE - Résout les problèmes d'affichage vidéo et audio

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useAgoraLive } from '../hooks/useAgoraLive';
import axios from 'axios';
import {
    FaArrowLeft,
    FaPaperPlane,
    FaUsers,
    FaVideo,
    FaVideoSlash,
    FaCrown,
    FaUserGraduate,
    FaChild,
    FaSignOutAlt,
    FaMicrophone,
    FaMicrophoneSlash,
    FaDesktop,
    FaStop,
    FaVolumeUp,
    FaVolumeMute,
    FaWifi,
    FaExclamationTriangle,
    FaRedo,
    FaPlay,
    FaPause,
    FaPlayCircle
} from 'react-icons/fa';
import './LiveSession.css';

// ==========================================
// COMPOSANT VIDÉO DISTANTE - CORRIGÉ
// ==========================================

const RemoteVideoDisplay = React.memo(({ user, isMain = false }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        console.log('🎥 RemoteVideoDisplay - Tentative affichage:', {
            uid: user.uid,
            hasVideoTrack: !!user.videoTrack,
            hasContainer: !!videoRef.current,
            isMain
        });

        if (user.videoTrack && videoRef.current) {
            try {
                // IMPORTANT: Nettoyer d'abord le container
                videoRef.current.innerHTML = '';

                // Jouer la vidéo
                user.videoTrack.play(videoRef.current);
                console.log('✅ Vidéo distante affichée pour:', user.uid);
            } catch (error) {
                console.error('❌ Erreur affichage vidéo distante:', error, {
                    uid: user.uid,
                    track: user.videoTrack,
                    container: videoRef.current
                });
            }
        } else {
            console.warn('⚠️ Conditions non remplies pour vidéo distante:', {
                uid: user.uid,
                hasTrack: !!user.videoTrack,
                hasContainer: !!videoRef.current
            });
        }

        // Cleanup
        return () => {
            if (videoRef.current) {
                try {
                    videoRef.current.innerHTML = '';
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [user.videoTrack, user.uid]);

    const containerStyle = isMain ? {
        width: '100%',
        height: '400px',
        background: '#000',
        borderRadius: '12px'
    } : {
        width: '100%',
        height: '100%',
        background: '#000',
        borderRadius: '6px'
    };

    return (
        <div
            ref={videoRef}
            className={isMain ? "remote-video-main" : "remote-video"}
            style={containerStyle}
        />
    );
});

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

function LiveSession() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    // IMPORTANT: Mémoriser ces valeurs pour éviter les recréations
    const memoizedSessionId = useMemo(() => sessionId, [sessionId]);
    const memoizedUser = useMemo(() => user, [user?.id, user?.name, user?.accountType]);

    // États de la session
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isParticipant, setIsParticipant] = useState(false);

    // États pour éviter les boucles
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Refs pour éviter les boucles
    const hasJoinedAgoraRef = useRef(false);
    const isJoiningRef = useRef(false);
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const localVideoRef = useRef(null);
    const screenVideoRef = useRef(null);

    // Configuration API
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Socket pour le chat
    const { isConnected, joinSession, leaveSession, sendMessage, onNewMessage, onJoinedSession, onError } = useSocket();

    // Déterminer si l'utilisateur est professeur STABLE
    const isTeacher = useMemo(() => {
        return user?.accountType === 'teacher' || (session && session.teacher_id === user?.id);
    }, [user?.accountType, user?.id, session?.teacher_id]);

    // Hook Agora avec paramètres stables
    const agoraHook = useAgoraLive(memoizedSessionId, memoizedUser, isTeacher);

    // ==========================================
    // FONCTIONS PRINCIPALES
    // ==========================================

    // Rejoindre Agora
    const handleJoinAgora = useCallback(async () => {
        if (isJoiningRef.current || hasJoinedAgoraRef.current) {
            console.log('⚠️ Agora: déjà en cours...');
            return;
        }

        try {
            isJoiningRef.current = true;
            hasJoinedAgoraRef.current = true;

            console.log('🎬 Agora: Connexion...');
            await agoraHook.joinChannel();

            console.log('✅ Agora: Connecté!');

            // Message de connexion
            if (isConnected && isParticipant) {
                sendMessage(memoizedSessionId, `🎥 ${user.name} a rejoint la session vidéo`);
            }

        } catch (error) {
            console.error('❌ Agora: Erreur connexion', error);
            setError('Impossible de rejoindre la session vidéo');
            hasJoinedAgoraRef.current = false;
        } finally {
            isJoiningRef.current = false;
        }
    }, [agoraHook.joinChannel, isConnected, isParticipant, user?.name, memoizedSessionId, sendMessage]);

    // Démarrer le live
    const handleStartLive = useCallback(async () => {
        if (!isTeacher || !session) {
            return;
        }

        try {
            console.log('▶️ Démarrage du live...');

            const response = await axios.post(`${API_URL}/api/live/start-session/${session.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Live démarré:', response.data);

            setSession(prev => ({
                ...prev,
                status: 'live',
                started_at: new Date().toISOString()
            }));

            if (isConnected && isParticipant) {
                sendMessage(memoizedSessionId, `🎬 Le professeur a démarré le live !`);
            }

            if (!agoraHook.isJoined) {
                await handleJoinAgora();
            }

        } catch (error) {
            console.error('❌ Erreur démarrage live:', error);
            setError('Impossible de démarrer le live');
        }
    }, [isTeacher, session, API_URL, token, isConnected, isParticipant, sendMessage, memoizedSessionId, agoraHook.isJoined, handleJoinAgora]);

    // Arrêter le live
    const handleStopLive = useCallback(async () => {
        if (!isTeacher || !session) {
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir arrêter le live ?')) {
            return;
        }

        try {
            console.log('⏹️ Arrêt du live...');

            const response = await axios.post(`${API_URL}/api/live/end-session/${session.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Live arrêté:', response.data);

            setSession(prev => ({
                ...prev,
                status: 'ended',
                ended_at: new Date().toISOString()
            }));

            if (isConnected && isParticipant) {
                sendMessage(memoizedSessionId, `🔚 Le professeur a arrêté le live.`);
            }

            await agoraHook.leaveChannel();

            setTimeout(() => {
                navigate('/live');
            }, 2000);

        } catch (error) {
            console.error('❌ Erreur arrêt live:', error);
            setError('Impossible d\'arrêter le live');
        }
    }, [isTeacher, session, API_URL, token, isConnected, isParticipant, sendMessage, memoizedSessionId, agoraHook.leaveChannel, navigate]);

    // ==========================================
    // NOUVEAU: Fonction pour débloquer l'audio
    // ==========================================
    const handleEnableAudioPlayback = useCallback(async () => {
        try {
            await agoraHook.enableAudioPlayback();
            console.log('✅ Audio playback enabled');
        } catch (error) {
            console.error('❌ Failed to enable audio playback:', error);
        }
    }, [agoraHook.enableAudioPlayback]);

    // ==========================================
    // EFFETS
    // ==========================================

    // EFFET 1: Chargement initial UNIQUE
    useEffect(() => {
        if (!token || !user || initialLoadComplete) {
            return;
        }

        if (!user.id) {
            navigate('/connexion');
            return;
        }

        console.log('🎯 PREMIÈRE FOIS - Chargement session...');
        setInitialLoadComplete(true);
        fetchSessionDetails();

        return () => {
            console.log('🧹 Nettoyage composant LiveSession');
        };
    }, [token, user?.id, initialLoadComplete]);

    // EFFET 2: Rejoindre Agora UNE SEULE FOIS
    useEffect(() => {
        if (!sessionLoaded || !isParticipant || hasJoinedAgoraRef.current || agoraHook.isJoined || agoraHook.isConnecting || isJoiningRef.current) {
            return;
        }

        console.log('🚀 CONDITIONS OK - Rejoindre Agora');
        handleJoinAgora();
    }, [sessionLoaded, isParticipant, agoraHook.isJoined, agoraHook.isConnecting, handleJoinAgora]);

    // EFFET 3: Gestion des nouveaux messages
    useEffect(() => {
        if (!onNewMessage) return;

        const unsubscribe = onNewMessage((message) => {
            console.log('💬 Nouveau message:', message.message?.substring(0, 30) + '...');
            setMessages(prev => [...prev, message]);
        });

        return unsubscribe;
    }, [onNewMessage]);

    // EFFET 4: Scroll des messages
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages.length]);

    // EFFET 5: Vidéo locale - CORRIGÉ
    useEffect(() => {
        console.log('🔄 EFFET VIDÉO LOCALE - État actuel:', {
            hasLocalVideoTrack: !!agoraHook.localVideoTrack,
            hasContainer: !!localVideoRef.current,
            isVideoEnabled: agoraHook.isVideoEnabled,
            isScreenSharing: agoraHook.isScreenSharing,
            isJoined: agoraHook.isJoined,
            isTeacher: isTeacher
        });

        if (agoraHook.localVideoTrack && localVideoRef.current && !agoraHook.isScreenSharing && agoraHook.isVideoEnabled) {
            try {
                console.log('🎥 ✅ AFFICHAGE VIDÉO LOCALE - Conditions remplies');

                // Nettoyer d'abord
                localVideoRef.current.innerHTML = '';

                // Lancer la vidéo
                agoraHook.localVideoTrack.play(localVideoRef.current);
                console.log('✅ ✅ VIDÉO LOCALE LANCÉE AVEC SUCCÈS');
            } catch (error) {
                console.error('❌ ❌ ERREUR CRITIQUE VIDÉO LOCALE:', error);
            }
        } else {
            console.log('⚠️ CONDITIONS NON REMPLIES pour vidéo locale:', {
                hasTrack: !!agoraHook.localVideoTrack,
                hasContainer: !!localVideoRef.current,
                isEnabled: agoraHook.isVideoEnabled,
                notScreenShare: !agoraHook.isScreenSharing
            });
        }
    }, [agoraHook.localVideoTrack, agoraHook.isVideoEnabled, agoraHook.isScreenSharing, agoraHook.isJoined, isTeacher]);

    // EFFET 6: Partage d'écran
    useEffect(() => {
        if (agoraHook.screenTrack && screenVideoRef.current) {
            try {
                console.log('🖥️ Affichage partage d\'écran');
                agoraHook.screenTrack.play(screenVideoRef.current);
            } catch (error) {
                console.error('❌ Erreur partage d\'écran:', error);
            }
        }
    }, [agoraHook.screenTrack]);

    // ==========================================
    // FONCTIONS MÉTIER
    // ==========================================

    const fetchSessionDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📡 API: Récupération session', memoizedSessionId);

            const response = await axios.get(`${API_URL}/api/live/session/${memoizedSessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sessionData = response.data.session;
            const participantsData = response.data.participants || [];
            const isParticipantData = response.data.isParticipant;

            console.log('✅ Données reçues:', {
                session: sessionData?.title,
                participants: participantsData.length,
                isParticipant: isParticipantData
            });

            setSession(sessionData);
            setParticipants(participantsData);
            setIsParticipant(isParticipantData);

            if (!isParticipantData) {
                console.log('⚠️ Connexion nécessaire...');
                await handleJoinSessionAPI();
            } else {
                console.log('✅ Déjà connecté, chargement messages...');
                await loadMessages();
            }

            setSessionLoaded(true);

        } catch (error) {
            console.error('❌ Erreur fetch session:', error);
            setError(error.response?.data?.error || 'Impossible de charger la session');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSessionAPI = async () => {
        try {
            console.log('🔐 Connexion API...');

            const response = await axios.post(`${API_URL}/api/live/join-session/${memoizedSessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Connexion API réussie');
            setIsParticipant(true);
            await loadMessages();

        } catch (error) {
            console.error('❌ Erreur connexion API:', error);

            if (error.response?.status === 401) {
                const password = prompt('Mot de passe requis :');
                if (password) {
                    try {
                        await axios.post(`${API_URL}/api/live/join-session/${memoizedSessionId}`,
                            { password },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setIsParticipant(true);
                        await loadMessages();
                    } catch (passwordError) {
                        setError('Mot de passe incorrect');
                    }
                }
            } else {
                setError('Impossible de rejoindre la session');
            }
        }
    };

    const loadMessages = async () => {
        try {
            console.log('💬 Chargement messages...');
            const response = await axios.get(`${API_URL}/api/live/session/${memoizedSessionId}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data || []);
        } catch (error) {
            console.warn('⚠️ Messages non disponibles:', error);
            setMessages([]);
        }
    };

    const handleRetryAgora = useCallback(async () => {
        setError(null);
        hasJoinedAgoraRef.current = false;
        isJoiningRef.current = false;
        await handleJoinAgora();
    }, [handleJoinAgora]);

    const handleSendMessage = useCallback((e) => {
        e.preventDefault();

        if (!newMessage.trim() || !isConnected || !isParticipant) {
            return;
        }

        console.log('💬 Envoi:', newMessage.trim());
        sendMessage(memoizedSessionId, newMessage.trim());
        setNewMessage('');

        setTimeout(() => {
            messageInputRef.current?.focus();
        }, 100);
    }, [newMessage, isConnected, isParticipant, sendMessage, memoizedSessionId]);

    const handleLeaveSession = useCallback(async () => {
        if (window.confirm('Êtes-vous sûr de vouloir quitter cette session ?')) {
            try {
                await agoraHook.leaveChannel();
                if (isConnected && isParticipant) {
                    leaveSession(memoizedSessionId);
                }
                navigate('/live');
            } catch (error) {
                console.error('❌ Erreur départ:', error);
                navigate('/live');
            }
        }
    }, [agoraHook.leaveChannel, isConnected, isParticipant, leaveSession, memoizedSessionId, navigate]);

    // Contrôles média - CORRIGÉS
    const handleToggleCamera = useCallback(async () => {
        console.log('🎥 TOGGLE CAMÉRA - État actuel:', {
            isVideoEnabled: agoraHook.isVideoEnabled,
            hasLocalTrack: !!agoraHook.localVideoTrack,
            isJoined: agoraHook.isJoined,
            isTeacher: isTeacher
        });

        try {
            if (agoraHook.isVideoEnabled) {
                console.log('📹 DÉSACTIVATION caméra...');
                await agoraHook.disableCamera();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `📹 ${user.name} a désactivé sa caméra`);
                }
                console.log('✅ Caméra désactivée');
            } else {
                console.log('📹 ACTIVATION caméra...');
                await agoraHook.enableCamera();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `📹 ${user.name} a activé sa caméra`);
                }
                console.log('✅ Caméra activée');
            }
        } catch (error) {
            console.error('❌ ❌ ERREUR CRITIQUE CAMÉRA:', error);
        }
    }, [agoraHook.isVideoEnabled, agoraHook.enableCamera, agoraHook.disableCamera, isConnected, isParticipant, sendMessage, memoizedSessionId, user?.name, isTeacher]);

    const handleToggleAudio = useCallback(async () => {
        console.log('🎤 TOGGLE AUDIO - État actuel:', {
            isAudioEnabled: agoraHook.isAudioEnabled,
            hasLocalAudioTrack: !!agoraHook.localAudioTrack,
            isJoined: agoraHook.isJoined,
            isMuted: agoraHook.isMuted
        });

        try {
            if (agoraHook.isAudioEnabled) {
                console.log('🔇 DÉSACTIVATION audio...');
                await agoraHook.disableAudio();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `🎤 ${user.name} a désactivé son micro`);
                }
                console.log('✅ Audio désactivé');
            } else {
                console.log('🔊 ACTIVATION audio...');
                await agoraHook.enableAudio();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `🎤 ${user.name} a activé son micro`);
                }
                console.log('✅ Audio activé');
            }
        } catch (error) {
            console.error('❌ ❌ ERREUR CRITIQUE AUDIO:', error);
        }
    }, [agoraHook.isAudioEnabled, agoraHook.enableAudio, agoraHook.disableAudio, isConnected, isParticipant, sendMessage, memoizedSessionId, user?.name]);

    const handleToggleScreenShare = useCallback(async () => {
        try {
            if (agoraHook.isScreenSharing) {
                await agoraHook.stopScreenShare();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `🖥️ ${user.name} a arrêté le partage d'écran`);
                }
            } else {
                await agoraHook.startScreenShare();
                if (isConnected && isParticipant) {
                    sendMessage(memoizedSessionId, `🖥️ ${user.name} partage son écran`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur partage d\'écran:', error);
        }
    }, [agoraHook.isScreenSharing, agoraHook.startScreenShare, agoraHook.stopScreenShare, isConnected, isParticipant, sendMessage, memoizedSessionId, user?.name]);

    // ==========================================
    // FONCTIONS UTILITAIRES
    // ==========================================

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

    const getNetworkQualityStatus = () => {
        if (agoraHook.networkQuality >= 4) return { icon: FaWifi, color: '#28a745' };
        if (agoraHook.networkQuality >= 2) return { icon: FaWifi, color: '#ffc107' };
        return { icon: FaExclamationTriangle, color: '#dc3545' };
    };

    // ==========================================
    // RENDU CONDITIONNEL
    // ==========================================

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

    const networkStatus = getNetworkQualityStatus();
    const NetworkIcon = networkStatus.icon;

    // ==========================================
    // RENDU PRINCIPAL
    // ==========================================

    return (
        <div className="live-session-container">
            {/* Header de la session */}
            <div className="session-header">
                <div className="header-left">
                    <button onClick={() => navigate('/live')} className="live-session-back-button">
                        <FaArrowLeft />
                    </button>
                    <div className="session-info">
                        <div className="session-status">
                            <div className={`status-indicator ${session?.status === 'live' ? 'live' : session?.status === 'ended' ? 'ended' : 'waiting'}`}></div>
                            <span className="status-text">
                                {session?.status === 'live' ? 'EN DIRECT' :
                                    session?.status === 'ended' ? 'TERMINÉ' :
                                        'EN ATTENTE'}
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
                    {/* Bouton Démarrer/Arrêter pour le professeur */}
                    {isTeacher && isParticipant && (
                        <div className="live-control-section">
                            {session?.status === 'waiting' && (
                                <button
                                    onClick={handleStartLive}
                                    className="start-live-btn"
                                    disabled={agoraHook.isConnecting}
                                >
                                    <FaPlay /> Démarrer le Live
                                </button>
                            )}

                            {session?.status === 'live' && (
                                <button
                                    onClick={handleStopLive}
                                    className="stop-live-btn"
                                >
                                    <FaStop /> Arrêter le Live
                                </button>
                            )}
                        </div>
                    )}

                    {/* Contrôles média - POUR TOUS LES PARTICIPANTS connectés */}
                    {isParticipant && agoraHook.isJoined && (
                        <div className="teacher-controls">
                            <button
                                onClick={handleToggleCamera}
                                className={`control-btn video-btn ${agoraHook.isVideoEnabled ? 'active' : ''}`}
                                title={agoraHook.isVideoEnabled ? 'Désactiver la caméra' : 'Activer la caméra'}
                                disabled={agoraHook.isConnecting}
                            >
                                {agoraHook.isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                            </button>

                            <button
                                onClick={handleToggleAudio}
                                className={`control-btn audio-btn ${agoraHook.isAudioEnabled ? 'active' : ''}`}
                                title={agoraHook.isAudioEnabled ? 'Désactiver le micro' : 'Activer le micro'}
                                disabled={agoraHook.isConnecting}
                            >
                                {agoraHook.isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                            </button>

                            {agoraHook.isAudioEnabled && (
                                <button
                                    onClick={agoraHook.toggleMute}
                                    className={`control-btn mute-btn ${agoraHook.isMuted ? 'muted' : ''}`}
                                    title={agoraHook.isMuted ? 'Réactiver le son' : 'Couper le son'}
                                >
                                    {agoraHook.isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>
                            )}

                            {/* Partage d'écran - seulement pour le professeur */}
                            {isTeacher && (
                                <button
                                    onClick={handleToggleScreenShare}
                                    className={`control-btn screen-btn ${agoraHook.isScreenSharing ? 'active' : ''}`}
                                    title={agoraHook.isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
                                    disabled={agoraHook.isConnecting || !agoraHook.isJoined}
                                >
                                    {agoraHook.isScreenSharing ? <FaStop /> : <FaDesktop />}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="connection-status">
                        <div className={`status-indicator ${isConnected && agoraHook.isJoined ? 'connected' : 'disconnected'}`}></div>
                        <span>{isConnected && agoraHook.isJoined ? 'Connecté' : 'Déconnecté'}</span>
                        <NetworkIcon style={{ color: networkStatus.color, marginLeft: '8px' }} />
                    </div>

                    <div className="participants-count">
                        <FaUsers />
                        <span>{participants.length + agoraHook.remoteUsers.length}</span>
                    </div>

                    <button onClick={handleLeaveSession} className="leave-button">
                        <FaSignOutAlt />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Messages d'erreur */}
            {(agoraHook.connectionError || error) && (
                <div className="error-banner">
                    <FaExclamationTriangle />
                    <span>{agoraHook.connectionError || error}</span>
                    {agoraHook.connectionError && (
                        <button onClick={handleRetryAgora} className="retry-connection-btn">
                            <FaRedo /> Réessayer
                        </button>
                    )}
                </div>
            )}

            {/* NOUVEAU: Bannière pour débloquer l'audio */}
            {agoraHook.audioAutoplayBlocked && (
                <div className="error-banner" style={{ background: 'linear-gradient(45deg, #ff9800, #f57c00)' }}>
                    <FaPlayCircle />
                    <span>Son bloqué par le navigateur. Cliquez pour activer l'audio.</span>
                    <button onClick={handleEnableAudioPlayback} className="retry-connection-btn">
                        <FaPlayCircle /> Activer le son
                    </button>
                </div>
            )}

            {/* Contenu principal avec disposition améliorée */}
            <div className="session-content">

                {/* Zone principale - Vidéo + Chat */}
                <div className="main-content">

                    {/* Zone vidéo/présentation - LOGIQUE CORRIGÉE */}
                    <div className="video-section">
                        <div className="main-video-container">
                            <div className="video-display-area">
                                {agoraHook.isScreenSharing && agoraHook.screenTrack ? (
                                    /* Partage d'écran */
                                    <div className="screen-share-container">
                                        <div ref={screenVideoRef} className="screen-video" />
                                        <div className="video-overlay">
                                            🖥️ Partage d'écran - {user?.name}
                                        </div>
                                    </div>
                                ) : (
                                    /* Zone vidéo CORRIGÉE */
                                    <div className="video-streams-container">

                                        {/* PROFESSEUR - Voit SA caméra */}
                                        {isTeacher && (
                                            <div className="teacher-own-video">
                                                <div
                                                    ref={localVideoRef}
                                                    className="video-element"
                                                    style={{
                                                        width: '100%',
                                                        height: '400px',
                                                        background: '#000',
                                                        borderRadius: '12px'
                                                    }}
                                                />
                                                {!agoraHook.isVideoEnabled && (
                                                    <div className="video-placeholder-overlay">
                                                        <div className="video-placeholder-icon">
                                                            <FaVideo size={60} />
                                                        </div>
                                                        <h3>👨‍🏫 Vous (Professeur)</h3>
                                                        <p>Activez votre caméra pour que les élèves vous voient</p>
                                                        <button
                                                            onClick={handleToggleCamera}
                                                            className="activate-camera-btn"
                                                        >
                                                            <FaVideo /> Activer la caméra
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="video-overlay">
                                                    👨‍🏫 Vous (Professeur) - Les élèves vous voient
                                                    {agoraHook.isAudioEnabled ? (agoraHook.isMuted ? ' 🔇' : ' 🎤') : ' 🔇'}
                                                </div>
                                            </div>
                                        )}

                                        {/* ÉLÈVE - Voit le PROFESSEUR - CORRIGÉ */}
                                        {!isTeacher && (
                                            <div className="student-sees-teacher">
                                                {agoraHook.remoteUsers.length > 0 ? (
                                                    /* Il y a un professeur connecté */
                                                    <div className="teacher-video-for-student">
                                                        {(() => {
                                                            // Trouver le professeur avec vidéo
                                                            const teacherWithVideo = agoraHook.remoteUsers.find(u => u.hasVideo && u.videoTrack);

                                                            if (teacherWithVideo) {
                                                                console.log('✅ PROFESSEUR AVEC VIDÉO TROUVÉ:', teacherWithVideo.uid);
                                                                return (
                                                                    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                                                                        <RemoteVideoDisplay
                                                                            user={teacherWithVideo}
                                                                            isMain={true}
                                                                        />
                                                                        <div className="video-overlay">
                                                                            👨‍🏫 Professeur {teacherWithVideo.uid}
                                                                            {teacherWithVideo.hasAudio ? ' 🎤' : ' 🔇'}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                // Professeur connecté mais pas de vidéo
                                                                const anyTeacher = agoraHook.remoteUsers[0];
                                                                console.log('⚠️ PROFESSEUR SANS VIDÉO:', anyTeacher?.uid);
                                                                return (
                                                                    <div style={{
                                                                        width: '100%',
                                                                        height: '400px',
                                                                        background: '#1a1a1a',
                                                                        borderRadius: '12px',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: 'white',
                                                                        position: 'relative'
                                                                    }}>
                                                                        <FaVideo style={{ fontSize: '60px', marginBottom: '20px', color: '#666' }} />
                                                                        <h3>👨‍🏫 Professeur connecté</h3>
                                                                        <p>En attente que le professeur active sa caméra...</p>
                                                                        {anyTeacher && (
                                                                            <div className="video-overlay">
                                                                                👨‍🏫 Prof {anyTeacher.uid} (caméra éteinte)
                                                                                {anyTeacher.hasAudio ? ' 🎤' : ' 🔇'}
                                                                            </div>
                                                                        )}

                                                                        {/* IMPORTANT: Container caché pour la vidéo quand elle arrive */}
                                                                        {anyTeacher && (
                                                                            <div
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    opacity: 0,
                                                                                    pointerEvents: 'none'
                                                                                }}
                                                                            >
                                                                                <RemoteVideoDisplay
                                                                                    user={anyTeacher}
                                                                                    isMain={true}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                ) : (
                                                    /* Pas de professeur */
                                                    <div className="waiting-for-teacher-simple">
                                                        <div style={{
                                                            width: '100%',
                                                            height: '400px',
                                                            background: '#1a1a1a',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <FaVideo style={{ fontSize: '60px', marginBottom: '20px', color: '#666' }} />
                                                            <h3>En attente du professeur...</h3>
                                                            <p>Le professeur va bientôt se connecter</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* MINIATURE - SA propre caméra si activée */}
                                                {agoraHook.localVideoTrack && agoraHook.isVideoEnabled && (
                                                    <div className="self-video-miniature" style={{
                                                        position: 'absolute',
                                                        top: '20px',
                                                        right: '20px',
                                                        width: '200px',
                                                        height: '150px',
                                                        background: '#000',
                                                        borderRadius: '8px',
                                                        border: '2px solid #fff',
                                                        zIndex: 10
                                                    }}>
                                                        <div
                                                            ref={localVideoRef}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                borderRadius: '6px'
                                                            }}
                                                        />
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '5px',
                                                            left: '5px',
                                                            background: 'rgba(0,0,0,0.8)',
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px'
                                                        }}>
                                                            Vous
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Debug AMÉLIORÉ - TOUJOURS VISIBLE */}
                                <div className="debug-simple" style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'rgba(0, 0, 0, 0.9)',
                                    color: 'white',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    zIndex: 20,
                                    fontFamily: 'monospace',
                                    minWidth: '180px'
                                }}>
                                    <strong>{isTeacher ? '👨‍🏫 PROF' : '👤 ÉLÈVE'}</strong><br/>
                                    Agora: {agoraHook.isJoined ? '✅' : '❌'}<br/>
                                    {isTeacher ? (
                                        <>
                                            Ma caméra: {agoraHook.isVideoEnabled ? '✅' : '❌'}<br/>
                                            Mon micro: {agoraHook.isAudioEnabled ? '✅' : '❌'}<br/>
                                            Muté: {agoraHook.isMuted ? '🔇' : '🔊'}<br/>
                                            Élèves: {agoraHook.remoteUsers.length}<br/>
                                            {agoraHook.remoteUsers.map((u, i) => (
                                                <span key={u.uid}>
                                                    E{i+1}: V{u.hasVideo ? '✅' : '❌'} A{u.hasAudio ? '✅' : '❌'}<br/>
                                                </span>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            Prof connecté: {agoraHook.remoteUsers.length > 0 ? '✅' : '❌'}<br/>
                                            {agoraHook.remoteUsers.length > 0 && (
                                                <>
                                                    Vidéo prof: {agoraHook.remoteUsers.some(u => u.hasVideo && u.videoTrack) ? '✅' : '❌'}<br/>
                                                    Audio prof: {agoraHook.remoteUsers.some(u => u.hasAudio && u.audioTrack) ? '✅' : '❌'}<br/>
                                                    Prof UID: {agoraHook.remoteUsers[0]?.uid}<br/>
                                                </>
                                            )}
                                            Ma caméra: {agoraHook.isVideoEnabled ? '✅' : '❌'}<br/>
                                            Mon micro: {agoraHook.isAudioEnabled ? '✅' : '❌'}
                                        </>
                                    )}
                                    {agoraHook.connectionError && (
                                        <div style={{ color: '#ff4444', marginTop: '5px' }}>
                                            ❌ {agoraHook.connectionError}
                                        </div>
                                    )}
                                    {agoraHook.audioAutoplayBlocked && (
                                        <div style={{ color: '#ff9800', marginTop: '5px' }}>
                                            🔊 Audio bloqué
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CORRECTION MAJEURE: Vidéos des participants distants - AFFICHAGE CORRIGÉ */}
                            {agoraHook.remoteUsers.length > 0 && (
                                <div className="secondary-videos">
                                    <h4>
                                        {isTeacher
                                            ? `Élèves connectés (${agoraHook.remoteUsers.length})`
                                            : `Autres participants (${agoraHook.remoteUsers.length > 1 ? agoraHook.remoteUsers.length - 1 : 0})`
                                        }
                                    </h4>
                                    <div className="remote-videos-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: '12px',
                                        marginTop: '12px'
                                    }}>
                                        {isTeacher ? (
                                            /* PROFESSEUR: Affiche TOUS les élèves */
                                            agoraHook.remoteUsers.map((remoteUser) => (
                                                <div key={remoteUser.uid} className="secondary-video-item">
                                                    <div className="secondary-video-container">
                                                        {remoteUser.hasVideo && remoteUser.videoTrack ? (
                                                            <RemoteVideoDisplay user={remoteUser} />
                                                        ) : (
                                                            <div className="video-placeholder-secondary" style={{
                                                                width: '100%',
                                                                height: '120px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: '#1a1a1a',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <FaVideo size={20} style={{ color: '#666' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="secondary-video-label">
                                                        👤 Élève {remoteUser.uid}
                                                        {remoteUser.hasAudio ? ' 🎤' : ' 🔇'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            /* ÉLÈVE: Affiche les autres élèves (pas le prof qui est en grand) */
                                            agoraHook.remoteUsers.slice(1).map((remoteUser) => (
                                                <div key={remoteUser.uid} className="secondary-video-item">
                                                    <div className="secondary-video-container">
                                                        {remoteUser.hasVideo && remoteUser.videoTrack ? (
                                                            <RemoteVideoDisplay user={remoteUser} />
                                                        ) : (
                                                            <div className="video-placeholder-secondary" style={{
                                                                width: '100%',
                                                                height: '120px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: '#1a1a1a',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <FaVideo size={20} style={{ color: '#666' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="secondary-video-label">
                                                        👤 Participant {remoteUser.uid}
                                                        {remoteUser.hasAudio ? ' 🎤' : ' 🔇'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="chat-section">
                        <div className="chat-header">
                            <h3>💬 Chat de la session</h3>
                            <div className="chat-status">
                                <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
                                <span>{isConnected ? 'En ligne' : 'Hors ligne'}</span>
                            </div>
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
                                                        <img src={`${API_URL}/uploads/${message.profile_picture}`} alt={message.user_name} />
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
                                        !isParticipant ? "Rejoindre la session..." :
                                            !isConnected ? "Chat hors ligne..." :
                                                "Tapez votre message..."
                                    }
                                    className="chat-input"
                                    maxLength={500}
                                    disabled={!isConnected || !isParticipant}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={!newMessage.trim() || !isConnected || !isParticipant}
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                            <div className="chat-status-footer">
                                {!isParticipant && <span className="status-connecting">📝 Rejoindre la session...</span>}
                                {!isConnected && isParticipant && <span className="status-offline">❌ Chat déconnecté</span>}
                                {isConnected && !agoraHook.isJoined && <span className="status-connecting">🔄 Connexion vidéo...</span>}
                                {isConnected && agoraHook.isJoined && isParticipant && <span className="status-online">✅ En ligne</span>}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar - Participants */}
                <div className="participants-sidebar">
                    <div className="participants-header">
                        <FaUsers />
                        <span>Participants ({participants.length})</span>
                    </div>
                    <div className="participants-list">
                        {participants.map(participant => (
                            <div key={participant.user_id} className={`participant ${participant.role}`}>
                                <div className="participant-avatar">
                                    {participant.profile_picture ? (
                                        <img src={`${API_URL}/uploads/${participant.profile_picture}`} alt={participant.user_name} />
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
        </div>
    );
}

export default LiveSession;