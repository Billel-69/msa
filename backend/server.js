const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');

const connectMongoDB = require('./config/mongodb'); // MongoDB connection

const app = express();
const PORT = process.env.PORT || 5000;

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