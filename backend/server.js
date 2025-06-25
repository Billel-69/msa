//Chargement des variables d'environnement
require('dotenv').config();
const connectMongoDB = require('./config/mongodb');

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
// SUPPRIMÉ: followRoutes car maintenant intégré dans authRoutes

// Importation de la route chat
const chatRoutes = require("./routes/chatRoutes");

// Connect to MongoDB
connectMongoDB();

const app = express();
const PORT = 5000;


// Middlewares
app.use(cors());
app.use(express.json());

// Accès statique au dossier uploads
app.use('/uploads', express.static('uploads'));

// Utilisation de la route pour chat
app.use("/api/chat", chatRoutes);

// Routes API - CHANGEMENT ICI : utilisez /api/auth pour les routes d'authentification
app.use('/api/auth', authRoutes);  // ⬅️ CHANGÉ de /api à /api/auth
app.use('/api', postRoutes);
app.use('/api/comments', commentRoutes);

// Additional routes mounting
const analyticsRoutes = require('./routes/analyticsRoutes');
const followRoutes = require('./routes/followRoutes');
const gameRoutes = require('./routes/gameRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const mongoRoutes = require('./routes/mongoRoutes');
const progressRoutes = require('./routes/progressRoutes');

app.use('/api/analytics', analyticsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mongo', mongoRoutes);
app.use('/api/progress', progressRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'API Kaizenverse fonctionnelle!' });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});