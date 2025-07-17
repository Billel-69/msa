    const db = require('../config/db');

// Map pour stocker les connexions actives
const activeConnections = new Map();
const sessionParticipants = new Map();
const mediaStates = new Map();

// Configuration WebRTC
const WEBRTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.ekiga.net' }
    ]
};

// Initialiser le gestionnaire WebRTC pour Socket.IO
const initializeWebRTCHandler = (io) => {
    console.log('🔌 Initializing WebRTC handler...');

    io.on('connection', (socket) => {
        console.log('🔗 New WebRTC connection:', socket.id);

        // Authentification
        socket.on('join-webrtc-session', async (data) => {
            try {
                const { sessionId, userId, isTeacher, mediaState } = data;

                console.log('🚪 User joining WebRTC session:', {
                    socketId: socket.id,
                    sessionId,
                    userId,
                    isTeacher
                });

                // Vérifier que la session existe
                const [session] = await db.execute(
                    'SELECT * FROM live_sessions WHERE id = ? AND status IN ("live", "waiting")',
                    [sessionId]
                );

                if (session.length === 0) {
                    socket.emit('webrtc-error', { message: 'Session introuvable ou terminée' });
                    return;
                }

                // Vérifier que l'utilisateur fait partie de la session
                const [participant] = await db.execute(
                    'SELECT * FROM live_participants WHERE session_id = ? AND user_id = ? AND is_active = 1',
                    [sessionId, userId]
                );

                const sessionTeacher = session[0].teacher_id === userId;
                if (participant.length === 0 && !sessionTeacher) {
                    socket.emit('webrtc-error', { message: 'Vous ne faites pas partie de cette session' });
                    return;
                }

                // Enregistrer la connexion
                socket.sessionId = sessionId;
                socket.userId = userId;
                socket.isTeacher = isTeacher || sessionTeacher;

                // Ajouter à la map des connexions actives
                if (!activeConnections.has(sessionId)) {
                    activeConnections.set(sessionId, new Map());
                }
                activeConnections.get(sessionId).set(userId, {
                    socket,
                    isTeacher: socket.isTeacher,
                    mediaState: mediaState || { video: false, audio: false, screen: false },
                    joinedAt: new Date()
                });

                // Ajouter aux participants de la session
                if (!sessionParticipants.has(sessionId)) {
                    sessionParticipants.set(sessionId, new Map());
                }

                // Récupérer les infos utilisateur
                const [userInfo] = await db.execute(
                    'SELECT id, name, username, profile_picture, account_type FROM users WHERE id = ?',
                    [userId]
                );

                const participantInfo = {
                    id: userId,
                    name: userInfo[0]?.name || 'Utilisateur',
                    username: userInfo[0]?.username || '',
                    isTeacher: socket.isTeacher,
                    mediaState: mediaState || { video: false, audio: false, screen: false },
                    accountType: userInfo[0]?.account_type || 'student'
                };

                sessionParticipants.get(sessionId).set(userId, participantInfo);

                // Notifier les autres participants
                socket.to(`session-${sessionId}`).emit('participant-joined', participantInfo);

                // Rejoindre la room de la session
                socket.join(`session-${sessionId}`);

                // Envoyer la liste des participants existants
                const participants = Array.from(sessionParticipants.get(sessionId).values());
                socket.emit('session-participants', { participants });

                console.log('✅ User joined WebRTC session successfully:', {
                    sessionId,
                    userId,
                    isTeacher: socket.isTeacher,
                    totalParticipants: participants.length
                });

            } catch (error) {
                console.error('❌ Error joining WebRTC session:', error);
                socket.emit('webrtc-error', { message: 'Erreur lors de la connexion à la session' });
            }
        });

        // Gérer les offres WebRTC
        socket.on('webrtc-offer', (data) => {
            const { offer, targetId, sessionId, fromName } = data;

            console.log('📤 WebRTC offer from', socket.userId, 'to', targetId);

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                socket.emit('webrtc-error', { message: 'Session non autorisée' });
                return;
            }

            // Transférer l'offre au destinataire
            const sessionConnections = activeConnections.get(sessionId);
            if (sessionConnections && sessionConnections.has(targetId)) {
                const targetSocket = sessionConnections.get(targetId).socket;
                targetSocket.emit('webrtc-offer', {
                    offer,
                    fromId: socket.userId,
                    fromName: fromName || 'Utilisateur',
                    sessionId
                });
                console.log('✅ WebRTC offer forwarded to', targetId);
            } else {
                console.log('❌ Target user not found:', targetId);
                socket.emit('webrtc-error', { message: 'Destinataire introuvable' });
            }
        });

        // Gérer les réponses WebRTC
        socket.on('webrtc-answer', (data) => {
            const { answer, targetId, sessionId } = data;

            console.log('📤 WebRTC answer from', socket.userId, 'to', targetId);

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                socket.emit('webrtc-error', { message: 'Session non autorisée' });
                return;
            }

            // Transférer la réponse au destinataire
            const sessionConnections = activeConnections.get(sessionId);
            if (sessionConnections && sessionConnections.has(targetId)) {
                const targetSocket = sessionConnections.get(targetId).socket;
                targetSocket.emit('webrtc-answer', {
                    answer,
                    fromId: socket.userId,
                    fromName: socket.userName || 'Utilisateur',
                    sessionId
                });
                console.log('✅ WebRTC answer forwarded to', targetId);
            } else {
                console.log('❌ Target user not found for answer:', targetId);
            }
        });

        // Gérer les candidats ICE
        socket.on('webrtc-ice-candidate', (data) => {
            const { candidate, targetId, sessionId } = data;

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                return;
            }

            // Transférer le candidat ICE au destinataire
            const sessionConnections = activeConnections.get(sessionId);
            if (sessionConnections && sessionConnections.has(targetId)) {
                const targetSocket = sessionConnections.get(targetId).socket;
                targetSocket.emit('webrtc-ice-candidate', {
                    candidate,
                    fromId: socket.userId,
                    fromName: socket.userName || 'Utilisateur',
                    sessionId
                });
            }
        });

        // Gérer les changements d'état des médias
        socket.on('media-state-changed', async (data) => {
            const { sessionId, userId, mediaState } = data;

            console.log('📻 Media state changed:', { userId, mediaState });

            if (!socket.sessionId || socket.sessionId !== sessionId || socket.userId !== userId) {
                return;
            }

            try {
                // Mettre à jour l'état local
                const sessionConnections = activeConnections.get(sessionId);
                if (sessionConnections && sessionConnections.has(userId)) {
                    const connection = sessionConnections.get(userId);
                    connection.mediaState = { ...connection.mediaState, ...mediaState };
                }

                // Mettre à jour les participants
                const sessionParts = sessionParticipants.get(sessionId);
                if (sessionParts && sessionParts.has(userId)) {
                    const participant = sessionParts.get(userId);
                    participant.mediaState = { ...participant.mediaState, ...mediaState };
                }

                // Notifier les autres participants
                socket.to(`session-${sessionId}`).emit('media-state-changed', {
                    userId,
                    mediaState,
                    sessionId
                });

                // Mettre à jour la base de données
                await db.execute(
                    `UPDATE live_participants 
                     SET media_state = ? 
                     WHERE session_id = ? AND user_id = ?`,
                    [JSON.stringify(mediaState), sessionId, userId]
                );

                console.log('✅ Media state updated for user:', userId);

            } catch (error) {
                console.error('❌ Error updating media state:', error);
            }
        });

        // Démarrage du partage d'écran
        socket.on('screen-share-started', (data) => {
            const { sessionId, userId } = data;

            console.log('🖥️ Screen share started by:', userId);

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                return;
            }

            // Notifier tous les participants
            socket.to(`session-${sessionId}`).emit('screen-share-started', {
                userId,
                sessionId,
                userName: socket.userName || 'Utilisateur'
            });
        });

        // Arrêt du partage d'écran
        socket.on('screen-share-stopped', (data) => {
            const { sessionId, userId } = data;

            console.log('🛑 Screen share stopped by:', userId);

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                return;
            }

            // Notifier tous les participants
            socket.to(`session-${sessionId}`).emit('screen-share-stopped', {
                userId,
                sessionId,
                userName: socket.userName || 'Utilisateur'
            });
        });

        // Partage de document
        socket.on('document-shared', (data) => {
            const { sessionId, userId, fileName, fileType, fileSize } = data;

            console.log('📄 Document shared by:', userId, fileName);

            if (!socket.sessionId || socket.sessionId !== sessionId) {
                return;
            }

            // Notifier tous les participants
            socket.to(`session-${sessionId}`).emit('document-shared', {
                userId,
                sessionId,
                fileName,
                fileType,
                fileSize,
                userName: socket.userName || 'Utilisateur'
            });
        });

        // Gestion de la déconnexion
        socket.on('disconnect', async (reason) => {
            console.log('🔌 WebRTC user disconnected:', {
                socketId: socket.id,
                userId: socket.userId,
                sessionId: socket.sessionId,
                reason
            });

            if (socket.sessionId && socket.userId) {
                try {
                    // Retirer de la map des connexions actives
                    const sessionConnections = activeConnections.get(socket.sessionId);
                    if (sessionConnections) {
                        sessionConnections.delete(socket.userId);
                        if (sessionConnections.size === 0) {
                            activeConnections.delete(socket.sessionId);
                        }
                    }

                    // Récupérer les infos du participant avant de le retirer
                    const sessionParts = sessionParticipants.get(socket.sessionId);
                    let participantInfo = null;
                    if (sessionParts && sessionParts.has(socket.userId)) {
                        participantInfo = sessionParts.get(socket.userId);
                        sessionParts.delete(socket.userId);
                        if (sessionParts.size === 0) {
                            sessionParticipants.delete(socket.sessionId);
                        }
                    }

                    // Notifier les autres participants
                    if (participantInfo) {
                        socket.to(`session-${socket.sessionId}`).emit('participant-left', participantInfo);
                    }

                    // Mettre à jour la base de données
                    await db.execute(
                        'UPDATE live_participants SET is_active = 0, left_at = NOW() WHERE session_id = ? AND user_id = ?',
                        [socket.sessionId, socket.userId]
                    );

                    // Mettre à jour le nombre de participants dans la session
                    const remainingParticipants = sessionParts ? sessionParts.size : 0;
                    await db.execute(
                        'UPDATE live_sessions SET current_participants = ? WHERE id = ?',
                        [remainingParticipants, socket.sessionId]
                    );

                    console.log('✅ User cleanup completed:', {
                        userId: socket.userId,
                        sessionId: socket.sessionId,
                        remainingParticipants
                    });

                } catch (error) {
                    console.error('❌ Error during user cleanup:', error);
                }
            }
        });

        // Gestion des erreurs
        socket.on('error', (error) => {
            console.error('❌ WebRTC Socket error:', error);
            socket.emit('webrtc-error', { message: 'Erreur de connexion WebRTC' });
        });
    });

    // Nettoyage périodique des connexions inactives
    setInterval(() => {
        const now = new Date();
        const timeout = 5 * 60 * 1000; // 5 minutes

        activeConnections.forEach((sessionConnections, sessionId) => {
            sessionConnections.forEach((connection, userId) => {
                if (now - connection.joinedAt > timeout && !connection.socket.connected) {
                    console.log('🧹 Cleaning up inactive connection:', { sessionId, userId });
                    sessionConnections.delete(userId);

                    const sessionParts = sessionParticipants.get(sessionId);
                    if (sessionParts) {
                        sessionParts.delete(userId);
                    }
                }
            });

            if (sessionConnections.size === 0) {
                activeConnections.delete(sessionId);
            }
        });

        sessionParticipants.forEach((participants, sessionId) => {
            if (participants.size === 0) {
                sessionParticipants.delete(sessionId);
            }
        });
    }, 60000); // Nettoyage toutes les minutes

    console.log('✅ WebRTC handler initialized successfully');
};

