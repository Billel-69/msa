const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const VideoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'uploads/videos/');
        } else if (file.fieldname === 'thumbnail') {
            cb(null, 'uploads/thumbnails/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB pour les vidéos
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Seuls les fichiers vidéo sont autorisés'));
            }
        } else if (file.fieldname === 'thumbnail') {
            const allowedTypes = /jpeg|jpg|png|gif|webp/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Seuls les fichiers image sont autorisés pour les miniatures'));
            }
        }
    }
});

// ==========================================
// ROUTES PUBLIQUES (pour les élèves)
// ==========================================

// Page principale - Récupérer toutes les vidéos avec filtres
router.get('/', VideoController.getAllVideos);

// Récupérer les vidéos par catégorie (style Netflix)
router.get('/by-category', VideoController.getVideosByCategory);

// Récupérer une vidéo spécifique par ID
router.get('/:id', authMiddleware, VideoController.getVideoById);

// Streamer une vidéo
router.get('/:id/stream', authMiddleware, VideoController.streamVideo);

// Marquer une vidéo comme vue/progress
router.post('/:id/view', authMiddleware, VideoController.markAsViewed);

// Liker/déliker une vidéo
router.post('/:id/like', authMiddleware, VideoController.toggleLike);

// Recherche de vidéos
router.get('/search/:query', VideoController.searchVideos);

// ==========================================
// ROUTES PROFESSEURS (gestion des vidéos)
// ==========================================

// Upload d'une nouvelle vidéo
router.post('/upload',
    authMiddleware,
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    VideoController.uploadVideo
);

// Récupérer les vidéos d'un professeur
router.get('/teacher/my-videos', authMiddleware, VideoController.getMyVideos);

// Modifier une vidéo
router.put('/:id', authMiddleware, VideoController.updateVideo);

// Supprimer une vidéo
router.delete('/:id', authMiddleware, VideoController.deleteVideo);

// Statistiques d'une vidéo
router.get('/:id/stats', authMiddleware, VideoController.getVideoStats);

// ==========================================
// ROUTES ADMINISTRATEUR
// ==========================================

// Modérer les vidéos
router.put('/:id/moderate', authMiddleware, VideoController.moderateVideo);

// Statistiques globales
router.get('/admin/stats', authMiddleware, VideoController.getGlobalStats);

module.exports = router;