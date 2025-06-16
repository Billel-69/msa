const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes'); // <-- Ajout ici

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Pour servir les images uploadées par multer
app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api', postRoutes);  // <-- Ajout ici

app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});
