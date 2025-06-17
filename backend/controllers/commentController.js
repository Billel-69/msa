const db = require('../config/db');

// Ajouter un commentaire
exports.addComment = async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;
    const postId = req.params.id;

    if (!content.trim()) {
        return res.status(400).json({ error: 'Le contenu du commentaire ne peut pas être vide' });
    }

    try {
        // Vérifier que le post existe
        const [postExists] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ error: 'Post introuvable' });
        }

        // Ajouter le commentaire
        await db.execute(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        res.status(201).json({ message: 'Commentaire ajouté avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les commentaires d'un post
exports.getComments = async (req, res) => {
    const postId = req.params.id;

    try {
        const [comments] = await db.execute(`
            SELECT c.*, u.name as user_name, u.id as user_id
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [postId]);

        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.id;

    try {
        // Vérifier que le commentaire appartient à l'utilisateur
        const [comment] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [commentId]);

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Commentaire introuvable' });
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres commentaires' });
        }

        // Supprimer le commentaire
        await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);

        res.json({ message: 'Commentaire supprimé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};