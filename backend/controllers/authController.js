// Contrôleur pour l'authentification des utilisateurs

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const db = require('../config/db');

// Clé secrète pour les jetons JWT, avec une valeur par défaut
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

// Gère l'inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
    const { name, username, email, password, accountType } = req.body;

    try {
        // Vérifie si l'email est déjà utilisé
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        // Vérifie si le nom d'utilisateur est déjà pris
        const existingUsername = await userModel.findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
        }

        // Valide le type de compte
        if (!['parent', 'child', 'teacher'].includes(accountType)) {
            return res.status(400).json({ error: 'Type de compte invalide' });
        }

        // Hash le mot de passe avant de le sauvegarder
        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            username,
            email,
            hashedPassword,
            accountType
        };

        // Crée l'utilisateur dans la base de données
        const userId = await userModel.createUser(userData);

        // Répond avec un message de succès
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

// Gère la connexion d'un utilisateur
exports.login = async (req, res) => {
    const { identifier, password } = req.body; // L'identifiant peut être un email ou un nom d'utilisateur

    try {
        // Recherche l'utilisateur par email ou nom d'utilisateur
        const user = await userModel.findUserByEmailOrUsername(identifier);
        if (!user) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }

        // Compare le mot de passe fourni avec le mot de passe hashé
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }

        // Crée un jeton JWT pour l'utilisateur
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, accountType: user.account_type },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Répond avec le jeton et les informations de l'utilisateur
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

// Récupère le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
    try {
        // Récupère les informations de l'utilisateur depuis la base de données
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const user = rows[0];
        // Renvoie les informations du profil
        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            accountType: user.account_type,
            profilePicture: user.profile_picture,
            level: user.level,
            quests_completed: user.quests_completed,
            fragments: user.fragments,
            badges: user.badges,
            rank: user.user_rank,
            style: user.style
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Met à jour le profil de l'utilisateur
exports.updateProfile = async (req, res) => {
    const { name, username, email, password } = req.body;
    const userId = req.user.id;

    try {
        const updates = {};

        // Vérifie la disponibilité de l'email s'il est fourni
        if (email && !(await userModel.checkEmailAvailability(email, userId))) {
            return res.status(400).json({ error: "Cet email est déjà utilisé par un autre compte." });
        }

        // Vérifie la disponibilité du nom d'utilisateur s'il est fourni
        if (username && !(await userModel.checkUsernameAvailability(username, userId))) {
            return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
        }

        if (name) updates.name = name;
        if (username) updates.username = username;
        if (email) updates.email = email;

        // Hash le nouveau mot de passe s'il est fourni
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        // Met à jour le profil dans la base de données
        await userModel.updateUserProfile(userId, updates);
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

// Met à jour la photo de profil de l'utilisateur
exports.updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const profilePicture = req.file ? req.file.filename : null;

        if (!profilePicture) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }

        // Met à jour la photo de profil dans la base de données
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

// Permet à un parent de lier un compte enfant
exports.linkChild = async (req, res) => {
    const { childIdentifier } = req.body; // email ou nom d'utilisateur de l'enfant
    const parentId = req.user.id;

    try {
        // Vérifie que l'utilisateur est bien un parent
        const [parentCheck] = await db.execute(
            'SELECT account_type FROM users WHERE id = ?',
            [parentId]
        );

        if (!parentCheck[0] || parentCheck[0].account_type !== 'parent') {
            return res.status(403).json({ error: 'Seuls les parents peuvent lier des enfants' });
        }

        // Recherche le compte de l'enfant
        const child = await userModel.findUserByEmailOrUsername(childIdentifier);
        if (!child) {
            return res.status(404).json({ error: 'Enfant non trouvé' });
        }

        if (child.account_type !== 'child') {
            return res.status(400).json({ error: 'Le compte trouvé n\'est pas un compte enfant' });
        }

        // Vérifie si le lien parent-enfant existe déjà
        const [existingLink] = await db.execute(
            'SELECT id FROM child_parent_links WHERE parent_id = ? AND child_id = ?',
            [parentId, child.id]
        );

        if (existingLink.length > 0) {
            return res.status(409).json({ error: 'Cet enfant est déjà lié à votre compte' });
        }

        // Crée le lien dans la base de données
        await db.execute(
            'INSERT INTO child_parent_links (parent_id, child_id) VALUES (?, ?)',
            [parentId, child.id]
        );

        res.status(201).json({ message: 'Enfant lié avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupère la liste des enfants liés à un parent
exports.getLinkedChildren = async (req, res) => {
    const parentId = req.user.id;

    try {
        // Récupère les informations des enfants liés
        const [children] = await db.execute(
            `SELECT u.id, u.username, u.name, u.profile_picture
             FROM users u
             JOIN child_parent_links l ON u.id = l.child_id
             WHERE l.parent_id = ?`,
            [parentId]
        );

        res.json(children);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Dissocie un enfant d'un compte parent
exports.unlinkChild = async (req, res) => {
    const { childId } = req.params;
    const parentId = req.user.id;

    try {
        // Supprime le lien de la base de données
        const [result] = await db.execute(
            'DELETE FROM child_parent_links WHERE parent_id = ? AND child_id = ?',
            [parentId, childId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Lien non trouvé ou vous n\'avez pas la permission' });
        }

        res.json({ message: 'Enfant dissocié avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupère les détails d'un utilisateur par son ID
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await db.execute('SELECT id, name, username, email, account_type, profile_picture, level, quests_completed, fragments, badges, user_rank, style FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche des utilisateurs par leur nom d'utilisateur
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Le paramètre de recherche est manquant" });
        }

        const [users] = await db.execute(
            'SELECT id, username, name, profile_picture FROM users WHERE username LIKE ?',
            [`%${query}%`]
        );

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la recherche d\'utilisateurs' });
    }
};