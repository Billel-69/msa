// Fichier: src/components/RemoteVideoPlayer.jsx
// VERSION COMPLÈTEMENT CORRIGÉE - Audio/Vidéo bidirectionnel optimisé

import React, { useEffect, useRef, useState } from 'react';
import {
    FaVideo,
    FaVideoSlash,
    FaMicrophone,
    FaMicrophoneSlash,
    FaUser,
    FaSignal,
    FaExclamationTriangle
} from 'react-icons/fa';
import './RemoteVideoPlayer.css';

const RemoteVideoPlayer = ({ user, isTeacher = false, isMain = false }) => {
    const videoRef = useRef(null);
    const [videoError, setVideoError] = useState(null);
    const [audioError, setAudioError] = useState(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    // ==========================================
    // GESTION VIDÉO - CORRIGÉE
    // ==========================================

    useEffect(() => {
        console.log('🎥 RemoteVideoPlayer - Tentative affichage vidéo:', {
            uid: user.uid,
            hasVideoTrack: !!user.videoTrack,
            hasContainer: !!videoRef.current,
            isMain,
            isTeacher
        });

        if (user.videoTrack && videoRef.current) {
            try {
                setVideoError(null);

                // IMPORTANT: Nettoyer d'abord le container
                videoRef.current.innerHTML = '';

                // Jouer la vidéo
                user.videoTrack.play(videoRef.current);
                setIsVideoPlaying(true);

                console.log('✅ Vidéo distante affichée avec succès pour:', user.uid);
            } catch (error) {
                console.error('❌ Erreur affichage vidéo distante:', error);
                setVideoError(error.message);
                setIsVideoPlaying(false);
            }
        } else {
            console.log('⚠️ Conditions vidéo non remplies:', {
                uid: user.uid,
                hasTrack: !!user.videoTrack,
                hasContainer: !!videoRef.current
            });
            setIsVideoPlaying(false);
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
    }, [user.videoTrack, user.uid, isMain]);

    // ==========================================
    // GESTION AUDIO - CORRIGÉE POUR BIDIRECTIONNALITÉ
    // ==========================================

    useEffect(() => {
        console.log('🔊 RemoteVideoPlayer - Gestion audio:', {
            uid: user.uid,
            hasAudioTrack: !!user.audioTrack,
            hasAudio: user.hasAudio
        });

        if (user.audioTrack) {
            try {
                setAudioError(null);

                console.log('🔊 FORCER LECTURE AUDIO BIDIRECTIONNELLE pour:', user.uid);

                // Régler le volume à 100%
                user.audioTrack.setVolume(100);

                // Forcer la lecture avec retry
                const playAudio = async () => {
                    try {
                        await user.audioTrack.play();
                        setIsAudioPlaying(true);
                        console.log('✅ Audio en lecture pour:', user.uid);
                    } catch (playError) {
                        console.warn('⚠️ Premier essai audio échoué, retry...', playError);
                        setAudioError(playError.message);

                        // Retry après 500ms
                        setTimeout(async () => {
                            try {
                                await user.audioTrack.play();
                                setIsAudioPlaying(true);
                                setAudioError(null);
                                console.log('✅ Audio retry réussi pour:', user.uid);
                            } catch (retryError) {
                                console.error('❌ Audio retry échoué:', retryError);
                                setAudioError(retryError.message);
                                setIsAudioPlaying(false);
                            }
                        }, 500);
                    }
                };

                playAudio();

            } catch (error) {
                console.error('❌ Erreur configuration audio:', error);
                setAudioError(error.message);
                setIsAudioPlaying(false);
            }
        } else {
            setIsAudioPlaying(false);
        }
    }, [user.audioTrack, user.uid]);

    // ==========================================
    // FONCTIONS UTILITAIRES
    // ==========================================

    // Calculer le temps de connexion
    const getConnectionTime = () => {
        if (!user.joinTime) return '';

        const now = new Date();
        const diff = Math.floor((now - user.joinTime) / 1000);

        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h`;
    };

    // Obtenir la qualité de connexion
    const getConnectionQuality = () => {
        if (videoError || audioError) return 'poor';
        if (isVideoPlaying && isAudioPlaying) return 'excellent';
        if (isVideoPlaying || isAudioPlaying) return 'good';
        return 'poor';
    };

    // Styles dynamiques selon le type d'affichage
    const containerStyle = isMain ? {
        width: '100%',
        height: '400px',
        background: '#000',
        borderRadius: '12px',
        position: 'relative'
    } : {
        width: '100%',
        height: '120px',
        background: '#000',
        borderRadius: '8px',
        position: 'relative'
    };

    return (
        <div className={`remote-video-player ${isTeacher ? 'teacher' : 'student'} ${isMain ? 'main-player' : 'secondary-player'}`}>
            {/* Conteneur vidéo principal */}
            <div className="video-container" style={containerStyle}>
                {user.hasVideo && user.videoTrack && isVideoPlaying ? (
                    // Vidéo active
                    <div
                        ref={videoRef}
                        className="remote-video"
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: isMain ? '12px' : '8px'
                        }}
                    />
                ) : (
                    // Placeholder vidéo
                    <div className="video-placeholder" style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
                        borderRadius: isMain ? '12px' : '8px'
                    }}>
                        <FaUser
                            className="avatar-icon"
                            style={{
                                fontSize: isMain ? '60px' : '30px',
                                color: '#666',
                                marginBottom: isMain ? '16px' : '8px'
                            }}
                        />
                        <span
                            className="participant-initial"
                            style={{
                                fontSize: isMain ? '24px' : '16px',
                                fontWeight: '600',
                                color: 'white',
                                background: isTeacher ? '#ff9800' : '#2196f3',
                                width: isMain ? '60px' : '40px',
                                height: isMain ? '60px' : '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                        {isMain && (
                            <p style={{
                                color: '#ccc',
                                marginTop: '12px',
                                textAlign: 'center',
                                fontSize: '14px'
                            }}>
                                {videoError ? `Erreur vidéo: ${videoError}` : 'Caméra désactivée'}
                            </p>
                        )}
                    </div>
                )}

                {/* Overlay avec informations - AMÉLIORÉ */}
                <div className="video-overlay" style={{
                    position: 'absolute',
                    bottom: isMain ? '16px' : '8px',
                    left: isMain ? '16px' : '8px',
                    right: isMain ? '16px' : '8px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: isMain ? '12px' : '8px',
                    borderRadius: isMain ? '8px' : '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="participant-info">
                        <span
                            className="participant-name"
                            style={{
                                fontSize: isMain ? '14px' : '12px',
                                fontWeight: '600',
                                display: 'block'
                            }}
                        >
                            {user.name || `Participant ${user.uid}`}
                            {isTeacher && ' 👨‍🏫'}
                        </span>
                        {getConnectionTime() && isMain && (
                            <span
                                className="connection-time"
                                style={{
                                    fontSize: '12px',
                                    color: '#ccc',
                                    display: 'block'
                                }}
                            >
                                Connecté depuis {getConnectionTime()}
                            </span>
                        )}
                    </div>

                    {/* Indicateurs média - AMÉLIORÉS */}
                    <div className="media-indicators" style={{
                        display: 'flex',
                        gap: isMain ? '8px' : '4px',
                        alignItems: 'center'
                    }}>
                        {/* Indicateur qualité de connexion */}
                        <div
                            className={`quality-indicator ${getConnectionQuality()}`}
                            style={{
                                fontSize: isMain ? '12px' : '10px',
                                color: getConnectionQuality() === 'excellent' ? '#4caf50' :
                                    getConnectionQuality() === 'good' ? '#ff9800' : '#f44336'
                            }}
                        >
                            {getConnectionQuality() === 'poor' ? <FaExclamationTriangle /> : <FaSignal />}
                        </div>

                        {/* Indicateur vidéo */}
                        <div
                            className={`video-indicator ${user.hasVideo && isVideoPlaying ? 'active' : 'inactive'}`}
                            style={{
                                fontSize: isMain ? '14px' : '12px',
                                color: user.hasVideo && isVideoPlaying ? '#4caf50' : '#f44336'
                            }}
                        >
                            {user.hasVideo && isVideoPlaying ? <FaVideo /> : <FaVideoSlash />}
                        </div>

                        {/* Indicateur audio */}
                        <div
                            className={`audio-indicator ${user.hasAudio && isAudioPlaying ? 'active' : 'inactive'}`}
                            style={{
                                fontSize: isMain ? '14px' : '12px',
                                color: user.hasAudio && isAudioPlaying ? '#4caf50' : '#f44336'
                            }}
                        >
                            {user.hasAudio && isAudioPlaying ? <FaMicrophone /> : <FaMicrophoneSlash />}
                        </div>
                    </div>
                </div>

                {/* Debug info - SEULEMENT EN MODE MAIN */}
                {isMain && (process.env.NODE_ENV === 'development') && (
                    <div
                        className="debug-info"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <div>UID: {user.uid}</div>
                        <div>Video: {user.hasVideo ? '✅' : '❌'} ({isVideoPlaying ? 'Playing' : 'Stopped'})</div>
                        <div>Audio: {user.hasAudio ? '✅' : '❌'} ({isAudioPlaying ? 'Playing' : 'Stopped'})</div>
                        {videoError && <div style={{color: '#ff4444'}}>V-Err: {videoError}</div>}
                        {audioError && <div style={{color: '#ff4444'}}>A-Err: {audioError}</div>}
                    </div>
                )}
            </div>

            {/* Informations détaillées - SEULEMENT POUR SECONDARY */}
            {!isMain && (
                <div className="participant-details" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#ccc'
                }}>
                    <span className="participant-id">#{user.uid}</span>
                    <div className="media-status" style={{
                        display: 'flex',
                        gap: '4px'
                    }}>
                        {user.hasVideo && isVideoPlaying && <span className="status-badge video">📹</span>}
                        {user.hasAudio && isAudioPlaying && <span className="status-badge audio">🎤</span>}
                        {(!user.hasVideo || !isVideoPlaying) && (!user.hasAudio || !isAudioPlaying) && (
                            <span className="status-badge offline">📴</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemoteVideoPlayer;