// Middleware pour la gestion du téléversement de fichiers avec Multer

const multer = require('multer');
const path = require('path');

// Configuration du stockage sur le disque
const storage = multer.diskStorage({
    // Définit le dossier de destination pour les fichiers téléversés
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Les fichiers seront stockés dans le dossier 'uploads/'
    },
    // Définit le nom du fichier sur le serveur
    filename: function (req, file, cb) {
        // Génère un nom de fichier unique pour éviter les conflits
        // Le nom est composé d'un timestamp, d'un nombre aléatoire et de l'extension originale du fichier
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que les fichiers de type image
const fileFilter = (req, file, cb) => {
    // Vérifie le type MIME du fichier
    if (file.mimetype.startsWith('image/')) {
        // Accepte le fichier
        cb(null, true);
    } else {
        // Rejette le fichier avec une erreur
        cb(new Error('Seules les images sont autorisées'), false);
    }
};

// Initialisation et configuration de Multer
const upload = multer({
    storage: storage, // Utilise la configuration de stockage définie ci-dessus
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite la taille des fichiers à 5MB
    },
    fileFilter: fileFilter // Applique le filtre de fichier défini ci-dessus
});

module.exports = upload;