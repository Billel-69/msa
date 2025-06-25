// Contrôleur pour la gestion des commentaires

const db = require('../config/db');

// Récupère tous les commentaires associés à un post spécifique
exports.getCommentsByPostId = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Log pour le débogage : ID du post reçu
        console.log('Récupération des commentaires pour le post:', postId);

        // Exécute la requête pour obtenir les commentaires avec les informations de l'utilisateur
        const [comments] = await db.execute(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at DESC
        `, [postId]);

        // Log pour le débogage : nombre de commentaires trouvés
        console.log('Commentaires trouvés:', comments.length);
        res.json(comments);
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la récupération des commentaires:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Ajoute un nouveau commentaire à un post
exports.createComment = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userId = req.user.id;

        // Log pour le débogage : données de création du commentaire
        console.log('Création commentaire:', { postId, content, userId });

        // Valide que le contenu du commentaire n'est pas vide
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
        }

        // Valide que l'ID du post est fourni
        if (!postId) {
            return res.status(400).json({ error: 'L\'ID du post est requis' });
        }

        // Vérifie si le post auquel le commentaire est ajouté existe réellement
        const [postExists] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        // Insère le nouveau commentaire dans la base de données
        const [result] = await db.execute(`
            INSERT INTO comments (post_id, user_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        `, [postId, userId, content.trim()]);

        // Récupère le commentaire fraîchement créé pour le renvoyer dans la réponse
        const [newComment] = await db.execute(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        // Log pour le débogage : commentaire créé
        console.log('Commentaire créé:', newComment[0]);
        res.status(201).json(newComment[0]);
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la création du commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprime un commentaire existant
exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        // Log pour le débogage : informations de suppression
        console.log('Suppression commentaire:', { commentId, userId });

        // Vérifie que le commentaire existe et que l'utilisateur en est bien l'auteur
        const [comment] = await db.execute(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Commentaire introuvable' });
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres commentaires' });
        }

        // Supprime le commentaire de la base de données
        await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);

        // Log pour le débogage : confirmation de la suppression
        console.log('Commentaire supprimé');
        res.json({ message: 'Commentaire supprimé avec succès' });
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la suppression du commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Met à jour un commentaire existant
exports.updateComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const { content } = req.body;
        const userId = req.user.id;

        // Log pour le débogage : informations de mise à jour
        console.log('Mise à jour commentaire:', { commentId, content, userId });

        // Valide que le nouveau contenu n'est pas vide
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
        }

        // Vérifie que le commentaire existe et appartient à l'utilisateur
        const [comment] = await db.execute(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Commentaire introuvable' });
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres commentaires' });
        }

        // Met à jour le contenu du commentaire dans la base de données
        await db.execute(
            'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?',
            [content.trim(), commentId]
        );

        // Récupère le commentaire mis à jour pour le renvoyer
        const [updatedComment] = await db.execute(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [commentId]);

        // Log pour le débogage : commentaire mis à jour
        console.log('Commentaire mis à jour:', updatedComment[0]);
        res.json(updatedComment[0]);
    } catch (err) {
        // Gestion des erreurs
        console.error('Erreur lors de la mise à jour du commentaire:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};