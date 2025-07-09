const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io avec CORS pour le réseau + WebRTC
const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://192.168.1.62:3000",  // Votre IP WiFi
            "https://your-domain.com"    // Ajoutez votre domaine de production
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    // Configuration optimisée pour WebRTC
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8, // 100MB pour les gros fichiers
    httpCompression: true,
    compression: true
});

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

// Middlewares avec CORS étendu
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://192.168.1.62:3000",
        "https://your-domain.com"
    ],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Middleware de logging amélioré
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// Import des routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const liveRoutes = require('./routes/liveRoutes');
const gameRoutes = require('./routes/gameRoutes');
const achievementsRoutes = require('./routes/achievementsRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/chat', chatRoutes);

// ==========================================
// STORES POUR GESTION TEMPS RÉEL
// ==========================================

// Store pour les utilisateurs connectés (existant)
const connectedUsers = new Map();

// NOUVEAUX STORES pour WebRTC
const activeSessions = new Map();        // sessionId -> session data
const sessionParticipants = new Map();   // sessionId -> Map(userId -> participant data)
const webrtcConnections = new Map();     // sessionId -> Map(userId -> connection data)
const mediaStates = new Map();           // userId -> media state

// ==========================================
// CONFIGURATION WEBRTC
// ==========================================

const WEBRTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.ekiga.net' }
    ]
};

// ==========================================
// MIDDLEWARE D'AUTHENTIFICATION SOCKET.IO
// ==========================================

const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        console.log('🔐 Tentative d\'authentification socket - Token présent:', !!token);

        if (!token) {
            console.log('❌ Token manquant');
            return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token décodé:', decoded.id);

        // Récupérer les infos utilisateur
        const [users] = await db.execute(
            'SELECT id, name, username, account_type, profile_picture FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            console.log('❌ Utilisateur introuvable:', decoded.id);
            return next(new Error('Utilisateur introuvable'));
        }

        socket.user = users[0];
        console.log('👤 Utilisateur authentifié:', socket.user.name);
        next();
    } catch (error) {
        console.error('❌ Erreur auth socket:', error.message);
        next(new Error('Token invalide'));
    }
};

// Appliquer le middleware d'authentification
io.use(authenticateSocket);

// ==========================================
// GESTION DES CONNEXIONS SOCKET.IO
// ==========================================

