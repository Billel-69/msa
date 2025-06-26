const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middlewares/authMiddleware');

// ==========================================
// Fonction pour générer un code de salle unique
// ==========================================
const generateRoomCode = async () => {
    let code;
    let exists = true;

    while (exists) {
        // Générer un code type "AB1234"
        const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
            String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        code = letters + numbers;

        // Vérifier si le code existe déjà
        const [existing] = await db.execute('SELECT id FROM live_sessions WHERE room_code = ?', [code]);
        exists = existing.length > 0;
    }

    return code;
};

// ==========================================
// ROUTE: Obtenir toutes les sessions actives (publiques)
// ==========================================
router.get('/active-sessions', verifyToken, async (req, res) => {
    try {
        console.log('Récupération des sessions actives...');

        const [sessions] = await db.execute(`
            SELECT
                ls.*,
                u.name as teacher_name,
                u.username as teacher_username
            FROM live_sessions ls
                     LEFT JOIN users u ON ls.teacher_id = u.id
            WHERE ls.status IN ('live', 'waiting')
            ORDER BY ls.status = 'live' DESC, ls.created_at DESC
        `);

        console.log(`Sessions actives trouvées: ${sessions.length}`);
        res.json(sessions);

    } catch (error) {
        console.error('Erreur lors de la récupération des sessions actives:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Obtenir mes sessions (pour les professeurs)
// ==========================================
router.get('/my-sessions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Vérifier que l'utilisateur est un professeur ou parent
        if (!['teacher', 'parent'].includes(req.user.accountType)) {
            return res.status(403).json({ error: 'Accès réservé aux professeurs et parents' });
        }

        console.log('Récupération des sessions pour le professeur:', userId);

        const [sessions] = await db.execute(`
            SELECT
                ls.*,
                u.name as teacher_name,
                u.username as teacher_username
            FROM live_sessions ls
                     LEFT JOIN users u ON ls.teacher_id = u.id
            WHERE ls.teacher_id = ?
            ORDER BY ls.created_at DESC
        `, [userId]);

        console.log(`Sessions du professeur trouvées: ${sessions.length}`);
        res.json(sessions);

    } catch (error) {
        console.error('Erreur lors de la récupération des sessions du professeur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Créer une nouvelle session
// ==========================================
router.post('/create-session', verifyToken, async (req, res) => {
    try {
        const { title, description, subject, maxParticipants, password } = req.body;
        const teacherId = req.user.id;

        // Vérifier que l'utilisateur est un professeur ou parent
        if (!['teacher', 'parent'].includes(req.user.accountType)) {
            return res.status(403).json({ error: 'Seuls les professeurs et parents peuvent créer des sessions' });
        }

        // Validation des données
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Le titre est obligatoire' });
        }

        if (maxParticipants && (maxParticipants < 1 || maxParticipants > 100)) {
            return res.status(400).json({ error: 'Le nombre de participants doit être entre 1 et 100' });
        }

        console.log('Création d\'une session par:', teacherId, { title, subject });

        // Générer un code de salle unique
        const roomCode = await generateRoomCode();

        // Insérer la session
        const [result] = await db.execute(`
            INSERT INTO live_sessions
            (teacher_id, title, description, subject, max_participants, room_code, password, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')
        `, [
            teacherId,
            title.trim(),
            description ? description.trim() : null,
            subject ? subject.trim() : null,
            maxParticipants || 50,
            roomCode,
            password ? password.trim() : null
        ]);

        console.log('Session créée avec succès:', result.insertId, 'Code:', roomCode);

        res.status(201).json({
            message: 'Session créée avec succès',
            sessionId: result.insertId,
            roomCode: roomCode
        });

    } catch (error) {
        console.error('Erreur lors de la création de session:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la session' });
    }
});

// ==========================================
// ROUTE: Obtenir une session par son code
// ==========================================
router.get('/session-by-code/:code', verifyToken, async (req, res) => {
    try {
        const roomCode = req.params.code.toUpperCase();

        console.log('Recherche de session avec le code:', roomCode);

        const [sessions] = await db.execute(`
            SELECT
                ls.*,
                u.name as teacher_name,
                u.username as teacher_username
            FROM live_sessions ls
                     LEFT JOIN users u ON ls.teacher_id = u.id
            WHERE ls.room_code = ? AND ls.status != 'ended'
        `, [roomCode]);

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session introuvable ou terminée' });
        }

        const session = sessions[0];
        console.log('Session trouvée:', session.id, session.title);

        res.json({
            sessionId: session.id,
            title: session.title,
            hasPassword: !!session.password,
            status: session.status,
            teacherName: session.teacher_name
        });

    } catch (error) {
        console.error('Erreur lors de la recherche par code:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Démarrer une session
// ==========================================
router.post('/start-session/:sessionId', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;

        console.log('Démarrage de session:', sessionId, 'par utilisateur:', userId);

        // Vérifier que la session appartient à l'utilisateur
        const [sessions] = await db.execute(`
            SELECT * FROM live_sessions
            WHERE id = ? AND teacher_id = ? AND status = 'waiting'
        `, [sessionId, userId]);

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session introuvable ou déjà démarrée' });
        }

        // Démarrer la session
        await db.execute(`
            UPDATE live_sessions
            SET status = 'live', started_at = NOW()
            WHERE id = ?
        `, [sessionId]);

        console.log('Session démarrée avec succès:', sessionId);
        res.json({ message: 'Session démarrée avec succès' });

    } catch (error) {
        console.error('Erreur lors du démarrage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Terminer une session
// ==========================================
router.post('/end-session/:sessionId', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;

        console.log('Fin de session:', sessionId, 'par utilisateur:', userId);

        // Vérifier que la session appartient à l'utilisateur
        const [sessions] = await db.execute(`
            SELECT * FROM live_sessions
            WHERE id = ? AND teacher_id = ? AND status = 'live'
        `, [sessionId, userId]);

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session introuvable ou déjà terminée' });
        }

        // Terminer la session
        await db.execute(`
            UPDATE live_sessions
            SET status = 'ended', ended_at = NOW()
            WHERE id = ?
        `, [sessionId]);

        // Marquer tous les participants comme inactifs
        await db.execute(`
            UPDATE live_participants
            SET is_active = 0, left_at = NOW()
            WHERE session_id = ? AND is_active = 1
        `, [sessionId]);

        console.log('Session terminée avec succès:', sessionId);
        res.json({ message: 'Session terminée avec succès' });

    } catch (error) {
        console.error('Erreur lors de la fin de session:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Rejoindre une session - CORRIGÉE
// ==========================================
router.post('/join-session/:sessionId', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;
        const { password } = req.body;

        console.log('=== TENTATIVE CONNEXION SESSION ===');
        console.log('SessionId:', sessionId);
        console.log('UserId:', userId);
        console.log('User:', req.user.name, req.user.accountType);

        // Récupérer les détails de la session
        const [sessions] = await db.execute(`
            SELECT * FROM live_sessions
            WHERE id = ? AND status IN ('live', 'waiting')
        `, [sessionId]);

        if (sessions.length === 0) {
            console.log('Session introuvable ou terminée');
            return res.status(404).json({ error: 'Session introuvable ou terminée' });
        }

        const session = sessions[0];
        console.log('Session trouvée:', session.title, 'Status:', session.status);

        // Vérifier le mot de passe si nécessaire
        if (session.password && session.password.trim() !== '') {
            if (!password || session.password !== password.trim()) {
                console.log('Mot de passe incorrect');
                return res.status(401).json({ error: 'Mot de passe incorrect' });
            }
            console.log('Mot de passe correct');
        }

        // Compter les participants actuels
        const [participantCount] = await db.execute(`
            SELECT COUNT(*) as count FROM live_participants 
            WHERE session_id = ? AND is_active = 1
        `, [sessionId]);

        const currentCount = participantCount[0].count;
        console.log('Participants actuels:', currentCount, '/', session.max_participants);

        // Vérifier le nombre maximum de participants (sauf pour le professeur)
        if (currentCount >= session.max_participants && userId !== session.teacher_id) {
            console.log('Session complète');
            return res.status(400).json({ error: 'Session complète' });
        }

        // Vérifier si l'utilisateur est déjà dans la session
        const [existing] = await db.execute(`
            SELECT * FROM live_participants
            WHERE session_id = ? AND user_id = ? AND is_active = 1
        `, [sessionId, userId]);

        if (existing.length > 0) {
            console.log('Utilisateur déjà dans la session');
            return res.json({
                message: 'Déjà connecté à cette session',
                alreadyJoined: true
            });
        }

        // Déterminer le rôle
        let role = 'student'; // Par défaut
        if (userId === session.teacher_id) {
            role = 'teacher';
        } else if (req.user.accountType === 'parent') {
            role = 'parent';
        } else if (req.user.accountType === 'child') {
            role = 'student';
        }

        console.log('Ajout du participant avec le rôle:', role);

        // Ajouter le participant
        await db.execute(`
            INSERT INTO live_participants (session_id, user_id, role, is_active, joined_at)
            VALUES (?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                is_active = 1, 
                joined_at = NOW(), 
                left_at = NULL,
                role = VALUES(role)
        `, [sessionId, userId, role]);

        // Mettre à jour le nombre de participants dans la session
        const [newCount] = await db.execute(`
            SELECT COUNT(*) as count FROM live_participants
            WHERE session_id = ? AND is_active = 1
        `, [sessionId]);

        await db.execute(`
            UPDATE live_sessions
            SET current_participants = ?
            WHERE id = ?
        `, [newCount[0].count, sessionId]);

        console.log('=== CONNEXION RÉUSSIE ===');
        console.log('Nouveaux participants:', newCount[0].count);

        res.json({
            message: 'Connexion à la session réussie',
            role: role,
            sessionStatus: session.status,
            participantCount: newCount[0].count
        });

    } catch (error) {
        console.error('=== ERREUR CONNEXION SESSION ===', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

// ==========================================
// ROUTE: Quitter une session
// ==========================================
router.post('/leave-session/:sessionId', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;

        console.log('Utilisateur quitte la session:', sessionId, userId);

        // Marquer le participant comme inactif
        await db.execute(`
            UPDATE live_participants
            SET is_active = 0, left_at = NOW()
            WHERE session_id = ? AND user_id = ?
        `, [sessionId, userId]);

        // Mettre à jour le nombre de participants
        await db.execute(`
            UPDATE live_sessions
            SET current_participants = (
                SELECT COUNT(*) FROM live_participants
                WHERE session_id = ? AND is_active = 1
            )
            WHERE id = ?
        `, [sessionId, sessionId]);

        res.json({ message: 'Session quittée avec succès' });

    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTE: Obtenir les détails d'une session - CORRIGÉE
// ==========================================
router.get('/session/:sessionId', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;

        console.log('=== RÉCUPÉRATION DÉTAILS SESSION ===');
        console.log('SessionId:', sessionId);
        console.log('UserId:', userId);
        console.log('User:', req.user.name, req.user.accountType);

        // Récupérer les détails de la session
        const [sessions] = await db.execute(`
            SELECT
                ls.*,
                u.name as teacher_name,
                u.username as teacher_username,
                u.profile_picture as teacher_picture
            FROM live_sessions ls
                     LEFT JOIN users u ON ls.teacher_id = u.id
            WHERE ls.id = ?
        `, [sessionId]);

        if (sessions.length === 0) {
            console.log('Session introuvable');
            return res.status(404).json({ error: 'Session introuvable' });
        }

        const session = sessions[0];
        console.log('Session trouvée:', session.title, 'Status:', session.status);

        // Vérifier si l'utilisateur est déjà participant
        const [participant] = await db.execute(`
            SELECT * FROM live_participants
            WHERE session_id = ? AND user_id = ? AND is_active = 1
        `, [sessionId, userId]);

        const isTeacher = userId === session.teacher_id;
        const isParticipant = participant.length > 0 || isTeacher;

        console.log('IsTeacher:', isTeacher, 'IsParticipant:', isParticipant);

        // Récupérer la liste des participants
        const [participants] = await db.execute(`
            SELECT
                lp.*,
                u.name as user_name,
                u.username,
                u.profile_picture,
                u.account_type as role
            FROM live_participants lp
                     LEFT JOIN users u ON lp.user_id = u.id
            WHERE lp.session_id = ? AND lp.is_active = 1
            ORDER BY lp.role = 'teacher' DESC, lp.joined_at ASC
        `, [sessionId]);

        console.log('Participants trouvés:', participants.length);

        res.json({
            session: {
                ...session,
                password: undefined // Ne pas exposer le mot de passe
            },
            participants,
            isParticipant,
            userRole: participant.length > 0 ? participant[0].role : (isTeacher ? 'teacher' : null)
        });

    } catch (error) {
        console.error('=== ERREUR RÉCUPÉRATION SESSION ===', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// ROUTES CHAT LIVE
// ==========================================

// ROUTE: Obtenir les messages du chat d'une session
router.get('/session/:sessionId/chat', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        console.log('Récupération du chat pour session:', sessionId);

        // Vérifier que l'utilisateur fait partie de la session
        const [participant] = await db.execute(`
            SELECT * FROM live_participants
            WHERE session_id = ? AND user_id = ? AND is_active = 1
        `, [sessionId, userId]);

        const [session] = await db.execute(`
            SELECT teacher_id FROM live_sessions WHERE id = ?
        `, [sessionId]);

        const isTeacher = session.length > 0 && session[0].teacher_id === userId;
        const isParticipant = participant.length > 0 || isTeacher;

        if (!isParticipant) {
            return res.status(403).json({ error: 'Vous devez être dans la session pour voir le chat' });
        }

        // Récupérer les messages
        const [messages] = await db.execute(`
            SELECT
                lc.*,
                u.name as user_name,
                u.username,
                u.profile_picture,
                u.account_type
            FROM live_chat lc
                     LEFT JOIN users u ON lc.user_id = u.id
            WHERE lc.session_id = ?
            ORDER BY lc.created_at DESC
                LIMIT ? OFFSET ?
        `, [sessionId, limit, offset]);

        // Inverser pour avoir les messages dans l'ordre chronologique
        messages.reverse();

        res.json(messages);

    } catch (error) {
        console.error('Erreur lors de la récupération du chat:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ROUTE: Envoyer un message dans le chat
router.post('/session/:sessionId/chat', verifyToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId = req.user.id;
        const { message, messageType = 'text' } = req.body;

        console.log('Envoi de message dans session:', sessionId, 'par:', userId);

        // Validation
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message vide' });
        }

        if (message.length > 500) {
            return res.status(400).json({ error: 'Message trop long (max 500 caractères)' });
        }

        // Vérifier que l'utilisateur fait partie de la session
        const [participant] = await db.execute(`
            SELECT * FROM live_participants
            WHERE session_id = ? AND user_id = ? AND is_active = 1
        `, [sessionId, userId]);

        const [session] = await db.execute(`
            SELECT teacher_id, status FROM live_sessions WHERE id = ?
        `, [sessionId]);

        if (session.length === 0) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        const isTeacher = session[0].teacher_id === userId;
        const isParticipant = participant.length > 0 || isTeacher;

        if (!isParticipant) {
            return res.status(403).json({ error: 'Vous devez être dans la session pour envoyer des messages' });
        }

        if (session[0].status !== 'live') {
            return res.status(400).json({ error: 'La session doit être en cours pour envoyer des messages' });
        }

        // Insérer le message
        const [result] = await db.execute(`
            INSERT INTO live_chat (session_id, user_id, message, message_type)
            VALUES (?, ?, ?, ?)
        `, [sessionId, userId, message.trim(), messageType]);

        // Récupérer le message complet avec les infos utilisateur
        const [newMessage] = await db.execute(`
            SELECT
                lc.*,
                u.name as user_name,
                u.username,
                u.profile_picture,
                u.account_type
            FROM live_chat lc
                     LEFT JOIN users u ON lc.user_id = u.id
            WHERE lc.id = ?
        `, [result.insertId]);

        console.log('Message envoyé avec succès:', result.insertId);
        res.status(201).json(newMessage[0]);

    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;