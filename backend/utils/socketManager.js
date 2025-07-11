// Fichier: backend/utils/socketManager.js
// VERSION CORRIGÉE - Gestion Socket.io pour chat temps réel

const jwt = require('jsonwebtoken');
const db = require('./database');

class SocketManager {
    constructor(io) {
        this.io = io;
        this.connectedUsers = new Map(); // Map<socketId, userInfo>
        this.sessionRooms = new Map();   // Map<sessionId, Set<socketId>>
        this.userSessions = new Map();   // Map<userId, sessionId>

        this.setupMiddleware();
        this.setupEventHandlers();

        console.log('🚀 SocketManager initialisé');
    }

    // ==========================================
    // MIDDLEWARE DE SOCKET.IO
    // ==========================================

    setupMiddleware() {
        // Middleware d'authentification
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    console.log('⚠️ Socket connexion sans token:', socket.id);
                    // Permettre la connexion sans token pour les invités
                    socket.user = { id: null, name: 'Invité', accountType: 'guest' };
                    return next();
                }

                // Vérifier le token JWT
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Récupérer les informations utilisateur depuis la DB
                const [userRows] = await db.execute(
                    'SELECT id, name, email, account_type, profile_picture FROM users WHERE id = ?',
                    [decoded.userId]
                );

                if (userRows.length === 0) {
                    throw new Error('Utilisateur non trouvé');
                }

