const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const gameRoutes = require('./routes/gameRoutes'); // Mini-games routes
const quizRoutes = require('./routes/quizRoutes'); // Quiz routes
const connectMongoDB = require('./config/mongodb'); // MongoDB connection

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
connectMongoDB();

// Accès statique au dossier uploads
app.use('/uploads', express.static('uploads'));

// Middleware de logging pour debug (DÉPLACER AVANT LES ROUTES)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/games', gameRoutes); // Mini-games API routes
app.use('/api/quizzes', quizRoutes); // Quiz API routes

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'API Kaizenverse fonctionnelle!' });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    console.log('Route non trouvée:', req.originalUrl);
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});