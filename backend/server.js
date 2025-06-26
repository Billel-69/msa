const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io avec CORS
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Import des routes existantes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const liveRoutes = require('./routes/liveRoutes');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/live', liveRoutes);

// ==========================================
// SOCKET.IO - GESTION DU CHAT TEMPS RÉEL
// ==========================================

// Middleware d'authentification Socket.io
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Récupérer les infos utilisateur
        const [users] = await db.execute(
            'SELECT id, name, username, account_type, profile_picture FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return next(new Error('Utilisateur introuvable'));
        }

        socket.user = users[0];
        next();
    } catch (error) {
        console.error('Erreur auth socket:', error);
        next(new Error('Token invalide'));
    }
};

// Appliquer le middleware d'authentification
io.use(authenticateSocket);

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log(`👤 Utilisateur connecté: ${socket.user.name} (${socket.user.id})`);

    // ==========================================
    // REJOINDRE UNE SESSION LIVE
    // ==========================================
    socket.on('join-live-session', async (data) => {
        try {
            const { sessionId } = data;
            console.log(`🏠 ${socket.user.name} rejoint la session ${sessionId}`);

            // Vérifier que la session existe et que l'utilisateur peut y accéder
            const [sessions] = await db.execute(`
                SELECT ls.*, u.name as teacher_name
                FROM live_sessions ls
                LEFT JOIN users u ON ls.teacher_id = u.id
                WHERE ls.id = ? AND ls.status IN ('live', 'waiting')
            `, [sessionId]);

            if (sessions.length === 0) {
                socket.emit('error', { message: 'Session introuvable ou terminée' });
                return;
            }

            const session = sessions[0];

            // Vérifier le mot de passe si nécessaire
            if (session.password && data.password !== session.password) {
                socket.emit('error', { message: 'Mot de passe incorrect' });
                return;
            }

            // Rejoindre la room Socket.io
            socket.join(`session_${sessionId}`);
            socket.currentSession = sessionId;

            // Ajouter à la base de données
            await db.execute(`
                INSERT INTO live_participants (session_id, user_id, role, is_active)
                VALUES (?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE is_active = 1, joined_at = NOW(), left_at = NULL
            `, [sessionId, socket.user.id, socket.user.id === session.teacher_id ? 'teacher' : 'student']);

            // Mettre à jour le nombre de participants
            await db.execute(`
                UPDATE live_sessions 
                SET current_participants = (
                    SELECT COUNT(*) FROM live_participants 
                    WHERE session_id = ? AND is_active = 1
                )
                WHERE id = ?
            `, [sessionId, sessionId]);

            // Envoyer confirmation à l'utilisateur
            socket.emit('joined-session', {
                sessionId,
                session: {
                    ...session,
                    password: undefined // Ne pas exposer le mot de passe
                }
            });

            // Message système pour informer les autres participants
            const systemMessage = {
                id: Date.now(),
                user_id: 'system',
                user_name: 'Système',
                message: `${socket.user.name} a rejoint la session`,
                message_type: 'system',
                created_at: new Date().toISOString()
            };

            socket.to(`session_${sessionId}`).emit('new-message', systemMessage);

            console.log(`✅ ${socket.user.name} a rejoint la session ${sessionId}`);

        } catch (error) {
            console.error('Erreur join session:', error);
            socket.emit('error', { message: 'Erreur lors de la connexion à la session' });
        }
    });

    // ==========================================
    // ENVOYER UN MESSAGE DANS LE CHAT
    // ==========================================
    socket.on('send-message', async (data) => {
        try {
            const { sessionId, message, messageType = 'text' } = data;

            if (!socket.currentSession || socket.currentSession != sessionId) {
                socket.emit('error', { message: 'Vous devez rejoindre la session d\'abord' });
                return;
            }

            if (!message || message.trim().length === 0) {
                socket.emit('error', { message: 'Message vide' });
                return;
            }

            if (message.length > 500) {
                socket.emit('error', { message: 'Message trop long (max 500 caractères)' });
                return;
            }

            // Vérifier que la session est en cours
            const [sessions] = await db.execute(`
                SELECT status FROM live_sessions WHERE id = ?
            `, [sessionId]);

            if (sessions.length === 0 || sessions[0].status !== 'live') {
                socket.emit('error', { message: 'La session doit être en cours pour envoyer des messages' });
                return;
            }

            // Sauvegarder le message en base
            const [result] = await db.execute(`
                INSERT INTO live_chat (session_id, user_id, message, message_type, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [sessionId, socket.user.id, message.trim(), messageType]);

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

            console.log(`💬 Message de ${socket.user.name} dans session ${sessionId}: ${message.trim()}`);

        } catch (error) {
            console.error('Erreur send message:', error);
            socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
        }
    });

    // ==========================================
    // QUITTER UNE SESSION
    // ==========================================
    socket.on('leave-session', async (data) => {
        try {
            const { sessionId } = data;

            if (socket.currentSession) {
                await leaveSession(socket, socket.currentSession);
            }

        } catch (error) {
            console.error('Erreur leave session:', error);
        }
    });

    // ==========================================
    // DÉCONNEXION
    // ==========================================
    socket.on('disconnect', async () => {
        console.log(`👋 ${socket.user.name} s'est déconnecté`);

        // Quitter la session si l'utilisateur était dans une session
        if (socket.currentSession) {
            await leaveSession(socket, socket.currentSession);
        }
    });

    // ==========================================
    // FONCTION HELPER: QUITTER UNE SESSION
    // ==========================================
    async function leaveSession(socket, sessionId) {
        try {
            // Marquer comme inactif en base
            await db.execute(`
                UPDATE live_participants 
                SET is_active = 0, left_at = NOW()
                WHERE session_id = ? AND user_id = ?
            `, [sessionId, socket.user.id]);

            // Mettre à jour le nombre de participants
            await db.execute(`
                UPDATE live_sessions 
                SET current_participants = (
                    SELECT COUNT(*) FROM live_participants 
                    WHERE session_id = ? AND is_active = 1
                )
                WHERE id = ?
            `, [sessionId, sessionId]);

            // Quitter la room Socket.io
            socket.leave(`session_${sessionId}`);

            // Message système
            const systemMessage = {
                id: Date.now(),
                user_id: 'system',
                user_name: 'Système',
                message: `${socket.user.name} a quitté la session`,
                message_type: 'system',
                created_at: new Date().toISOString()
            };

            socket.to(`session_${sessionId}`).emit('new-message', systemMessage);
            socket.currentSession = null;

            console.log(`🚪 ${socket.user.name} a quitté la session ${sessionId}`);

        } catch (error) {
            console.error('Erreur leave session helper:', error);
        }
    }
});

// Route de test
app.get('/', (req, res) => {
    res.json({
        message: 'API Kaizenverse avec Socket.io fonctionnelle!',
        websocket: 'Socket.io activé pour le chat temps réel'
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    console.log('Route non trouvée:', req.originalUrl);
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur avec Socket.io
server.listen(PORT, () => {
    console.log(`🚀 Serveur backend + Socket.io démarré sur http://localhost:${PORT}`);
    console.log('📡 WebSocket prêt pour le chat temps réel');
    console.log('Routes disponibles:');
    console.log('- /api/auth (authentification)');
    console.log('- /api/live (sessions live)');
    console.log('- /api/messages (messagerie)');
    console.log('- Socket.io: chat temps réel');
});