// Fonctions utilitaires pour la gestion des sessions
const getSessionParticipants = (sessionId) => {
    const participants = sessionParticipants.get(sessionId);
    return participants ? Array.from(participants.values()) : [];
};

const getActiveConnections = (sessionId) => {
    const connections = activeConnections.get(sessionId);
    return connections ? Array.from(connections.values()) : [];
};

const isUserInSession = (sessionId, userId) => {
    const sessionConnections = activeConnections.get(sessionId);
    return sessionConnections ? sessionConnections.has(userId) : false;
};

const broadcastToSession = (io, sessionId, event, data, excludeUserId = null) => {
    const sessionConnections = activeConnections.get(sessionId);
    if (!sessionConnections) return;

    sessionConnections.forEach((connection, userId) => {
        if (excludeUserId && userId === excludeUserId) return;

        if (connection.socket && connection.socket.connected) {
            connection.socket.emit(event, data);
        }
    });
};

// API REST pour les statistiques et la gestion
const getSessionStats = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        // Vérifier les permissions
        const [session] = await db.execute(
            'SELECT teacher_id FROM live_sessions WHERE id = ?',
            [sessionId]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        if (session[0].teacher_id !== req.user.id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const participants = getSessionParticipants(sessionId);
        const connections = getActiveConnections(sessionId);

        const stats = {
            sessionId,
            totalParticipants: participants.length,
            activeConnections: connections.length,
            participants: participants.map(p => ({
                id: p.id,
                name: p.name,
                isTeacher: p.isTeacher,
                mediaState: p.mediaState,
                accountType: p.accountType
            })),
            webrtcStats: {
                totalSessions: activeConnections.size,
                avgParticipantsPerSession: activeConnections.size > 0
                    ? Array.from(activeConnections.values()).reduce((sum, conn) => sum + conn.size, 0) / activeConnections.size
                    : 0
            }
        };

        res.json(stats);

    } catch (error) {
        console.error('❌ Error getting session stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Forcer la déconnexion d'un participant
const kickParticipant = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const participantId = parseInt(req.params.participantId);

        // Vérifier les permissions (seuls les professeurs peuvent expulser)
        const [session] = await db.execute(
            'SELECT teacher_id FROM live_sessions WHERE id = ?',
            [sessionId]
        );

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        if (session[0].teacher_id !== req.user.id) {
            return res.status(403).json({ error: 'Seuls les professeurs peuvent expulser des participants' });
        }

        // Trouver et déconnecter le participant
        const sessionConnections = activeConnections.get(sessionId);
        if (sessionConnections && sessionConnections.has(participantId)) {
            const connection = sessionConnections.get(participantId);

            // Envoyer un événement de déconnexion forcée
            connection.socket.emit('kicked-from-session', {
                reason: 'Expulsé par le professeur',
                sessionId
            });

            // Déconnecter le socket
            connection.socket.disconnect(true);

            console.log('👮 Participant kicked from session:', { sessionId, participantId });
        }

        res.json({ message: 'Participant expulsé avec succès' });

    } catch (error) {
        console.error('❌ Error kicking participant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    initializeWebRTCHandler,
    getSessionParticipants,
    getActiveConnections,
    isUserInSession,
    broadcastToSession,
    getSessionStats,
    kickParticipant,
    WEBRTC_CONFIG
};