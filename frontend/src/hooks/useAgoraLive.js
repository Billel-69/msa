// Fichier: src/hooks/useAgoraLive.js
// VERSION COMPLÈTEMENT CORRIGÉE - Audio/Vidéo bidirectionnel

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { getAgoraAppId, generateUID, generateChannelName } from '../config/agora';

export const useAgoraLive = (sessionId, user, isTeacher = false) => {
    // IMPORTANT: Mémoriser les paramètres pour éviter les recréations
    const memoizedSessionId = useMemo(() => sessionId, [sessionId]);
    const memoizedUserId = useMemo(() => user?.id, [user?.id]);
    const memoizedIsTeacher = useMemo(() => Boolean(isTeacher), [isTeacher]);

    // LOG UNIQUE
    const loggedRef = useRef(false);
    if (!loggedRef.current) {
        console.log('🎬 useAgoraLive - INITIALISATION UNIQUE', {
            sessionId: memoizedSessionId,
            userId: memoizedUserId,
            isTeacher: memoizedIsTeacher
        });
        loggedRef.current = true;
    }

    // Client Agora - CRÉÉ UNE SEULE FOIS
    const clientRef = useRef(null);
    const [clientReady, setClientReady] = useState(false);

    // États des tracks locaux
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [screenTrack, setScreenTrack] = useState(null);

    // États des utilisateurs distants
    const [remoteUsers, setRemoteUsers] = useState([]);

    // États de connexion
    const [isJoined, setIsJoined] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    // États des contrôles
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Statistiques
    const [networkQuality, setNetworkQuality] = useState(0);
    const [participantCount, setParticipantCount] = useState(0);

    // Refs pour éviter les doublons
    const isJoiningRef = useRef(false);
    const localUidRef = useRef(null);
    const eventsConfiguredRef = useRef(false);

    // Nom du canal généré une seule fois
    const channelName = useMemo(() => {
        return memoizedSessionId ? generateChannelName(memoizedSessionId) : null;
    }, [memoizedSessionId]);

    // ==========================================
    // CRÉATION DU CLIENT AGORA - OPTIMISÉ
    // ==========================================

    useEffect(() => {
        if (clientRef.current || !memoizedSessionId) return;

        console.log('🔧 Création client Agora UNIQUE...');

        try {
            // Configuration debug
            if (process.env.NODE_ENV === 'development') {
                AgoraRTC.setLogLevel(4);
            } else {
                AgoraRTC.setLogLevel(2);
            }

            // CONFIGURATION OPTIMISÉE pour audio/vidéo bidirectionnels
            const client = AgoraRTC.createClient({
                mode: 'rtc',
                codec: 'vp8',                    // VP8 plus stable
                role: 'host'                     // IMPORTANT: Tout le monde en host pour bidirectionnalité
            });

            // PARAMÈTRES GLOBAUX pour améliorer la qualité
            try {
                AgoraRTC.setParameter('AUDIO_VOLUME', 100);
                AgoraRTC.setParameter('AUDIO_PROFILE', 'music_standard');
            } catch (paramError) {
                console.warn('⚠️ Paramètres globaux non supportés:', paramError);
            }

            clientRef.current = client;
            setClientReady(true);
            console.log('✅ Client Agora créé avec succès - Configuration optimisée');

        } catch (error) {
            console.error('❌ Erreur création client Agora:', error);
        }

        // Cleanup lors du démontage
        return () => {
            if (clientRef.current) {
                console.log('🧹 Nettoyage client Agora...');
                try {
                    clientRef.current.removeAllListeners();
                    clientRef.current = null;
                } catch (error) {
                    console.error('Erreur nettoyage client:', error);
                }
            }
        };
    }, [memoizedSessionId]);

    // ==========================================
    // CONFIGURATION DES ÉVÉNEMENTS AGORA
    // ==========================================

    useEffect(() => {
        if (!clientRef.current || !clientReady || eventsConfiguredRef.current) {
            return;
        }

        console.log('🔧 Configuration événements Agora UNIQUE...');
        eventsConfiguredRef.current = true;

        const client = clientRef.current;

        // Événement: Utilisateur publié - CORRIGÉ POUR BIDIRECTIONNALITÉ
        const handleUserPublished = async (remoteUser, mediaType) => {
            try {
                console.log('👤 User published:', remoteUser.uid, mediaType);

                await client.subscribe(remoteUser, mediaType);
                console.log('✅ Subscribed to', remoteUser.uid, mediaType);

                // CORRECTION CRITIQUE: Forcer la lecture audio pour TOUS (pas seulement élèves)
                if (mediaType === 'audio' && remoteUser.audioTrack) {
                    try {
                        console.log('🔊 FORCER LECTURE AUDIO - BIDIRECTIONNELLE pour:', remoteUser.uid);

                        // Régler le volume à 100%
                        remoteUser.audioTrack.setVolume(100);

                        // Forcer la lecture avec retry
                        try {
                            await remoteUser.audioTrack.play();
                            console.log('✅ Audio en lecture bidirectionnelle pour:', remoteUser.uid);
                        } catch (playError) {
                            console.warn('⚠️ Premier essai audio échoué, retry...', playError);
                            setTimeout(async () => {
                                try {
                                    await remoteUser.audioTrack.play();
                                    console.log('✅ Audio retry réussi pour:', remoteUser.uid);
                                } catch (retryError) {
                                    console.error('❌ Audio retry échoué:', retryError);
                                }
                            }, 500);
                        }

                    } catch (audioError) {
                        console.error('❌ Erreur configuration audio:', audioError);
                    }
                }

                // Préparer la vidéo
                if (mediaType === 'video' && remoteUser.videoTrack) {
                    console.log('🎥 Vidéo distante prête pour:', remoteUser.uid);
                }

                setRemoteUsers(prevUsers => {
                    const userIndex = prevUsers.findIndex(u => u.uid === remoteUser.uid);

                    if (userIndex !== -1) {
                        const updatedUsers = [...prevUsers];
                        updatedUsers[userIndex] = {
                            ...updatedUsers[userIndex],
                            [mediaType + 'Track']: remoteUser[mediaType + 'Track'],
                            hasVideo: mediaType === 'video' ? true : updatedUsers[userIndex].hasVideo,
                            hasAudio: mediaType === 'audio' ? true : updatedUsers[userIndex].hasAudio
                        };
                        return updatedUsers;
                    } else {
                        return [...prevUsers, {
                            uid: remoteUser.uid,
                            [mediaType + 'Track']: remoteUser[mediaType + 'Track'],
                            hasVideo: mediaType === 'video',
                            hasAudio: mediaType === 'audio',
                            joinTime: new Date(),
                            name: `Participant ${remoteUser.uid}`
                        }];
                    }
                });

            } catch (error) {
                console.error('❌ Erreur souscription:', error);
            }
        };

        const handleUserUnpublished = (remoteUser, mediaType) => {
            console.log('👤 User unpublished:', remoteUser.uid, mediaType);

            setRemoteUsers(prevUsers =>
                prevUsers.map(user =>
                    user.uid === remoteUser.uid
                        ? {
                            ...user,
                            [mediaType + 'Track']: null,
                            hasVideo: mediaType === 'video' ? false : user.hasVideo,
                            hasAudio: mediaType === 'audio' ? false : user.hasAudio
                        }
                        : user
                )
            );
        };

        const handleUserJoined = (remoteUser) => {
            console.log('👋 User joined:', remoteUser.uid);
            setParticipantCount(prev => prev + 1);
        };

        const handleUserLeft = (remoteUser, reason) => {
            console.log('👋 User left:', remoteUser.uid, reason);

            setRemoteUsers(prevUsers =>
                prevUsers.filter(user => user.uid !== remoteUser.uid)
            );
            setParticipantCount(prev => Math.max(0, prev - 1));
        };

        const handleNetworkQuality = (stats) => {
            setNetworkQuality(stats.uplinkNetworkQuality || 0);
        };

        const handleConnectionStateChange = (currentState, prevState, reason) => {
            console.log('🔗 Connection state:', currentState, 'reason:', reason);

            if (currentState === 'DISCONNECTED') {
                if (reason && reason.includes('LEAVE')) {
                    console.log('✅ Normal disconnection (user left)');
                    setConnectionError(null);
                } else {
                    setConnectionError('Connexion perdue');
                }
                setIsJoined(false);
            } else if (currentState === 'CONNECTED') {
                setConnectionError(null);
                setIsJoined(true);
            }
        };

        const handleException = (evt) => {
            console.error('🚨 Agora Exception:', evt);

            // Ignorer les erreurs de bitrate trop faibles (elles sont normales)
            if (evt.code === 2003 || evt.code === 1003 || evt.code === 2001) {
                console.log('⚠️ Bitrate warning ignoré:', evt.msg);
                return;
            }

            if (evt.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
                setConnectionError('Erreur de configuration Agora. Vérifiez votre App ID.');
            } else if (evt.code === 'INVALID_VENDOR_KEY') {
                setConnectionError('App ID Agora invalide.');
            } else {
                console.warn('Agora warning:', evt.msg || evt.code);
            }
        };

        // Enregistrer les événements
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-joined', handleUserJoined);
        client.on('user-left', handleUserLeft);
        client.on('network-quality', handleNetworkQuality);
        client.on('connection-state-change', handleConnectionStateChange);
        client.on('exception', handleException);

        console.log('✅ Événements Agora configurés');

        // Cleanup des événements
        return () => {
            console.log('🧹 Nettoyage événements Agora...');
            if (client) {
                client.removeAllListeners();
            }
            eventsConfiguredRef.current = false;
        };
    }, [clientReady]);

    // ==========================================
    // REJOINDRE LE CANAL
    // ==========================================

    const joinChannel = useCallback(async () => {
        if (isJoiningRef.current || isJoined || !clientRef.current || !channelName || !memoizedUserId) {
            console.log('⚠️ Already joining/joined or missing requirements');
            return;
        }

        try {
            isJoiningRef.current = true;
            setIsConnecting(true);
            setConnectionError(null);

            console.log('🔗 Starting join process...');

            const appId = getAgoraAppId();
            const uid = generateUID(memoizedUserId);

            console.log('📋 Join parameters:', {
                appId: appId.substring(0, 8) + '...',
                channelName,
                uid,
                userRole: memoizedIsTeacher ? 'teacher' : 'student'
            });

            console.log('🔄 Attempting to join channel...');

            const assignedUid = await clientRef.current.join(
                appId,
                channelName,
                null,
                uid
            );

            console.log('✅ Successfully joined channel with UID:', assignedUid);
            localUidRef.current = assignedUid;
            setIsJoined(true);
            setParticipantCount(1);

            // Auto-activation pour le professeur
            if (memoizedIsTeacher) {
                console.log('👨‍🏫 Teacher detected, enabling media...');
                try {
                    await enableCamera();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await enableAudio();
                } catch (mediaError) {
                    console.warn('⚠️ Failed to auto-enable media:', mediaError);
                }
            }

        } catch (error) {
            console.error('❌ Failed to join channel:', error);

            let errorMessage = 'Impossible de rejoindre la session';

            if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
                errorMessage = 'Erreur de serveur Agora. Vérifiez votre App ID et votre connexion.';
            } else if (error.code === 'INVALID_VENDOR_KEY') {
                errorMessage = 'App ID Agora invalide. Vérifiez votre configuration.';
            } else if (error.code === 'DYNAMIC_USE_STATIC_KEY') {
                errorMessage = 'Erreur de token. Contactez l\'administrateur.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setConnectionError(errorMessage);
            throw error;
        } finally {
            setIsConnecting(false);
            isJoiningRef.current = false;
        }
    }, [memoizedUserId, memoizedIsTeacher, isJoined, channelName]);

    // ==========================================
    // QUITTER LE CANAL
    // ==========================================

    const leaveChannel = useCallback(async () => {
        try {
            console.log('🚪 Leaving channel...');

            await disableCamera();
            await disableAudio();
            await stopScreenShare();

            if (isJoined && clientRef.current) {
                await clientRef.current.leave();
                console.log('✅ Left channel successfully');
            }

            setIsJoined(false);
            setRemoteUsers([]);
            setParticipantCount(0);
            setConnectionError(null);
            localUidRef.current = null;

        } catch (error) {
            console.error('❌ Failed to leave channel:', error);
        }
    }, [isJoined]);

    // ==========================================
    // GESTION CAMÉRA - OPTIMISÉE
    // ==========================================

    const enableCamera = useCallback(async () => {
        try {
            if (localVideoTrack) {
                console.warn('⚠️ Video already enabled');
                return;
            }

            console.log('📹 Enabling camera...');

            // PARAMÈTRES VIDÉO OPTIMISÉS
            const videoTrack = await AgoraRTC.createCameraVideoTrack({
                optimizationMode: 'motion',
                encoderConfig: {
                    width: 640,
                    height: 480,
                    frameRate: 15,
                    bitrateMax: 1000,
                    bitrateMin: 300
                }
            });

            setLocalVideoTrack(videoTrack);
            setIsVideoEnabled(true);

            if (isJoined && clientRef.current) {
                await clientRef.current.publish(videoTrack);
                console.log('✅ Video track published');
            }

            console.log('✅ Camera enabled');

        } catch (error) {
            console.error('❌ Failed to enable camera:', error);
            setConnectionError('Impossible d\'accéder à la caméra');
            throw error;
        }
    }, [localVideoTrack, isJoined]);

    const disableCamera = useCallback(async () => {
        try {
            if (!localVideoTrack) return;

            console.log('📹 Disabling camera...');

            if (isJoined && clientRef.current) {
                await clientRef.current.unpublish(localVideoTrack);
                console.log('✅ Video track unpublished');
            }

            localVideoTrack.stop();
            localVideoTrack.close();

            setLocalVideoTrack(null);
            setIsVideoEnabled(false);

            console.log('✅ Camera disabled');

        } catch (error) {
            console.error('❌ Failed to disable camera:', error);
        }
    }, [localVideoTrack, isJoined]);

    // ==========================================
    // GESTION AUDIO - OPTIMISÉE POUR BIDIRECTIONNALITÉ
    // ==========================================

    const enableAudio = useCallback(async () => {
        try {
            if (localAudioTrack) {
                console.warn('⚠️ Audio already enabled');
                return;
            }

            console.log('🎤 Enabling audio...');

            // PARAMÈTRES AUDIO OPTIMISÉS pour BIDIRECTIONNALITÉ
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                encoderConfig: {
                    sampleRate: 48000,      // Haute qualité
                    stereo: false,          // Mono plus stable pour la voix
                    bitrate: 128            // Bitrate plus élevé pour meilleure qualité
                },
                ANS: true,                  // Suppression de bruit activée
                AEC: true,                  // Annulation d'écho CRITIQUE
                AGC: true,                  // Contrôle automatique du gain
                bypassWebAudio: false,      // Utiliser WebAudio pour compatibilité
                volume: 100                 // Volume au maximum
            });

            // IMPORTANT: Régler le volume dès la création
            audioTrack.setVolume(100);

            setLocalAudioTrack(audioTrack);
            setIsAudioEnabled(true);
            setIsMuted(false);

            if (isJoined && clientRef.current) {
                await clientRef.current.publish(audioTrack);
                console.log('✅ Audio track published');
            }

            console.log('✅ Audio enabled with optimized settings');

        } catch (error) {
            console.error('❌ Failed to enable audio:', error);
            setConnectionError('Impossible d\'accéder au microphone');
            throw error;
        }
    }, [localAudioTrack, isJoined]);

    const disableAudio = useCallback(async () => {
        try {
            if (!localAudioTrack) return;

            console.log('🎤 Disabling audio...');

            if (isJoined && clientRef.current) {
                await clientRef.current.unpublish(localAudioTrack);
                console.log('✅ Audio track unpublished');
            }

            localAudioTrack.stop();
            localAudioTrack.close();

            setLocalAudioTrack(null);
            setIsAudioEnabled(false);
            setIsMuted(false);

            console.log('✅ Audio disabled');

        } catch (error) {
            console.error('❌ Failed to disable audio:', error);
        }
    }, [localAudioTrack, isJoined]);

    // ==========================================
    // COUPER/RÉTABLIR LE SON
    // ==========================================

    const toggleMute = useCallback(async () => {
        if (!localAudioTrack) return;

        try {
            const newMutedState = !isMuted;
            await localAudioTrack.setEnabled(!newMutedState);
            setIsMuted(newMutedState);

            console.log(newMutedState ? '🔇 Audio muted' : '🔊 Audio unmuted');

        } catch (error) {
            console.error('❌ Failed to toggle mute:', error);
        }
    }, [localAudioTrack, isMuted]);

    // ==========================================
    // PARTAGE D'ÉCRAN
    // ==========================================

    const startScreenShare = useCallback(async () => {
        try {
            if (screenTrack || !memoizedIsTeacher) return;

            console.log('🖥️ Starting screen share...');

            const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
                optimizationMode: 'detail',
                encoderConfig: {
                    width: 1280,
                    height: 720,
                    frameRate: 10,
                    bitrateMax: 2000,
                    bitrateMin: 800
                }
            });

            if (localVideoTrack && isJoined && clientRef.current) {
                await clientRef.current.unpublish(localVideoTrack);
            }

            setScreenTrack(screenVideoTrack);
            setIsScreenSharing(true);

            if (isJoined && clientRef.current) {
                await clientRef.current.publish(screenVideoTrack);
            }

            screenVideoTrack.on('track-ended', () => {
                console.log('🖥️ Screen share ended by user');
                stopScreenShare();
            });

            console.log('✅ Screen sharing started');

        } catch (error) {
            console.error('❌ Failed to start screen share:', error);
            setConnectionError('Impossible de partager l\'écran');
            throw error;
        }
    }, [screenTrack, memoizedIsTeacher, localVideoTrack, isJoined]);

    const stopScreenShare = useCallback(async () => {
        try {
            if (!screenTrack) return;

            console.log('🖥️ Stopping screen share...');

            if (isJoined && clientRef.current) {
                await clientRef.current.unpublish(screenTrack);
            }

            screenTrack.stop();
            screenTrack.close();

            setScreenTrack(null);
            setIsScreenSharing(false);

            if (localVideoTrack && isJoined && clientRef.current) {
                await clientRef.current.publish(localVideoTrack);
            }

            console.log('✅ Screen sharing stopped');

        } catch (error) {
            console.error('❌ Failed to stop screen share:', error);
        }
    }, [screenTrack, isJoined, localVideoTrack]);

    return {
        // États de connexion
        isJoined,
        isConnecting,
        connectionError,
        networkQuality,
        participantCount,

        // États des médias
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        isMuted,

        // Tracks
        localVideoTrack,
        localAudioTrack,
        screenTrack,
        remoteUsers,

        // Actions
        joinChannel,
        leaveChannel,
        enableCamera,
        disableCamera,
        enableAudio,
        disableAudio,
        toggleMute,
        startScreenShare,
        stopScreenShare,

        // Utilitaires
        localUid: localUidRef.current,
        channelName
    };
};