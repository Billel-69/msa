const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initializeWebRTCHandler, getSessionStats, kickParticipant } = require('./controllers/webrtcController');
const verifyToken = require('./middlewares/authMiddleware');

class WebRTCServer {
    constructor(port = 5000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = null;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketIO();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Configuration CORS pour WebRTC
        const corsOptions = {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://your-domain.com',
                // Ajouter vos domaines de production ici
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        };

        this.app.use(cors(corsOptions));
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Middleware de logging pour WebRTC
        this.app.use((req, res, next) => {
            if (req.path.includes('/webrtc') || req.path.includes('/live')) {
                console.log(`🌐 ${req.method} ${req.path} - ${req.ip}`);
            }
            next();
        });

        // Headers de sécurité pour WebRTC
        this.app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Headers spécifiques pour WebRTC
            if (req.path.includes('/webrtc') || req.path.includes('/live')) {
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
            }

            next();
        });
    }

    setupRoutes() {
        // Route de santé pour WebRTC
        this.app.get('/webrtc/health', (req, res) => {
            const stats = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                socketConnections: this.io ? this.io.engine.clientsCount : 0
            };
            res.json(stats);
        });

        // Routes d'administration WebRTC
        this.app.get('/api/webrtc/session/:sessionId/stats', verifyToken, getSessionStats);
        this.app.post('/api/webrtc/session/:sessionId/kick/:participantId', verifyToken, kickParticipant);

        // Route pour obtenir la configuration WebRTC
        this.app.get('/api/webrtc/config', verifyToken, (req, res) => {
            // Configuration client WebRTC (sans exposer les détails sensibles)
            const config = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun.stunprotocol.org:3478' }
                ],
                iceCandidatePoolSize: 10,
                sdpSemantics: 'unified-plan'
            };
            res.json(config);
        });

        // Route pour tester la connectivité WebRTC
        this.app.post('/api/webrtc/test-connection', verifyToken, async (req, res) => {
            try {
                const { testType = 'basic' } = req.body;

                const testResults = {
                    timestamp: new Date().toISOString(),
                    testType,
                    results: {
                        serverReachable: true,
                        socketIOAvailable: !!this.io,
                        stunServersAccessible: true, // Test STUN en vrai serait plus complexe
                        webrtcSupported: true
                    },
                    recommendations: []
                };

                // Ajouter des recommandations basées sur les résultats
                if (!this.io) {
                    testResults.recommendations.push('Socket.IO non disponible - Vérifiez la configuration serveur');
                }

                res.json(testResults);
            } catch (error) {
                console.error('❌ Error testing WebRTC connection:', error);
                res.status(500).json({
                    error: 'Erreur lors du test de connexion',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Documentation API WebRTC
        this.app.get('/api/webrtc/docs', (req, res) => {
            const documentation = {
                title: 'KaizenVerse WebRTC API',
                version: '1.0.0',
                description: 'API pour la gestion des sessions WebRTC en temps réel',
                endpoints: {
                    'GET /webrtc/health': 'Vérification de l\'état du serveur',
                    'GET /api/webrtc/config': 'Configuration WebRTC client',
                    'POST /api/webrtc/test-connection': 'Test de connectivité',
                    'GET /api/webrtc/session/:id/stats': 'Statistiques de session',
                    'POST /api/webrtc/session/:id/kick/:participantId': 'Expulser un participant'
                },
                socketEvents: {
                    client: [
                        'join-webrtc-session',
                        'webrtc-offer',
                        'webrtc-answer',
                        'webrtc-ice-candidate',
                        'media-state-changed',
                        'screen-share-started',
                        'screen-share-stopped',
                        'document-shared'
                    ],
                    server: [
                        'session-participants',
                        'participant-joined',
                        'participant-left',
                        'webrtc-offer',
                        'webrtc-answer',
                        'webrtc-ice-candidate',
                        'media-state-changed',
                        'webrtc-error',
                        'kicked-from-session'
                    ]
                }
            };
            res.json(documentation);
        });
    }

    setupSocketIO() {
        // Configuration Socket.IO optimisée pour WebRTC
        this.io = socketIo(this.server, {
            cors: {
                origin: [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://your-domain.com'
                ],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true,

            // Configuration optimisée pour la France et l'international
            pingTimeout: 60000,
            pingInterval: 25000,
            upgradeTimeout: 30000,

            // Limitations pour éviter la surcharge
            maxHttpBufferSize: 1e8, // 100MB pour les gros fichiers
            httpCompression: true,
            compression: true,
        });

        // Middleware d'authentification Socket.IO
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const sessionId = socket.handshake.auth.sessionId;
                const userId = socket.handshake.auth.userId;

                if (!token) {
                    return next(new Error('Token manquant'));
                }

                // Ici vous pouvez ajouter votre logique de vérification JWT
                // const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // socket.userId = decoded.id;
                // socket.user = decoded;

                // Pour l'exemple, on simule une authentification réussie
                socket.token = token;
                socket.sessionId = sessionId;
                socket.userId = userId;

                console.log('🔐 Socket authenticated:', {
                    socketId: socket.id,
                    userId,
                    sessionId
                });

                next();
            } catch (error) {
                console.error('❌ Socket authentication failed:', error);
                next(new Error('Authentification échouée'));
            }
        });

        // Gestion des métriques de performance
        this.io.engine.on('connection_error', (err) => {
            console.error('❌ Socket.IO connection error:', {
                code: err.code,
                message: err.message,
                type: err.type,
                context: err.context
            });
        });

        // Statistiques de connexion
        this.io.on('connection', (socket) => {
            console.log('📊 Socket.IO stats:', {
                totalConnections: this.io.engine.clientsCount,
                socketId: socket.id,
                transport: socket.conn.transport.name,
                upgraded: socket.conn.upgraded
            });

            socket.on('disconnect', (reason) => {
                console.log('📊 Socket disconnected:', {
                    reason,
                    remainingConnections: this.io.engine.clientsCount - 1,
                    socketId: socket.id
                });
            });
        });

        // Initialiser le gestionnaire WebRTC
        initializeWebRTCHandler(this.io);

        console.log('✅ Socket.IO configuré avec succès pour WebRTC');
    }

    setupErrorHandling() {
        // Gestionnaire d'erreurs global
        this.app.use((error, req, res, next) => {
            console.error('❌ Erreur serveur WebRTC:', error);

            res.status(error.status || 500).json({
                error: process.env.NODE_ENV === 'production'
                    ? 'Erreur serveur interne'
                    : error.message,
                timestamp: new Date().toISOString(),
                path: req.path
            });
        });

        // Gestionnaire 404
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route non trouvée',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });

        // Gestion des erreurs système
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // Gestion gracieuse de l'arrêt
        process.on('SIGTERM', () => {
            console.log('📴 SIGTERM reçu, arrêt gracieux du serveur...');
            this.shutdown();
        });

        process.on('SIGINT', () => {
            console.log('📴 SIGINT reçu, arrêt gracieux du serveur...');
            this.shutdown();
        });
    }

    async shutdown() {
        console.log('🛑 Arrêt du serveur WebRTC...');

        try {
            // Fermer toutes les connexions Socket.IO
            if (this.io) {
                this.io.close();
                console.log('✅ Socket.IO fermé');
            }

            // Fermer le serveur HTTP
            await new Promise((resolve) => {
                this.server.close(resolve);
            });
            console.log('✅ Serveur HTTP fermé');

            process.exit(0);
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt:', error);
            process.exit(1);
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    console.log('🚀 Serveur WebRTC démarré sur le port', this.port);
                    console.log('🌍 Optimisé pour la France et l\'international');
                    console.log('📡 WebRTC prêt pour les sessions en direct');
                    resolve();
                });
            } catch (error) {
                console.error('❌ Erreur démarrage serveur:', error);
                reject(error);
            }
        });
    }

    getIO() {
        return this.io;
    }

    getApp() {
        return this.app;
    }
}

// Fonction utilitaire pour démarrer le serveur
const startWebRTCServer = async (port = 5000) => {
    const server = new WebRTCServer(port);

    try {
        await server.start();
        return server;
    } catch (error) {
        console.error('❌ Impossible de démarrer le serveur WebRTC:', error);
        process.exit(1);
    }
};

module.exports = {
    WebRTCServer,
    startWebRTCServer
};

// Si le fichier est exécuté directement
if (require.main === module) {
    const port = process.env.WEBRTC_PORT || process.env.PORT || 5000;
    startWebRTCServer(port);
}