                const user = userRows[0];
                socket.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    accountType: user.account_type,
                    profilePicture: user.profile_picture
                };

                console.log('✅ Socket authentifié:', {
                    socketId: socket.id,
                    userId: user.id,
                    userName: user.name,
                    accountType: user.account_type
                });

                next();
            } catch (error) {
                console.error('❌ Erreur auth socket:', error.message);
                next(new Error('Authentification échouée'));
            }
        });

        // Middleware de rate limiting
        this.io.use((socket, next) => {
            socket.messageCount = 0;
            socket.lastMessageTime = 0;
            next();
        });
    }

    // ==========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ==========================================

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log('🔌 Nouvelle connexion socket:', {
                socketId: socket.id,
                userId: socket.user?.id,
                userName: socket.user?.name
            });

            // Stocker les informations de connexion
            this.connectedUsers.set(socket.id, {
                socketId: socket.id,
                userId: socket.user?.id,
                userName: socket.user?.name,
                accountType: socket.user?.accountType,
                joinedAt: new Date(),
                currentSession: null
            });

            // Événement: Rejoindre une session
            socket.on('join-session', async (sessionId) => {
                await this.handleJoinSession(socket, sessionId);
            });

            // Événement: Quitter une session
            socket.on('leave-session', async (sessionId) => {
                await this.handleLeaveSession(socket, sessionId);
            });

            // Événement: Envoyer un message
            socket.on('send-message', async (messageData) => {
                await this.handleSendMessage(socket, messageData);
            });

            // Événement: Déconnexion
            socket.on('disconnect', (reason) => {
                this.handleDisconnect(socket, reason);
            });

            // Événement: Demander l'historique des messages
            socket.on('get-message-history', async (sessionId) => {
                await this.handleGetMessageHistory(socket, sessionId);
            });

            // Événement: Utilisateur tape
            socket.on('user-typing', (data) => {
                this.handleUserTyping(socket, data);
            });

            // Événement: Utilisateur arrête de taper
            socket.on('user-stop-typing', (data) => {
                this.handleUserStopTyping(socket, data);
            });
        });
    }

    // ==========================================
    // REJOINDRE UNE SESSION
    // ==========================================

    async handleJoinSession(socket, sessionId) {
        try {
            console.log('🚪 Join session:', {
                socketId: socket.id,
                userId: socket.user?.id,
                sessionId
            });

            // Vérifier que la session existe
            const [sessionRows] = await db.execute(
                'SELECT id, title, status FROM live_sessions WHERE id = ?',
                [sessionId]
            );

            if (sessionRows.length === 0) {
                socket.emit('session-error', {
                    error: 'Session non trouvée',
                    code: 'SESSION_NOT_FOUND'
                });
                return;
            }

            const session = sessionRows[0];

            // Vérifier si l'utilisateur est autorisé à rejoindre
            if (socket.user?.id) {
                const [participantRows] = await db.execute(
                    'SELECT id FROM live_session_participants WHERE session_id = ? AND user_id = ?',
                    [sessionId, socket.user.id]
                );

                if (participantRows.length === 0) {
                    socket.emit('session-error', {
                        error: 'Non autorisé à rejoindre cette session',
                        code: 'UNAUTHORIZED'
                    });
                    return;
                }
            }

            // Quitter l'ancienne session si nécessaire
            const userInfo = this.connectedUsers.get(socket.id);
            if (userInfo?.currentSession && userInfo.currentSession !== sessionId) {
                await this.handleLeaveSession(socket, userInfo.currentSession);
            }

            // Rejoindre la room Socket.io
            socket.join(`session-${sessionId}`);

            // Mettre à jour les tracking maps
            if (!this.sessionRooms.has(sessionId)) {
                this.sessionRooms.set(sessionId, new Set());
            }
            this.sessionRooms.get(sessionId).add(socket.id);

            if (socket.user?.id) {
                this.userSessions.set(socket.user.id, sessionId);
            }

            // Mettre à jour les infos utilisateur
            if (userInfo) {
                userInfo.currentSession = sessionId;
                this.connectedUsers.set(socket.id, userInfo);
            }

            // Envoyer confirmation de join
            socket.emit('session-joined', {
                sessionId,
                sessionTitle: session.title,
                status: session.status,
                joinedAt: new Date().toISOString()
            });

            // Envoyer l'historique des messages récents
            await this.sendRecentMessages(socket, sessionId);

            // Notifier les autres participants
            socket.to(`session-${sessionId}`).emit('user-joined-session', {
                userId: socket.user?.id,
                userName: socket.user?.name,
                accountType: socket.user?.accountType,
                joinedAt: new Date().toISOString()
            });

            // Message système de bienvenue
            if (socket.user?.id) {
                const welcomeMessage = await this.createSystemMessage(
                    sessionId,
                    `${socket.user.name} a rejoint la session`
                );

                this.io.to(`session-${sessionId}`).emit('new-message', welcomeMessage);
            }

            console.log('✅ Join session réussi:', {
                socketId: socket.id,
                userId: socket.user?.id,
                sessionId,
                participantCount: this.sessionRooms.get(sessionId)?.size || 0
            });

        } catch (error) {
            console.error('❌ Erreur join session:', error);
            socket.emit('session-error', {
                error: 'Erreur lors de la connexion à la session',
                code: 'JOIN_ERROR',
                details: error.message
            });
        }
    }

    // ==========================================
    // QUITTER UNE SESSION
    // ==========================================

    async handleLeaveSession(socket, sessionId) {
        try {
            console.log('🚪 Leave session:', {
                socketId: socket.id,
                userId: socket.user?.id,
                sessionId
            });

            // Quitter la room Socket.io
            socket.leave(`session-${sessionId}`);

            // Mettre à jour les tracking maps
            if (this.sessionRooms.has(sessionId)) {
                this.sessionRooms.get(sessionId).delete(socket.id);

                // Supprimer la session si plus personne
                if (this.sessionRooms.get(sessionId).size === 0) {
                    this.sessionRooms.delete(sessionId);
                }
            }

            if (socket.user?.id) {
                this.userSessions.delete(socket.user.id);
            }

            // Mettre à jour les infos utilisateur
            const userInfo = this.connectedUsers.get(socket.id);
            if (userInfo) {
                userInfo.currentSession = null;
                this.connectedUsers.set(socket.id, userInfo);
            }

            // Envoyer confirmation de leave
            socket.emit('session-left', {
                sessionId,
                leftAt: new Date().toISOString()
            });

            // Notifier les autres participants
            socket.to(`session-${sessionId}`).emit('user-left-session', {
                userId: socket.user?.id,
                userName: socket.user?.name,
                leftAt: new Date().toISOString()
            });

            // Message système de départ
            if (socket.user?.id) {
                const leaveMessage = await this.createSystemMessage(
                    sessionId,
                    `${socket.user.name} a quitté la session`
                );

                this.io.to(`session-${sessionId}`).emit('new-message', leaveMessage);
            }

            console.log('✅ Leave session réussi:', {
                socketId: socket.id,
                userId: socket.user?.id,
                sessionId
            });

        } catch (error) {
            console.error('❌ Erreur leave session:', error);
        }
    }

    // ==========================================
    // ENVOYER UN MESSAGE
    // ==========================================

    async handleSendMessage(socket, messageData) {
        try {
            const { sessionId, message, timestamp } = messageData;

            console.log('💬 Send message:', {
                socketId: socket.id,
                userId: socket.user?.id,
                sessionId,
                messageLength: message?.length || 0
            });

            // Validation des données
            if (!sessionId || !message || !message.trim()) {
                socket.emit('message-error', {
                    error: 'Données de message invalides',
                    code: 'INVALID_DATA'
                });
                return;
            }

            // Vérification de l'utilisateur
            if (!socket.user?.id) {
                socket.emit('message-error', {
                    error: 'Utilisateur non authentifié',
                    code: 'UNAUTHORIZED'
                });
                return;
            }

            // Rate limiting
            const now = Date.now();
            if (now - socket.lastMessageTime < 1000) { // Max 1 message/seconde
                socket.emit('message-error', {
                    error: 'Trop de messages envoyés rapidement',
                    code: 'RATE_LIMIT'
                });
                return;
            }
            socket.lastMessageTime = now;

            // Vérifier que l'utilisateur est dans la session
            const userInfo = this.connectedUsers.get(socket.id);
            if (!userInfo || userInfo.currentSession !== sessionId) {
                socket.emit('message-error', {
                    error: 'Vous devez rejoindre la session pour envoyer des messages',
                    code: 'NOT_IN_SESSION'
                });
                return;
            }

            // Sauvegarder le message en base de données
            const [result] = await db.execute(
                `INSERT INTO live_session_messages 
                 (session_id, user_id, message, message_type, created_at) 
                 VALUES (?, ?, ?, 'user', NOW())`,
                [sessionId, socket.user.id, message.trim()]
            );

            // Récupérer le message complet avec les infos utilisateur
            const [messageRows] = await db.execute(
                `SELECT 
                    lsm.id, lsm.session_id, lsm.user_id, lsm.message, 
                    lsm.message_type, lsm.created_at,
                    u.name as user_name, u.account_type, u.profile_picture
                 FROM live_session_messages lsm
                 JOIN users u ON lsm.user_id = u.id
                 WHERE lsm.id = ?`,
                [result.insertId]
            );

            if (messageRows.length === 0) {
                throw new Error('Impossible de récupérer le message sauvegardé');
            }

            const savedMessage = messageRows[0];

            // Diffuser le message à tous les participants de la session
            this.io.to(`session-${sessionId}`).emit('new-message', savedMessage);

            // Confirmer l'envoi à l'expéditeur
            socket.emit('message-sent', {
                messageId: savedMessage.id,
                sentAt: savedMessage.created_at
            });

            console.log('✅ Message envoyé:', {
                messageId: savedMessage.id,
                from: socket.user.name,
                sessionId,
                participantCount: this.sessionRooms.get(sessionId)?.size || 0
            });

        } catch (error) {
            console.error('❌ Erreur send message:', error);
            socket.emit('message-error', {
                error: 'Erreur lors de l\'envoi du message',
                code: 'SEND_ERROR',
                details: error.message
            });
        }
    }

    // ==========================================
    // HISTORIQUE DES MESSAGES
    // ==========================================

    async sendRecentMessages(socket, sessionId, limit = 50) {
        try {
            const [messageRows] = await db.execute(
                `SELECT 
                    lsm.id, lsm.session_id, lsm.user_id, lsm.message, 
                    lsm.message_type, lsm.created_at,
                    u.name as user_name, u.account_type, u.profile_picture
                 FROM live_session_messages lsm
                 LEFT JOIN users u ON lsm.user_id = u.id
                 WHERE lsm.session_id = ?
                 ORDER BY lsm.created_at DESC
                 LIMIT ?`,
                [sessionId, limit]
            );

            // Inverser l'ordre pour avoir les plus anciens en premier
            const messages = messageRows.reverse();

            socket.emit('message-history', {
                sessionId,
                messages,
                count: messages.length
            });

            console.log('📚 Historique envoyé:', {
                socketId: socket.id,
                sessionId,
                messageCount: messages.length
            });

        } catch (error) {
            console.error('❌ Erreur historique messages:', error);
        }
    }

    async handleGetMessageHistory(socket, sessionId) {
        await this.sendRecentMessages(socket, sessionId, 100);
    }

    // ==========================================
    // INDICATEURS DE FRAPPE
    // ==========================================

    handleUserTyping(socket, data) {
        const { sessionId } = data;
        const userInfo = this.connectedUsers.get(socket.id);

        if (userInfo && userInfo.currentSession === sessionId) {
            socket.to(`session-${sessionId}`).emit('user-typing', {
                userId: socket.user?.id,
                userName: socket.user?.name,
                sessionId
            });
        }
    }

    handleUserStopTyping(socket, data) {
        const { sessionId } = data;
        const userInfo = this.connectedUsers.get(socket.id);

        if (userInfo && userInfo.currentSession === sessionId) {
            socket.to(`session-${sessionId}`).emit('user-stop-typing', {
                userId: socket.user?.id,
                userName: socket.user?.name,
                sessionId
            });
        }
    }

    // ==========================================
    // DÉCONNEXION
    // ==========================================

    handleDisconnect(socket, reason) {
        console.log('🔌 Socket déconnecté:', {
            socketId: socket.id,
            userId: socket.user?.id,
            reason
        });

        const userInfo = this.connectedUsers.get(socket.id);

        // Quitter la session actuelle si il y en a une
        if (userInfo?.currentSession) {
            this.handleLeaveSession(socket, userInfo.currentSession);
        }

        // Nettoyer les tracking maps
        this.connectedUsers.delete(socket.id);

        if (socket.user?.id) {
            this.userSessions.delete(socket.user.id);
        }

        // Nettoyer les session rooms
        for (const [sessionId, socketSet] of this.sessionRooms.entries()) {
            if (socketSet.has(socket.id)) {
                socketSet.delete(socket.id);
                if (socketSet.size === 0) {
                    this.sessionRooms.delete(sessionId);
                }
            }
        }
    }

    // ==========================================
    // FONCTIONS UTILITAIRES
    // ==========================================

    async createSystemMessage(sessionId, messageText) {
        try {
            const [result] = await db.execute(
                `INSERT INTO live_session_messages 
                 (session_id, user_id, message, message_type, created_at) 
                 VALUES (?, NULL, ?, 'system', NOW())`,
                [sessionId, messageText]
            );

            return {
                id: result.insertId,
                session_id: sessionId,
                user_id: null,
                message: messageText,
                message_type: 'system',
                created_at: new Date().toISOString(),
                user_name: 'Système',
                account_type: 'system',
                profile_picture: null
            };
        } catch (error) {
            console.error('❌ Erreur création message système:', error);
            return null;
        }
    }

    // Obtenir les statistiques de connexion
    getConnectionStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            activeSessions: this.sessionRooms.size,
            totalConnections: Array.from(this.connectedUsers.values()),
            sessionDetails: Object.fromEntries(
                Array.from(this.sessionRooms.entries()).map(([sessionId, socketSet]) => [
                    sessionId,
                    {
                        participantCount: socketSet.size,
                        participants: Array.from(socketSet).map(socketId => {
                            const userInfo = this.connectedUsers.get(socketId);
                            return {
                                socketId,
                                userId: userInfo?.userId,
                                userName: userInfo?.userName,
                                accountType: userInfo?.accountType
                            };
                        })
                    }
                ])
            )
        };
    }

    // Envoyer un message système à une session spécifique
    async sendSystemMessage(sessionId, message) {
        const systemMessage = await this.createSystemMessage(sessionId, message);
        if (systemMessage) {
            this.io.to(`session-${sessionId}`).emit('new-message', systemMessage);
        }
    }

    // Diffuser un message à tous les utilisateurs connectés
    broadcastToAll(event, data) {
        this.io.emit(event, data);
    }

    // Diffuser un message à une session spécifique
    broadcastToSession(sessionId, event, data) {
        this.io.to(`session-${sessionId}`).emit(event, data);
    }
}

module.exports = SocketManager;