io.on('connection', (socket) => {
    console.log(`🔌 Nouvelle connexion: ${socket.user.name} (${socket.user.id}) - Socket: ${socket.id}`);

    // Ajouter l'utilisateur au store
    connectedUsers.set(socket.id, {
        userId: socket.user.id,
        userName: socket.user.name,
        socketId: socket.id
    });

    // ==========================================
    // REJOINDRE UNE SESSION LIVE (AMÉLIORÉ)
    // ==========================================
    socket.on('join-live-session', async (data) => {
        try {
            const { sessionId, password } = data;
            console.log(`🏠 ${socket.user.name} tente de rejoindre la session ${sessionId}`);

            // Vérifier que la session existe
            const [sessions] = await db.execute(`
                SELECT ls.*, u.name as teacher_name, u.username as teacher_username
                FROM live_sessions ls
                LEFT JOIN users u ON ls.teacher_id = u.id
                WHERE ls.id = ?
            `, [sessionId]);

            if (sessions.length === 0) {
                console.log(`❌ Session ${sessionId} introuvable`);
                socket.emit('error', { message: 'Session introuvable' });
                return;
            }

            const session = sessions[0];
            console.log(`📋 Session trouvée: ${session.title} - Status: ${session.status}`);

            // Vérifier le mot de passe si nécessaire
            if (session.password && session.password !== password) {
                console.log(`🔒 Mot de passe incorrect pour session ${sessionId}`);
                socket.emit('error', { message: 'Mot de passe incorrect' });
                return;
            }

            // Rejoindre la room Socket.io
            socket.join(`session_${sessionId}`);
            socket.currentSession = sessionId;
            console.log(`✅ ${socket.user.name} a rejoint la room session_${sessionId}`);

            // Déterminer le rôle
            const isTeacher = socket.user.id === session.teacher_id;
            const role = isTeacher ? 'teacher' :
                socket.user.account_type === 'parent' ? 'parent' : 'student';

            socket.isTeacher = isTeacher;
            socket.role = role;

            // Ajouter à la base de données
            await db.execute(`
                INSERT INTO live_participants (session_id, user_id, role, is_active, joined_at)
                VALUES (?, ?, ?, 1, NOW())
                ON DUPLICATE KEY UPDATE 
                    is_active = 1, 
                    joined_at = NOW(), 
                    left_at = NULL
            `, [sessionId, socket.user.id, role]);

            // NOUVEAU: Ajouter au store des participants WebRTC
            if (!sessionParticipants.has(sessionId)) {
                sessionParticipants.set(sessionId, new Map());
            }

            const participantData = {
                id: socket.user.id,
                name: socket.user.name,
                username: socket.user.username,
                role: role,
                isTeacher: isTeacher,
                accountType: socket.user.account_type,
                profilePicture: socket.user.profile_picture,
                socketId: socket.id,
                mediaState: {
                    video: false,
                    audio: false,
                    screen: false,
                    muted: false
                },
                joinedAt: new Date()
            };

            sessionParticipants.get(sessionId).set(socket.user.id, participantData);

            // Mettre à jour le nombre de participants
            const [participantCount] = await db.execute(`
                SELECT COUNT(*) as count FROM live_participants 
                WHERE session_id = ? AND is_active = 1
            `, [sessionId]);

            await db.execute(`
                UPDATE live_sessions 
                SET current_participants = ?
                WHERE id = ?
            `, [participantCount[0].count, sessionId]);

            console.log(`📊 Participants actifs dans session ${sessionId}: ${participantCount[0].count}`);

            // Récupérer la liste des participants
            const [participants] = await db.execute(`
                SELECT lp.*, u.name as user_name, u.username, u.profile_picture, u.account_type
                FROM live_participants lp
                JOIN users u ON lp.user_id = u.id
                WHERE lp.session_id = ? AND lp.is_active = 1
                ORDER BY lp.joined_at ASC
            `, [sessionId]);

            // Envoyer confirmation à l'utilisateur
            socket.emit('joined-session', {
                sessionId,
                session: {
                    ...session,
                    password: undefined // Ne pas exposer le mot de passe
                },
                participants,
                role,
                isTeacher,
                webrtcConfig: WEBRTC_CONFIG
            });

            // Notifier les autres participants qu'un nouveau participant a rejoint
            socket.to(`session_${sessionId}`).emit('participant-joined', participantData);

            // Message système pour informer les autres participants
            const systemMessage = {
                id: `system_${Date.now()}`,
                user_id: 'system',
                user_name: 'Système',
                message: `${socket.user.name} a rejoint la session`,
                message_type: 'system',
                created_at: new Date().toISOString()
            };

            socket.to(`session_${sessionId}`).emit('new-message', systemMessage);

            // Mettre à jour la liste des participants pour tous
            const participantsList = Array.from(sessionParticipants.get(sessionId).values());
            io.to(`session_${sessionId}`).emit('participants-updated', participantsList);

            console.log(`✅ ${socket.user.name} a rejoint avec succès la session ${sessionId}`);

        } catch (error) {
            console.error('❌ Erreur join session:', error);
            socket.emit('error', { message: 'Erreur lors de la connexion à la session' });
        }
    });

    // ==========================================
    // WEBRTC - GESTION DES OFFRES
    // ==========================================
    socket.on('webrtc-offer', (data) => {
        const { offer, targetId, sessionId, fromName } = data;

        console.log('📤 WebRTC offer de', socket.user.name, 'vers', targetId);

        if (!socket.currentSession || socket.currentSession != sessionId) {
            console.log('❌ Session non autorisée pour WebRTC offer');
            socket.emit('webrtc-error', { message: 'Session non autorisée' });
            return;
        }

        // Trouver le socket du destinataire
        const sessionParts = sessionParticipants.get(sessionId);
        if (sessionParts && sessionParts.has(targetId)) {
            const targetParticipant = sessionParts.get(targetId);
            const targetSocketId = targetParticipant.socketId;
            const targetSocket = io.sockets.sockets.get(targetSocketId);

            if (targetSocket) {
                targetSocket.emit('webrtc-offer', {
                    offer,
                    fromId: socket.user.id,
                    fromName: socket.user.name,
                    sessionId
                });
                console.log('✅ WebRTC offer transférée vers', targetId);
            } else {
                console.log('❌ Socket cible introuvable pour WebRTC offer:', targetId);
            }
        } else {
            console.log('❌ Participant cible introuvable:', targetId);
        }
    });

    // ==========================================
    // WEBRTC - GESTION DES RÉPONSES
    // ==========================================
    socket.on('webrtc-answer', (data) => {
        const { answer, targetId, sessionId } = data;

        console.log('📤 WebRTC answer de', socket.user.name, 'vers', targetId);

        if (!socket.currentSession || socket.currentSession != sessionId) {
            return;
        }

        // Trouver le socket du destinataire
        const sessionParts = sessionParticipants.get(sessionId);
        if (sessionParts && sessionParts.has(targetId)) {
            const targetParticipant = sessionParts.get(targetId);
            const targetSocketId = targetParticipant.socketId;
            const targetSocket = io.sockets.sockets.get(targetSocketId);

            if (targetSocket) {
                targetSocket.emit('webrtc-answer', {
                    answer,
                    fromId: socket.user.id,
                    fromName: socket.user.name,
                    sessionId
                });
                console.log('✅ WebRTC answer transférée vers', targetId);
            }
        }
    });

    // ==========================================
    // WEBRTC - GESTION DES CANDIDATS ICE
    // ==========================================
    socket.on('webrtc-ice-candidate', (data) => {
        const { candidate, targetId, sessionId } = data;

        if (!socket.currentSession || socket.currentSession != sessionId) {
            return;
        }

        // Trouver le socket du destinataire
        const sessionParts = sessionParticipants.get(sessionId);
        if (sessionParts && sessionParts.has(targetId)) {
            const targetParticipant = sessionParts.get(targetId);
            const targetSocketId = targetParticipant.socketId;
            const targetSocket = io.sockets.sockets.get(targetSocketId);

            if (targetSocket) {
                targetSocket.emit('webrtc-ice-candidate', {
                    candidate,
                    fromId: socket.user.id,
                    fromName: socket.user.name,
                    sessionId
                });
            }
        }
    });

    // ==========================================
    // WEBRTC - CHANGEMENT D'ÉTAT DES MÉDIAS
    // ==========================================
    socket.on('media-state-changed', async (data) => {
        const { sessionId, userId, mediaState } = data;

        console.log('📻 Changement état média:', { userId, mediaState });

        if (!socket.currentSession || socket.currentSession != sessionId || socket.user.id != userId) {
            return;
        }

        try {
            // Mettre à jour l'état local
            const sessionParts = sessionParticipants.get(sessionId);
            if (sessionParts && sessionParts.has(userId)) {
                const participant = sessionParts.get(userId);
                participant.mediaState = { ...participant.mediaState, ...mediaState };
            }

            // Sauvegarder en base de données
            await db.execute(`
                UPDATE live_participants 
                SET media_state = ? 
                WHERE session_id = ? AND user_id = ?
            `, [JSON.stringify(mediaState), sessionId, userId]);

            // Notifier les autres participants
            socket.to(`session_${sessionId}`).emit('media-state-changed', {
                userId,
                mediaState,
                sessionId,
                userName: socket.user.name
            });

            console.log('✅ État média mis à jour pour:', socket.user.name);

        } catch (error) {
            console.error('❌ Erreur mise à jour état média:', error);
        }
    });

    // ==========================================
    // WEBRTC - PARTAGE D'ÉCRAN
    // ==========================================
    socket.on('screen-share-started', (data) => {
        const { sessionId } = data;

        console.log('🖥️ Partage d\'écran démarré par:', socket.user.name);

        if (!socket.currentSession || socket.currentSession != sessionId) {
            return;
        }

        socket.to(`session_${sessionId}`).emit('screen-share-started', {
            userId: socket.user.id,
            userName: socket.user.name,
            sessionId
        });
    });

    socket.on('screen-share-stopped', (data) => {
        const { sessionId } = data;

        console.log('🛑 Partage d\'écran arrêté par:', socket.user.name);

        if (!socket.currentSession || socket.currentSession != sessionId) {
            return;
        }

        socket.to(`session_${sessionId}`).emit('screen-share-stopped', {
            userId: socket.user.id,
            userName: socket.user.name,
            sessionId
        });
    });

    // ==========================================
    // PARTAGE DE DOCUMENTS
    // ==========================================
    socket.on('document-shared', (data) => {
        const { sessionId, fileName, fileType, fileSize } = data;

        console.log('📄 Document partagé par:', socket.user.name, fileName);

        if (!socket.currentSession || socket.currentSession != sessionId) {
            return;
        }

        socket.to(`session_${sessionId}`).emit('document-shared', {
            userId: socket.user.id,
            userName: socket.user.name,
            sessionId,
            fileName,
            fileType,
            fileSize
        });
    });

    // ==========================================
    // ENVOYER UN MESSAGE DANS LE CHAT (EXISTANT)
    // ==========================================
    socket.on('send-message', async (data) => {
        try {
            const { sessionId, message, messageType = 'text' } = data;
            console.log(`💬 ${socket.user.name} envoie un message dans session ${sessionId}: "${message}"`);

            // Vérifications
            if (!socket.currentSession || socket.currentSession != sessionId) {
                console.log(`❌ ${socket.user.name} n'est pas dans la session ${sessionId}`);
                socket.emit('error', { message: 'Vous devez rejoindre la session d\'abord' });
                return;
            }

            if (!message || message.trim().length === 0) {
                console.log(`❌ Message vide de ${socket.user.name}`);
                socket.emit('error', { message: 'Message vide' });
                return;
            }

            if (message.length > 500) {
                console.log(`❌ Message trop long de ${socket.user.name}`);
                socket.emit('error', { message: 'Message trop long (max 500 caractères)' });
                return;
            }

            // Sauvegarder le message en base
            const [result] = await db.execute(`
                INSERT INTO live_chat (session_id, user_id, message, message_type, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [sessionId, socket.user.id, message.trim(), messageType]);

            console.log(`💾 Message sauvegardé avec ID: ${result.insertId}`);

            // Créer l'objet message complet
            const newMessage = {
                id: result.insertId,
                session_id: sessionId,
                user_id: socket.user.id,
                user_name: socket.user.name,
                username: socket.user.username,
                profile_picture: socket.user.profile_picture,
                account_type: socket.user.account_type,
                message: message.trim(),
                message_type: messageType,
                created_at: new Date().toISOString()
            };

            // Envoyer le message à tous les participants de la session
            io.to(`session_${sessionId}`).emit('new-message', newMessage);
            console.log(`📤 Message diffusé à tous les participants de session_${sessionId}`);

        } catch (error) {
            console.error('❌ Erreur send message:', error);
            socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
        }
    });

    // ==========================================
    // QUITTER UNE SESSION (AMÉLIORÉ)
    // ==========================================
    socket.on('leave-session', async (data) => {
        try {
            if (socket.currentSession) {
                console.log(`🚪 ${socket.user.name} quitte volontairement la session ${socket.currentSession}`);
                await leaveSession(socket, socket.currentSession);
            }
        } catch (error) {
            console.error('❌ Erreur leave session:', error);
        }
    });

    // ==========================================
    // DÉCONNEXION (AMÉLIORÉ)
    // ==========================================
    socket.on('disconnect', async (reason) => {
        console.log(`👋 ${socket.user.name} s'est déconnecté - Raison: ${reason}`);

        // Retirer du store
        connectedUsers.delete(socket.id);

        // Quitter la session si l'utilisateur était dans une session
        if (socket.currentSession) {
            await leaveSession(socket, socket.currentSession);
        }
    });

    // ==========================================
    // FONCTION HELPER: QUITTER UNE SESSION (AMÉLIORÉE)
    // ==========================================
    async function leaveSession(socket, sessionId) {
        try {
            console.log(`🔄 Traitement de la sortie de ${socket.user.name} de la session ${sessionId}`);

            // Marquer comme inactif en base
            await db.execute(`
                UPDATE live_participants 
                SET is_active = 0, left_at = NOW()
                WHERE session_id = ? AND user_id = ?
            `, [sessionId, socket.user.id]);

            // NOUVEAU: Retirer du store des participants WebRTC
            const sessionParts = sessionParticipants.get(sessionId);
            if (sessionParts) {
                const participantData = sessionParts.get(socket.user.id);
                sessionParts.delete(socket.user.id);

                // Notifier les autres participants
                if (participantData) {
                    socket.to(`session_${sessionId}`).emit('participant-left', participantData);
                }

                // Nettoyer le store si vide
                if (sessionParts.size === 0) {
                    sessionParticipants.delete(sessionId);
                }
            }

            // Mettre à jour le nombre de participants
            const [participantCount] = await db.execute(`
                SELECT COUNT(*) as count FROM live_participants 
                WHERE session_id = ? AND is_active = 1
            `, [sessionId]);

            await db.execute(`
                UPDATE live_sessions 
                SET current_participants = ?
                WHERE id = ?
            `, [participantCount[0].count, sessionId]);

            // Quitter la room Socket.io
            socket.leave(`session_${sessionId}`);

            // Message système
            const systemMessage = {
                id: `system_${Date.now()}`,
                user_id: 'system',
                user_name: 'Système',
                message: `${socket.user.name} a quitté la session`,
                message_type: 'system',
                created_at: new Date().toISOString()
            };

            // Envoyer aux participants restants
            socket.to(`session_${sessionId}`).emit('new-message', systemMessage);

            // Mettre à jour la liste des participants
            const remainingParticipants = sessionParts ? Array.from(sessionParts.values()) : [];
            socket.to(`session_${sessionId}`).emit('participants-updated', remainingParticipants);

            socket.currentSession = null;
            socket.isTeacher = false;
            socket.role = null;

            console.log(`✅ ${socket.user.name} a quitté la session ${sessionId} - Participants restants: ${participantCount[0].count}`);

        } catch (error) {
            console.error('❌ Erreur leave session helper:', error);
        }
    }
});

// ==========================================
// ROUTES API (EXISTANTES + NOUVELLES)
// ==========================================

// Route de test étendue
app.get('/', (req, res) => {
    res.json({
        message: 'API Kaizenverse avec Socket.io + WebRTC fonctionnelle!',
        websocket: 'Socket.io activé pour le chat temps réel',
        webrtc: 'WebRTC activé pour streaming vidéo/audio',
        network: 'Configuré pour réseau local 192.168.1.62',
        stats: {
            connectedUsers: connectedUsers.size,
            activeSessions: activeSessions.size,
            totalParticipants: Array.from(sessionParticipants.values()).reduce((sum, session) => sum + session.size, 0)
        },
        time: new Date().toISOString()
    });
});

// Route de debug pour voir les utilisateurs connectés (améliorée)
app.get('/debug/users', (req, res) => {
    const users = Array.from(connectedUsers.values());
    const sessions = Array.from(sessionParticipants.entries()).map(([sessionId, participants]) => ({
        sessionId,
        participants: Array.from(participants.values())
    }));

    res.json({
        connectedUsers: users.length,
        users: users,
        activeSessions: sessions.length,
        sessions: sessions
    });
});

// NOUVELLE ROUTE: Statistiques WebRTC d'une session
app.get('/api/live/session/:sessionId/webrtc-stats', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        const sessionParts = sessionParticipants.get(sessionId);
        const participants = sessionParts ? Array.from(sessionParts.values()) : [];

        res.json({
            sessionId,
            participants: participants.length,
            participantsList: participants.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
                isTeacher: p.isTeacher,
                mediaState: p.mediaState,
                joinedAt: p.joinedAt
            })),
            webrtcConfig: WEBRTC_CONFIG
        });
    } catch (error) {
        console.error('❌ Erreur stats WebRTC:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// NOUVELLE ROUTE: Configuration WebRTC
app.get('/api/webrtc/config', (req, res) => {
    res.json({
        config: WEBRTC_CONFIG,
        supported: true,
        features: [
            'video-streaming',
            'audio-streaming',
            'screen-sharing',
            'document-sharing',
            'real-time-chat'
        ]
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    console.log(`🔍 Route non trouvée: ${req.originalUrl} - IP: ${req.ip}`);
    res.status(404).json({ error: 'Route non trouvée' });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ====================================');
    console.log('🎓 KAIZENVERSE SERVER STARTED');
    console.log('🚀 ====================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://192.168.1.62:${PORT}`);
    console.log('🔧 Features:');
    console.log('   ✅ REST API');
    console.log('   ✅ Socket.IO Real-time Chat');
    console.log('   ✅ WebRTC Video/Audio Streaming');
    console.log('   ✅ Screen Sharing');
    console.log('   ✅ Document Sharing');
    console.log('   ✅ Live Sessions Management');
    console.log('📡 WebSocket + WebRTC ready');
    console.log('🌍 Optimized for France & International');
    console.log('Routes disponibles:');
    console.log('- /api/auth (authentification)');
    console.log('- /api/live (sessions live)');
    console.log('- /api/messages (messagerie)');
    console.log('- /api/webrtc/config (config WebRTC)');
    console.log('- Socket.io: chat + WebRTC temps réel');
    console.log('- /debug/users (debug utilisateurs)');
    console.log('🚀 ====================================');
});