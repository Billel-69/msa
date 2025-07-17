import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

// Configuration optimisée pour la France et l'international
const ICE_SERVERS = [
    // Serveurs Google STUN (fiables mondialement)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // Serveurs STUN européens
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.fwdnet.net' },
    { urls: 'stun:stun.ideasip.com' },

    // Serveurs TURN publics (si disponibles)
    // Note: Pour la production, utilisez vos propres serveurs TURN
];

const MEDIA_CONSTRAINTS = {
    video: {
        width: { min: 320, ideal: 1280, max: 1920 },
        height: { min: 240, ideal: 720, max: 1080 },
        frameRate: { min: 10, ideal: 30, max: 60 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 44100 },
        channelCount: { ideal: 2 }
    },
    screen: {
        video: {
            cursor: 'always',
            frameRate: { ideal: 30, max: 60 },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
        }
    }
};

const PC_CONFIG = {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
};

export function useWebRTC(apiUrl, token, sessionId, userId, isTeacher = false) {
    // États
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [mediaState, setMediaState] = useState({
        video: false,
        audio: false,
        screen: false,
        muted: false
    });
    const [error, setError] = useState(null);
    const [participants, setParticipants] = useState([]);

    // Refs
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const localVideoRef = useRef(null);
    const localScreenRef = useRef(null);
    const remoteVideosRef = useRef(new Map());
    const reconnectTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    // Fonction de nettoyage
    const cleanup = useCallback(() => {
        console.log('🧹 WebRTC Cleanup...');

        // Arrêter les flux locaux
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log('🔴 Local track stopped:', track.kind);
            });
            setLocalStream(null);
        }

        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
                console.log('🔴 Screen track stopped:', track.kind);
            });
            setScreenStream(null);
        }

        // Fermer toutes les connexions peer
        peerConnectionsRef.current.forEach((pc, id) => {
            try {
                pc.close();
                console.log('🔴 PeerConnection closed:', id);
            } catch (error) {
                console.error('Error closing PeerConnection:', error);
            }
        });
        peerConnectionsRef.current.clear();

        // Déconnecter le socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            console.log('🔴 Socket disconnected');
        }

        // Nettoyer les timeouts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Réinitialiser les états
        setIsConnected(false);
        setConnectionState('disconnected');
        setRemoteStreams(new Map());
        setMediaState({
            video: false,
            audio: false,
            screen: false,
            muted: false
        });
        setError(null);
        retryCountRef.current = 0;
    }, [localStream, screenStream]);

    // Initialiser le socket
    const initializeSocket = useCallback(() => {
        if (socketRef.current?.connected) {
            console.log('Socket already connected');
            return;
        }

        try {
            console.log('🔌 Initializing WebRTC socket...');

            const socket = io(apiUrl, {
                auth: { token, sessionId, userId },
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socketRef.current = socket;

            // Événements de connexion
            socket.on('connect', () => {
                console.log('✅ WebRTC Socket connected');
                setIsConnected(true);
                setConnectionState('connected');
                setError(null);
                retryCountRef.current = 0;

                // Rejoindre la session WebRTC
                socket.emit('join-webrtc-session', {
                    sessionId,
                    userId,
                    isTeacher,
                    mediaState
                });
            });

            socket.on('disconnect', (reason) => {
                console.log('❌ WebRTC Socket disconnected:', reason);
                setIsConnected(false);
                setConnectionState('disconnected');

                // Tentative de reconnexion automatique
                if (reason === 'io server disconnect') {
                    // Déconnexion serveur, reconnexion manuelle
                    attemptReconnection();
                }
            });

            socket.on('connect_error', (error) => {
                console.error('❌ WebRTC Socket connection error:', error);
                setError(`Erreur de connexion: ${error.message}`);
                setConnectionState('error');
                attemptReconnection();
            });

            // Événements WebRTC
            socket.on('webrtc-offer', handleOffer);
            socket.on('webrtc-answer', handleAnswer);
            socket.on('webrtc-ice-candidate', handleIceCandidate);
            socket.on('participant-joined', handleParticipantJoined);
            socket.on('participant-left', handleParticipantLeft);
            socket.on('media-state-changed', handleMediaStateChanged);
            socket.on('session-participants', handleSessionParticipants);

        } catch (error) {
            console.error('❌ Error initializing socket:', error);
            setError('Impossible d\'initialiser la connexion WebRTC');
        }
    }, [apiUrl, token, sessionId, userId, isTeacher, mediaState]);

    // Tentative de reconnexion
    const attemptReconnection = useCallback(() => {
        if (retryCountRef.current >= 5) {
            console.log('❌ Max reconnection attempts reached');
            setError('Impossible de se reconnecter. Veuillez rafraîchir la page.');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        console.log(`🔄 Reconnection attempt ${retryCountRef.current + 1} in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            if (socketRef.current) {
                socketRef.current.connect();
            } else {
                initializeSocket();
            }
        }, delay);
    }, [initializeSocket]);

    // Créer une PeerConnection
    const createPeerConnection = useCallback((targetId, targetName) => {
        console.log('🔗 Creating PeerConnection for:', targetName);

        const pc = new RTCPeerConnection(PC_CONFIG);

        // Gérer les candidats ICE
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('webrtc-ice-candidate', {
                    candidate: event.candidate,
                    targetId,
                    sessionId
                });
            }
        };

        // Gérer les flux distants
        pc.ontrack = (event) => {
            console.log('📺 Remote stream received from:', targetName);
            const [remoteStream] = event.streams;

            setRemoteStreams(prev => new Map(prev.set(targetId, {
                stream: remoteStream,
                name: targetName,
                id: targetId
            })));

            // Mettre à jour la ref pour l'accès direct
            if (remoteVideosRef.current) {
                remoteVideosRef.current.set(targetId, remoteStream);
            }
        };

        // Gérer les changements d'état
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`🔄 Connection state changed to ${state} for ${targetName}`);

            if (state === 'connected') {
                setConnectionState('streaming');
            } else if (state === 'failed') {
                console.log('❌ Connection failed for:', targetName);
                // Tentative de reconnexion après un délai
                setTimeout(() => {
                    if (isTeacher) {
                        initiateConnection(targetId, targetName);
                    }
                }, 3000);
            } else if (state === 'disconnected') {
                console.log('🔌 Connection disconnected for:', targetName);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetId);
                    return newMap;
                });
            }
        };

        // Ajouter les flux locaux existants
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log('➕ Added local track:', track.kind);
            });
        }

        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                pc.addTrack(track, screenStream);
                console.log('➕ Added screen track:', track.kind);
            });
        }

        peerConnectionsRef.current.set(targetId, pc);
        return pc;
    }, [localStream, screenStream, isTeacher, sessionId]);

    // Initier une connexion
    const initiateConnection = useCallback(async (targetId, targetName) => {
        if (!isTeacher || !socketRef.current) return;

        console.log('🚀 Initiating connection to:', targetName);

        try {
            const pc = createPeerConnection(targetId, targetName);
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await pc.setLocalDescription(offer);

            socketRef.current.emit('webrtc-offer', {
                offer,
                targetId,
                sessionId,
                fromName: 'Professeur'
            });

            console.log('✅ Offer sent to:', targetName);
        } catch (error) {
            console.error('❌ Error initiating connection:', error);
            setError(`Erreur de connexion avec ${targetName}`);
        }
    }, [isTeacher, createPeerConnection, sessionId]);

    // Gestionnaires d'événements WebRTC
    const handleOffer = useCallback(async (data) => {
        const { offer, fromId, fromName, sessionId: offerSessionId } = data;

        if (offerSessionId !== sessionId) return;

        console.log('📨 Received offer from:', fromName);

        try {
            const pc = createPeerConnection(fromId, fromName);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (socketRef.current) {
                socketRef.current.emit('webrtc-answer', {
                    answer,
                    targetId: fromId,
                    sessionId
                });
            }

            console.log('✅ Answer sent to:', fromName);
        } catch (error) {
            console.error('❌ Error handling offer:', error);
            setError(`Erreur lors de l'acceptation de l'offre de ${fromName}`);
        }
    }, [sessionId, createPeerConnection]);

    const handleAnswer = useCallback(async (data) => {
        const { answer, fromId, fromName } = data;

        console.log('📨 Received answer from:', fromName);

        try {
            const pc = peerConnectionsRef.current.get(fromId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('✅ Answer processed for:', fromName);
            }
        } catch (error) {
            console.error('❌ Error handling answer:', error);
        }
    }, []);

    const handleIceCandidate = useCallback(async (data) => {
        const { candidate, fromId, fromName } = data;

        try {
            const pc = peerConnectionsRef.current.get(fromId);
            if (pc && candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('🧊 ICE candidate added for:', fromName);
            }
        } catch (error) {
            console.error('❌ Error adding ICE candidate:', error);
        }
    }, []);

    const handleParticipantJoined = useCallback((data) => {
        console.log('👋 Participant joined:', data.name);
        setParticipants(prev => {
            const exists = prev.some(p => p.id === data.id);
            if (!exists) {
                return [...prev, data];
            }
            return prev;
        });

        // Si je suis le professeur, initier une connexion
        if (isTeacher && data.id !== userId) {
            setTimeout(() => {
                initiateConnection(data.id, data.name);
            }, 1000);
        }
    }, [isTeacher, userId, initiateConnection]);

    const handleParticipantLeft = useCallback((data) => {
        console.log('👋 Participant left:', data.name);
        setParticipants(prev => prev.filter(p => p.id !== data.id));

        // Nettoyer la connexion
        const pc = peerConnectionsRef.current.get(data.id);
        if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(data.id);
        }

        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.id);
            return newMap;
        });
    }, []);

    const handleMediaStateChanged = useCallback((data) => {
        console.log('📻 Media state changed:', data);
        setParticipants(prev => prev.map(p =>
            p.id === data.userId
                ? { ...p, mediaState: data.mediaState }
                : p
        ));
    }, []);

    const handleSessionParticipants = useCallback((data) => {
        console.log('👥 Session participants:', data);
        setParticipants(data.participants || []);
    }, []);

    // Contrôles média
    const toggleVideo = useCallback(async () => {
        try {
            if (!mediaState.video) {
                console.log('📹 Starting video...');

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: MEDIA_CONSTRAINTS.video,
                    audio: false
                });

                setLocalStream(prevStream => {
                    if (prevStream) {
                        // Combiner avec le flux existant
                        const newStream = new MediaStream([
                            ...stream.getVideoTracks(),
                            ...prevStream.getAudioTracks()
                        ]);
                        return newStream;
                    }
                    return stream;
                });

                setMediaState(prev => ({ ...prev, video: true }));

                // Ajouter aux connexions existantes
                peerConnectionsRef.current.forEach((pc) => {
                    stream.getVideoTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });
                });

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('media-state-changed', {
                        sessionId,
                        userId,
                        mediaState: { video: true }
                    });
                }

                console.log('✅ Video started');
            } else {
                console.log('🔴 Stopping video...');

                if (localStream) {
                    localStream.getVideoTracks().forEach(track => {
                        track.stop();
                    });

                    // Créer un nouveau flux sans vidéo
                    const newStream = new MediaStream(localStream.getAudioTracks());
                    setLocalStream(newStream.getTracks().length > 0 ? newStream : null);
                }

                setMediaState(prev => ({ ...prev, video: false }));

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('media-state-changed', {
                        sessionId,
                        userId,
                        mediaState: { video: false }
                    });
                }

                console.log('✅ Video stopped');
            }
        } catch (error) {
            console.error('❌ Error toggling video:', error);

            if (error.name === 'NotAllowedError') {
                setError('Permission caméra refusée');
            } else if (error.name === 'NotFoundError') {
                setError('Aucune caméra trouvée');
            } else {
                setError('Erreur caméra: ' + error.message);
            }
        }
    }, [mediaState.video, localStream, sessionId, userId]);

    const toggleAudio = useCallback(async () => {
        try {
            if (!mediaState.audio) {
                console.log('🎤 Starting audio...');

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: MEDIA_CONSTRAINTS.audio,
                    video: false
                });

                setLocalStream(prevStream => {
                    if (prevStream) {
                        const newStream = new MediaStream([
                            ...prevStream.getVideoTracks(),
                            ...stream.getAudioTracks()
                        ]);
                        return newStream;
                    }
                    return stream;
                });

                setMediaState(prev => ({ ...prev, audio: true, muted: false }));

                // Ajouter aux connexions existantes
                peerConnectionsRef.current.forEach((pc) => {
                    stream.getAudioTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });
                });

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('media-state-changed', {
                        sessionId,
                        userId,
                        mediaState: { audio: true, muted: false }
                    });
                }

                console.log('✅ Audio started');
            } else {
                console.log('🔇 Stopping audio...');

                if (localStream) {
                    localStream.getAudioTracks().forEach(track => {
                        track.stop();
                    });

                    const newStream = new MediaStream(localStream.getVideoTracks());
                    setLocalStream(newStream.getTracks().length > 0 ? newStream : null);
                }

                setMediaState(prev => ({ ...prev, audio: false, muted: true }));

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('media-state-changed', {
                        sessionId,
                        userId,
                        mediaState: { audio: false, muted: true }
                    });
                }

                console.log('✅ Audio stopped');
            }
        } catch (error) {
            console.error('❌ Error toggling audio:', error);

            if (error.name === 'NotAllowedError') {
                setError('Permission microphone refusée');
            } else {
                setError('Erreur microphone: ' + error.message);
            }
        }
    }, [mediaState.audio, localStream, sessionId, userId]);

    const toggleScreenShare = useCallback(async () => {
        try {
            if (!mediaState.screen) {
                console.log('🖥️ Starting screen share...');

                const stream = await navigator.mediaDevices.getDisplayMedia(MEDIA_CONSTRAINTS.screen);

                setScreenStream(stream);
                setMediaState(prev => ({ ...prev, screen: true }));

                // Ajouter aux connexions existantes
                peerConnectionsRef.current.forEach((pc) => {
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });
                });

                // Gérer l'arrêt automatique
                stream.getVideoTracks()[0].onended = () => {
                    console.log('🛑 Screen share ended by user');
                    setScreenStream(null);
                    setMediaState(prev => ({ ...prev, screen: false }));

                    if (socketRef.current) {
                        socketRef.current.emit('screen-share-stopped', {
                            sessionId,
                            userId
                        });
                    }
                };

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('screen-share-started', {
                        sessionId,
                        userId
                    });
                }

                console.log('✅ Screen share started');
            } else {
                console.log('🛑 Stopping screen share...');

                if (screenStream) {
                    screenStream.getTracks().forEach(track => {
                        track.stop();
                    });
                }

                setScreenStream(null);
                setMediaState(prev => ({ ...prev, screen: false }));

                // Notifier les autres participants
                if (socketRef.current) {
                    socketRef.current.emit('screen-share-stopped', {
                        sessionId,
                        userId
                    });
                }

                console.log('✅ Screen share stopped');
            }
        } catch (error) {
            console.error('❌ Error toggling screen share:', error);

            if (error.name === 'NotAllowedError') {
                setError('Permission partage d\'écran refusée');
            } else {
                setError('Erreur partage d\'écran: ' + error.message);
            }
        }
    }, [mediaState.screen, screenStream, sessionId, userId]);

    // Initialisation
    useEffect(() => {
        if (apiUrl && token && sessionId && userId) {
            initializeSocket();
        }

        return cleanup;
    }, [apiUrl, token, sessionId, userId, initializeSocket, cleanup]);

    // Mise à jour des refs vidéo
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (localScreenRef.current && screenStream) {
            localScreenRef.current.srcObject = screenStream;
        }
    }, [screenStream]);

    // API publique
    return {
        // États
        isConnected,
        connectionState,
        localStream,
        screenStream,
        remoteStreams,
        mediaState,
        error,
        participants,

        // Refs pour les éléments vidéo
        localVideoRef,
        localScreenRef,
        remoteVideosRef,

        // Contrôles
        toggleVideo,
        toggleAudio,
        toggleScreenShare,

        // Utilitaires
        cleanup,
        clearError: () => setError(null),
        reconnect: () => {
            cleanup();
            setTimeout(initializeSocket, 1000);
        }
    };
}