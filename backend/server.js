const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Accès statique au dossier uploads
app.use('/uploads', express.static('uploads'));

// Routes API
app.use('/api', authRoutes);
app.use('/api', postRoutes);
app.use('/api', followRoutes);
app.use('/api', commentRoutes);

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