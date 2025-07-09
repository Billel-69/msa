const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const db = require('../config/db');
const { calculateLevel } = require('../utils/levelUtils');
const notificationService = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

exports.register = async (req, res) => {
    const { name, username, email, password, accountType } = req.body;

    try {
        // Vérifications
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const existingUsername = await userModel.findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
        }

        // Validation du type de compte
        if (!['parent', 'child', 'teacher'].includes(accountType)) {
            return res.status(400).json({ error: 'Type de compte invalide' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            username,
            email,
            hashedPassword,
            accountType
        };

        const userId = await userModel.createUser(userData);

        res.status(201).json({
            message: 'Inscription réussie',
            userId,
            accountType
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.login = async (req, res) => {
    const { identifier, password } = req.body; // identifier peut être email ou username

    try {
        const user = await userModel.findUserByEmailOrUsername(identifier);
        if (!user) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, accountType: user.account_type },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                accountType: user.account_type,
                profilePicture: user.profile_picture
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const user = rows[0];
        
        // Récupérer l'XP total et les sessions totales depuis user_game_progress
        const [xpRows] = await db.execute(
            'SELECT COALESCE(SUM(total_xp), 0) as totalXP FROM user_game_progress WHERE user_id = ?',
            [req.user.id]
        );
        const totalXP = xpRows[0].totalXP;
        
        // Récupérer le total des sessions (quêtes complétées)
        const [sessionsRows] = await db.execute(
            'SELECT COALESCE(SUM(total_sessions), 0) as totalSessions FROM user_game_progress WHERE user_id = ?',
            [req.user.id]
        );
        const totalSessions = sessionsRows[0].totalSessions;
        
        // Récupérer le temps de jeu total (avec fallback si la colonne n'existe pas encore)
        let totalTimePlayed = 0;
        try {
            const [timeRows] = await db.execute(
                'SELECT COALESCE(SUM(total_time_played), 0) as totalTimePlayed FROM user_game_progress WHERE user_id = ?',
                [req.user.id]
            );
            totalTimePlayed = timeRows[0].totalTimePlayed;
        } catch (error) {
            // Si la colonne n'existe pas encore, utiliser 0 comme valeur par défaut
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Column total_time_played not found, using default value 0');
                totalTimePlayed = 0;
            } else {
                throw error;
            }
        }
        
        // Calculer le niveau basé sur l'XP total
        const levelInfo = calculateLevel(totalXP);

        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            accountType: user.account_type,
            profilePicture: user.profile_picture,
            level: levelInfo.level,
            quests_completed: totalSessions,
            fragments: user.fragments,
            badges: user.badges,
            rank: user.user_rank,
            style: user.style,
            totalXP: totalXP,
            totalTimePlayed: totalTimePlayed,
            currentLevelXP: levelInfo.currentLevelXP,
            nextLevelXP: levelInfo.nextLevelXP,
            xpToNextLevel: levelInfo.xpToNextLevel
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.updateProfile = async (req, res) => {
    const { name, username, email, password } = req.body;
    const userId = req.user.id;

    try {
        const updates = {};

        // Vérifier l'unicité de l'email
        if (email && !(await userModel.checkEmailAvailability(email, userId))) {
            return res.status(400).json({ error: "Cet email est déjà utilisé par un autre compte." });
        }

        // Vérifier l'unicité du username
        if (username && !(await userModel.checkUsernameAvailability(username, userId))) {
            return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
        }

        if (name) updates.name = name;
        if (username) updates.username = username;
        if (email) updates.email = email;

        if (password && password.trim() !== '') {
            updates.password = await bcrypt.hash(password, 10);
        }

        await userModel.updateUserProfile(userId, updates);
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const profilePicture = req.file ? req.file.filename : null;

        if (!profilePicture) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }

        await userModel.updateUserProfile(userId, { profile_picture: profilePicture });

        res.json({
            message: 'Photo de profil mise à jour',
            profilePicture: profilePicture
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.linkChild = async (req, res) => {
    const { childIdentifier } = req.body; // email ou username
    const parentId = req.user.id;

    try {
        // Vérifier que l'utilisateur est un parent
        const [parentCheck] = await db.execute(
            'SELECT account_type FROM users WHERE id = ?',
            [parentId]
        );

        if (!parentCheck[0] || parentCheck[0].account_type !== 'parent') {
            return res.status(403).json({ error: 'Seuls les parents peuvent lier des enfants' });
        }

        // Trouver l'enfant
        const child = await userModel.findUserByEmailOrUsername(childIdentifier);
        if (!child) {
            return res.status(404).json({ error: 'Enfant non trouvé' });
        }

        if (child.account_type !== 'child') {
            return res.status(400).json({ error: 'Le compte trouvé n\'est pas un compte enfant' });
        }

        // Vérifier si la liaison existe déjà
        const [existingLink] = await db.execute(
            'SELECT id FROM child_parent_links WHERE parent_id = ? AND child_id = ?',
            [parentId, child.id]
        );

        if (existingLink.length > 0) {
            return res.status(400).json({ error: 'Cet enfant est déjà lié à votre compte' });
        }

        // Créer la liaison
        const success = await userModel.linkChildToParent(parentId, child.id);
        if (success) {
            res.json({
                message: 'Enfant lié avec succès',
                child: {
                    id: child.id,
                    name: child.name,
                    username: child.username
                }
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la liaison' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.createChildAccount = async (req, res) => {
    const { name, username, email, password } = req.body;
    const parentId = req.user.id;

    try {
        // Vérifier que l'utilisateur est un parent
        const [parentCheck] = await db.execute(
            'SELECT account_type FROM users WHERE id = ?',
            [parentId]
        );

        if (!parentCheck[0] || parentCheck[0].account_type !== 'parent') {
            return res.status(403).json({ error: 'Seuls les parents peuvent créer des comptes enfant' });
        }

        // Vérifications d'unicité
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const existingUsername = await userModel.findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            username,
            email,
            hashedPassword,
            accountType: 'child',
            parentId
        };

        const childId = await userModel.createUser(userData);

        // Créer automatiquement la liaison parent-enfant
        await userModel.linkChildToParent(parentId, childId);

        res.status(201).json({
            message: 'Compte enfant créé avec succès',
            child: { id: childId, name, username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getMyChildren = async (req, res) => {
    try {
        const parentId = req.user.id;
        const children = await userModel.getChildrenByParentId(parentId);
        res.json(children);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Fonctions de suivi d'utilisateurs
exports.followUser = async (req, res) => {
    const userId = req.user.id;
    const followedId = req.params.id;

    try {
        if (userId == followedId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });
        }

        // Vérifier que l'utilisateur à suivre existe
        const [userExists] = await db.execute('SELECT id FROM users WHERE id = ?', [followedId]);
        if (userExists.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        await db.execute('INSERT IGNORE INTO followers (follower_id, followed_id) VALUES (?, ?)', [userId, followedId]);
        
        // Get the follower's name for notification
        const [followerInfo] = await db.execute('SELECT name FROM users WHERE id = ?', [userId]);
        const followerName = followerInfo[0]?.name || 'Un utilisateur';
        
        // Create notification for the followed user
        console.log('👥 Creating follow notification for user:', followedId, 'from follower:', userId);
        await notificationService.createNotification({
            userId: followedId,
            type: 'follow',
            title: 'Nouvel abonné',
            content: `${followerName} vous suit maintenant.`,
            relatedId: userId
        });
        
        res.json({ message: 'Utilisateur suivi avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.unfollowUser = async (req, res) => {
    const userId = req.user.id;
    const followedId = req.params.id;

    try {
        await db.execute('DELETE FROM followers WHERE follower_id = ? AND followed_id = ?', [userId, followedId]);
        res.json({ message: 'Utilisateur retiré de vos abonnements' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getFollowStatus = async (req, res) => {
    const userId = req.user.id;
    const targetUserId = req.params.id;

    try {
        const [result] = await db.execute(
            'SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?',
            [userId, targetUserId]
        );

        res.json({ isFollowing: result.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const userId = req.user.id;
        const [followers] = await db.execute(`
            SELECT u.id, u.name, u.username, u.profile_picture
            FROM followers f
                     JOIN users u ON f.follower_id = u.id
            WHERE f.followed_id = ?
        `, [userId]);

        res.json(followers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const userId = req.user.id;
        const [following] = await db.execute(`
            SELECT u.id, u.name, u.username, u.profile_picture
            FROM followers f
                     JOIN users u ON f.followed_id = u.id
            WHERE f.follower_id = ?
        `, [userId]);

        res.json(following);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// NOUVELLE FONCTION - Récupérer un utilisateur public
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const [rows] = await db.execute(`
            SELECT id, name, username, account_type, profile_picture, level, 
                   quests_completed, fragments, user_rank, created_at 
            FROM users WHERE id = ?
        `, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const user = rows[0];
        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            account_type: user.account_type,
            profile_picture: user.profile_picture,
            level: user.level,
            quests_completed: user.quests_completed,
            fragments: user.fragments,
            rank: user.user_rank,
            created_at: user.created_at
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};