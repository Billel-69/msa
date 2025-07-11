const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg'); // Pour les métadonnées vidéo
const db = require('../config/database');

// Configuration pour l'upload de vidéos
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
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

class VideoController {
    // ==========================================
    // UPLOAD ET GESTION DES VIDÉOS
    // ==========================================

    // Uploader une vidéo
    static async uploadVideo(req, res) {
        try {
            const { title, description, subject, level } = req.body;
            const teacher_id = req.user.id;

            // Vérifier que l'utilisateur est un professeur
            if (req.user.accountType !== 'teacher') {
                return res.status(403).json({ error: 'Seuls les professeurs peuvent uploader des vidéos' });
            }

            if (!req.files || !req.files.video) {
                return res.status(400).json({ error: 'Fichier vidéo requis' });
            }

            const video_url = req.files.video[0].filename;
            const thumbnail = req.files.thumbnail ? req.files.thumbnail[0].filename : null;

            // Obtenir la durée de la vidéo avec ffmpeg
            const videoPath = path.join('uploads/videos/', video_url);
            let duration = 0;

            try {
                duration = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(videoPath, (err, metadata) => {
                        if (err) reject(err);
                        else resolve(Math.round(metadata.format.duration));
                    });
                });
            } catch (err) {
                console.warn('Impossible de récupérer la durée de la vidéo:', err);
            }

            // Insérer en base
            const result = await db.query(
                'INSERT INTO videos (title, description, subject, level, video_url, thumbnail, duration, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, description, subject, level, video_url, thumbnail, duration, teacher_id]
            );

