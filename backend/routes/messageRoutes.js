const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// ==========================================
// ROUTE: Obtenir toutes les conversations d'un utilisateur
// ==========================================
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT
                c.id as conversation_id,
                c.created_at,
                c.updated_at,
                CASE
                    WHEN c.participant1_id = ? THEN c.participant2_id
                    ELSE c.participant1_id
                    END as other_user_id,
                CASE
                    WHEN c.participant1_id = ? THEN u2.name
                    ELSE u1.name
                    END as other_user_name,
                CASE
                    WHEN c.participant1_id = ? THEN u2.username
                    ELSE u1.username
                    END as other_user_username,
                CASE
                    WHEN c.participant1_id = ? THEN u2.profile_picture
                    ELSE u1.profile_picture
                    END as other_user_picture,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
            FROM conversations c
                LEFT JOIN users u1 ON c.participant1_id = u1.id
                LEFT JOIN users u2 ON c.participant2_id = u2.id
            WHERE c.participant1_id = ? OR c.participant2_id = ?
            ORDER BY c.updated_at DESC
        `;

        const [conversations] = await db.execute(query, [
            userId, userId, userId, userId, userId, userId, userId
        ]);

        res.json(conversations);

    } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Obtenir ou créer une conversation avec un autre utilisateur
// ==========================================
router.get('/conversation/with/:otherUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = parseInt(req.params.otherUserId);

        // Vérifier que l'autre utilisateur existe
        const [userCheck] = await db.execute(
            'SELECT id, name, username, profile_picture FROM users WHERE id = ?',
            [otherUserId]
        );

        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Chercher une conversation existante
        let query = `
            SELECT id FROM conversations
            WHERE (participant1_id = ? AND participant2_id = ?)
               OR (participant1_id = ? AND participant2_id = ?)
        `;

        const [existing] = await db.execute(query, [
            userId, otherUserId, otherUserId, userId
        ]);

        let conversationId;

        if (existing.length > 0) {
            conversationId = existing[0].id;
        } else {
            // Créer une nouvelle conversation
            const [result] = await db.execute(
                'INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)',
                [Math.min(userId, otherUserId), Math.max(userId, otherUserId)]
            );
            conversationId = result.insertId;
        }

        res.json({
            conversationId,
            otherUser: userCheck[0]
        });

    } catch (error) {
        console.error('Erreur lors de la récupération/création de conversation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Obtenir les détails d'une conversation existante
// ==========================================
router.get('/conversation/:conversationId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);

        // Vérifier que l'utilisateur fait partie de la conversation et récupérer les détails
        const query = `
            SELECT
                c.id as conversation_id,
                c.created_at,
                c.updated_at,
                CASE
                    WHEN c.participant1_id = ? THEN c.participant2_id
                    ELSE c.participant1_id
                    END as other_user_id,
                CASE
                    WHEN c.participant1_id = ? THEN u2.name
                    ELSE u1.name
                    END as other_user_name,
                CASE
                    WHEN c.participant1_id = ? THEN u2.username
                    ELSE u1.username
                    END as other_user_username,
                CASE
                    WHEN c.participant1_id = ? THEN u2.profile_picture
                    ELSE u1.profile_picture
                    END as other_user_picture
            FROM conversations c
                     LEFT JOIN users u1 ON c.participant1_id = u1.id
                     LEFT JOIN users u2 ON c.participant2_id = u2.id
            WHERE c.id = ? AND (c.participant1_id = ? OR c.participant2_id = ?)
        `;

        const [conversation] = await db.execute(query, [
            userId, userId, userId, userId, conversationId, userId, userId
        ]);

        if (conversation.length === 0) {
            return res.status(404).json({ error: 'Conversation introuvable ou accès non autorisé' });
        }

        res.json(conversation[0]);

    } catch (error) {
        console.error('Erreur lors de la récupération de la conversation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Obtenir les messages d'une conversation - VERSION CORRIGÉE
// ==========================================
router.get('/conversation/:conversationId/messages', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);

        // CORRECTION : Validation et conversion des paramètres
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);

        // Valeurs par défaut sécurisées
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1 || limit > 100) limit = 50;

        const offset = (page - 1) * limit;

        console.log('Paramètres de pagination:', { page, limit, offset, conversationId });

        // Vérifier que l'utilisateur fait partie de la conversation
        const [convCheck] = await db.execute(
            'SELECT id FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
            [conversationId, userId, userId]
        );

        if (convCheck.length === 0) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Récupérer les messages - REQUÊTE SIMPLIFIÉE SANS LIMIT/OFFSET pour debug
        const query = `
            SELECT 
                m.id,
                m.content,
                m.sender_id,
                m.is_read,
                m.created_at,
                u.name as sender_name,
                u.username as sender_username,
                u.profile_picture as sender_picture
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `;

        console.log('Exécution de la requête messages avec conversationId:', conversationId);

        const [messages] = await db.execute(query, [conversationId]);

        console.log('Messages récupérés:', messages.length);

        // Marquer les messages comme lus
        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
            [conversationId, userId]
        );

        // Appliquer la pagination côté application pour l'instant
        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedMessages = messages.slice(startIndex, endIndex);

        res.json(paginatedMessages);

    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Envoyer un message
// ==========================================
router.post('/conversation/:conversationId/send', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);
        const { content } = req.body;

        console.log('Envoi de message:', { userId, conversationId, content });

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le message ne peut pas être vide' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Le message est trop long (max 1000 caractères)' });
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const [convCheck] = await db.execute(
            'SELECT id FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
            [conversationId, userId, userId]
        );

        if (convCheck.length === 0) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Insérer le message
        const [result] = await db.execute(
            'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
            [conversationId, userId, content.trim()]
        );

        // Mettre à jour la conversation
        await db.execute(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [conversationId]
        );

        // Récupérer le message complet
        const [newMessage] = await db.execute(`
            SELECT
                m.id,
                m.content,
                m.sender_id,
                m.is_read,
                m.created_at,
                u.name as sender_name,
                u.username as sender_username,
                u.profile_picture as sender_picture
            FROM messages m
                     LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        `, [result.insertId]);

        console.log('Message créé avec succès:', newMessage[0]);
        res.status(201).json(newMessage[0]);

    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Supprimer un message
// ==========================================
router.delete('/message/:messageId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = parseInt(req.params.messageId);

        // Vérifier que le message appartient à l'utilisateur
        const [messageCheck] = await db.execute(
            'SELECT id FROM messages WHERE id = ? AND sender_id = ?',
            [messageId, userId]
        );

        if (messageCheck.length === 0) {
            return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres messages' });
        }

        // Supprimer le message
        await db.execute('DELETE FROM messages WHERE id = ?', [messageId]);

        res.json({ message: 'Message supprimé' });

    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Marquer une conversation comme lue
// ==========================================
router.put('/conversation/:conversationId/read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);

        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
            [conversationId, userId]
        );

        res.json({ message: 'Messages marqués comme lus' });

    } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Rechercher des utilisateurs pour commencer une conversation
// ==========================================
router.get('/search-users', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'La recherche doit contenir au moins 2 caractères' });
        }

        const searchTerm = `%${q.trim()}%`;

        const [users] = await db.execute(`
            SELECT id, name, username, profile_picture
            FROM users
            WHERE id != ? 
            AND (name LIKE ? OR username LIKE ?)
            ORDER BY name
                LIMIT 20
        `, [userId, searchTerm, searchTerm]);

        res.json(users);

    } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;