const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const db = require('../config/db');

const JWT_SECRET = 'kaizenverse_secret_key';

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.createUser(name, email, hashedPassword);
        res.status(201).json({ message: 'Inscription réussie' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findUserByEmail(email);
        if (!user) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [req.user.email]);
        if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });

        const user = rows[0];
        res.json({
            name: user.name,
            email: user.email,
            level: user.level,
            quests_completed: user.quests_completed,
            fragments: user.fragments,
            badges: user.badges,
            rank: user.rank,
            style: user.style
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
exports.updateProfile = async (req, res) => {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    try {
        // Vérifie si l'email est déjà utilisé par un autre utilisateur
        const [existingEmail] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: "Cet email est déjà utilisé par un autre compte." });
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const query = hashedPassword
            ? 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?'
            : 'UPDATE users SET name = ?, email = ? WHERE id = ?';
        const params = hashedPassword
            ? [name, email, hashedPassword, userId]
            : [name, email, userId];

        await db.execute(query, params);
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur." });
    }
};