            res.json({
                success: true,
                videoId: result.insertId,
                message: 'Vidéo uploadée avec succès',
                duration: duration
            });
        } catch (error) {
            console.error('Erreur upload vidéo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Récupérer les vidéos d'un professeur
    static async getMyVideos(req, res) {
        try {
            const teacher_id = req.user.id;

            const videos = await db.query(`
                SELECT v.*, 
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as total_views,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as total_likes
                FROM videos v 
                WHERE v.teacher_id = ?
                ORDER BY v.created_at DESC
            `, [teacher_id]);

            res.json(videos);
        } catch (error) {
            console.error('Erreur récupération vidéos professeur:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Modifier une vidéo
    static async updateVideo(req, res) {
        try {
            const { id } = req.params;
            const { title, description, subject, level, status } = req.body;
            const teacher_id = req.user.id;

            // Vérifier que la vidéo appartient au professeur
            const video = await db.query('SELECT * FROM videos WHERE id = ? AND teacher_id = ?', [id, teacher_id]);
            if (!video.length) {
                return res.status(404).json({ error: 'Vidéo non trouvée ou non autorisée' });
            }

            await db.query(
                'UPDATE videos SET title = ?, description = ?, subject = ?, level = ?, status = ?, updated_at = NOW() WHERE id = ?',
                [title, description, subject, level, status, id]
            );

            res.json({ success: true, message: 'Vidéo mise à jour avec succès' });
        } catch (error) {
            console.error('Erreur mise à jour vidéo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Supprimer une vidéo
    static async deleteVideo(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Vérifier que la vidéo appartient au professeur
            const video = await db.query('SELECT * FROM videos WHERE id = ? AND teacher_id = ?', [id, teacher_id]);
            if (!video.length) {
                return res.status(404).json({ error: 'Vidéo non trouvée ou non autorisée' });
            }

            // Supprimer les fichiers
            const videoPath = path.join('uploads/videos/', video[0].video_url);
            const thumbnailPath = video[0].thumbnail ? path.join('uploads/thumbnails/', video[0].thumbnail) : null;

            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            if (thumbnailPath && fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }

            // Supprimer de la base
            await db.query('DELETE FROM videos WHERE id = ?', [id]);

            res.json({ success: true, message: 'Vidéo supprimée avec succès' });
        } catch (error) {
            console.error('Erreur suppression vidéo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ==========================================
    // CONSULTATION DES VIDÉOS (ÉLÈVES)
    // ==========================================

    // Récupérer toutes les vidéos avec filtres
    static async getAllVideos(req, res) {
        try {
            const { subject, level, search, limit = 20, offset = 0 } = req.query;

            let query = `
                SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.status = 'published'
            `;
            const params = [];

            if (subject) {
                query += ' AND v.subject = ?';
                params.push(subject);
            }

            if (level) {
                query += ' AND v.level = ?';
                params.push(level);
            }

            if (search) {
                query += ' AND (v.title LIKE ? OR v.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const videos = await db.query(query, params);

            // Ajouter les informations de visionnage pour l'utilisateur connecté
            if (req.user) {
                for (let video of videos) {
                    const userView = await db.query(
                        'SELECT * FROM video_views WHERE video_id = ? AND user_id = ?',
                        [video.id, req.user.id]
                    );
                    video.user_viewed = userView.length > 0;
                    video.user_progress = userView.length > 0 ? userView[0].watch_time : 0;
                    video.user_completed = userView.length > 0 ? userView[0].completed : false;
                }
            }

            res.json(videos);
        } catch (error) {
            console.error('Erreur récupération vidéos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Récupérer vidéos par catégorie (pour l'affichage Netflix)
    static async getVideosByCategory(req, res) {
        try {
            const categories = {
                'Mathématiques': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Français': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Sciences': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Histoire': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Anglais': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Espagnol': ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
                'Philosophie': ['1ère', 'Terminale'],
                'Économie': ['1ère', 'Terminale']
            };

            const result = {};

            for (const [subject, levels] of Object.entries(categories)) {
                const videos = await db.query(`
                    SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar,
                           (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                           (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count
                    FROM videos v 
                    JOIN users u ON v.teacher_id = u.id 
                    WHERE v.subject = ? AND v.status = 'published'
                    ORDER BY v.views_count DESC, v.created_at DESC
                    LIMIT 10
                `, [subject]);

                if (videos.length > 0) {
                    result[subject] = videos;
                }
            }

            // Ajouter une catégorie "Récemment ajoutées"
            const recentVideos = await db.query(`
                SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.status = 'published'
                ORDER BY v.created_at DESC
                LIMIT 15
            `);

            if (recentVideos.length > 0) {
                result['Récemment ajoutées'] = recentVideos;
            }

            // Ajouter une catégorie "Populaires"
            const popularVideos = await db.query(`
                SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.status = 'published'
                HAVING views_count > 0
                ORDER BY views_count DESC, v.created_at DESC
                LIMIT 12
            `);

            if (popularVideos.length > 0) {
                result['Populaires'] = popularVideos;
            }

            res.json(result);
        } catch (error) {
            console.error('Erreur récupération vidéos par catégorie:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Récupérer une vidéo spécifique
    static async getVideoById(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user?.id;

            const video = await db.query(`
                SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar, u.bio as teacher_bio,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id AND user_id = ?) as user_liked,
                       (SELECT watch_time FROM video_views WHERE video_id = v.id AND user_id = ?) as user_progress
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.id = ? AND v.status = 'published'
            `, [user_id, user_id, id]);

            if (!video.length) {
                return res.status(404).json({ error: 'Vidéo non trouvée' });
            }

            // Incrémenter les vues
            if (user_id) {
                await db.query(
                    'INSERT INTO video_views (video_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = NOW()',
                    [id, user_id]
                );
            }

            // Récupérer les vidéos similaires
            const similarVideos = await db.query(`
                SELECT v.*, u.name as teacher_name,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.subject = ? AND v.id != ? AND v.status = 'published'
                ORDER BY RAND()
                LIMIT 6
            `, [video[0].subject, id]);

            res.json({
                video: video[0],
                similarVideos: similarVideos
            });
        } catch (error) {
            console.error('Erreur récupération vidéo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Streamer une vidéo
    static async streamVideo(req, res) {
        try {
            const { id } = req.params;
            const range = req.headers.range;

            // Vérifier que la vidéo existe
            const video = await db.query('SELECT * FROM videos WHERE id = ? AND status = "published"', [id]);
            if (!video.length) {
                return res.status(404).json({ error: 'Vidéo non trouvée' });
            }

            const videoPath = path.join('uploads/videos/', video[0].video_url);

            if (!fs.existsSync(videoPath)) {
                return res.status(404).json({ error: 'Fichier vidéo non trouvé' });
            }

            const stat = fs.statSync(videoPath);
            const fileSize = stat.size;

            if (range) {
                // Streaming avec range request
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(videoPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                // Streaming normal
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, head);
                fs.createReadStream(videoPath).pipe(res);
            }
        } catch (error) {
            console.error('Erreur streaming vidéo:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Marquer une vidéo comme vue
    static async markAsViewed(req, res) {
        try {
            const { id } = req.params;
            const { watchTime, completed } = req.body;
            const user_id = req.user.id;

            await db.query(
                `INSERT INTO video_views (video_id, user_id, watch_time, completed) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE watch_time = ?, completed = ?`,
                [id, user_id, watchTime, completed, watchTime, completed]
            );

            res.json({ success: true, message: 'Progression sauvegardée' });
        } catch (error) {
            console.error('Erreur sauvegarde progression:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Liker/déliker une vidéo
    static async toggleLike(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const existingLike = await db.query(
                'SELECT * FROM video_likes WHERE video_id = ? AND user_id = ?',
                [id, user_id]
            );

            if (existingLike.length > 0) {
                // Déliker
                await db.query('DELETE FROM video_likes WHERE video_id = ? AND user_id = ?', [id, user_id]);
                res.json({ success: true, liked: false, message: 'Like retiré' });
            } else {
                // Liker
                await db.query('INSERT INTO video_likes (video_id, user_id) VALUES (?, ?)', [id, user_id]);
                res.json({ success: true, liked: true, message: 'Vidéo likée' });
            }
        } catch (error) {
            console.error('Erreur toggle like:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Recherche de vidéos
    static async searchVideos(req, res) {
        try {
            const { query } = req.params;
            const { subject, level, limit = 20, offset = 0 } = req.query;

            let sqlQuery = `
                SELECT v.*, u.name as teacher_name, u.profile_picture as teacher_avatar,
                       (SELECT COUNT(*) FROM video_views WHERE video_id = v.id) as views_count,
                       (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes_count
                FROM videos v 
                JOIN users u ON v.teacher_id = u.id 
                WHERE v.status = 'published' AND (v.title LIKE ? OR v.description LIKE ?)
            `;
            const params = [`%${query}%`, `%${query}%`];

            if (subject) {
                sqlQuery += ' AND v.subject = ?';
                params.push(subject);
            }

            if (level) {
                sqlQuery += ' AND v.level = ?';
                params.push(level);
            }

            sqlQuery += ' ORDER BY v.views_count DESC, v.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const videos = await db.query(sqlQuery, params);

            res.json(videos);
        } catch (error) {
            console.error('Erreur recherche vidéos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Statistiques d'une vidéo
    static async getVideoStats(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Vérifier que la vidéo appartient au professeur
            const video = await db.query('SELECT * FROM videos WHERE id = ? AND teacher_id = ?', [id, teacher_id]);
            if (!video.length) {
                return res.status(404).json({ error: 'Vidéo non trouvée' });
            }

            // Statistiques détaillées
            const stats = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM video_views WHERE video_id = ?) as total_views,
                    (SELECT COUNT(*) FROM video_likes WHERE video_id = ?) as total_likes,
                    (SELECT COUNT(*) FROM video_views WHERE video_id = ? AND completed = 1) as completed_views,
                    (SELECT AVG(watch_time) FROM video_views WHERE video_id = ?) as avg_watch_time
            `, [id, id, id, id]);

            res.json(stats[0]);
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = VideoController;