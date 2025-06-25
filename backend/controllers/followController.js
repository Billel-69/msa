// Contrôleur pour la gestion des suivis (followers/following)

const db = require('../config/db');

// Permet à un utilisateur de suivre un autre utilisateur
exports.followUser = async (req, res) => {
    const userId = req.user.id; // ID de l'utilisateur qui veut suivre
    const followedId = req.params.id; // ID de l'utilisateur à suivre
    try {
        // Insère la relation de suivi dans la base de données, ignore si elle existe déjà
        await db.execute('INSERT IGNORE INTO followers (follower_id, followed_id) VALUES (?, ?)', [userId, followedId]);
        res.json({ message: 'Utilisateur suivi' });
    } catch (err) {
        // Gestion des erreurs
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Permet à un utilisateur de ne plus suivre un autre utilisateur
exports.unfollowUser = async (req, res) => {
    const userId = req.user.id; // ID de l'utilisateur qui se désabonne
    const followedId = req.params.id; // ID de l'utilisateur dont il se désabonne
    try {
        // Supprime la relation de suivi de la base de données
        await db.execute('DELETE FROM followers WHERE follower_id = ? AND followed_id = ?', [userId, followedId]);
        res.json({ message: 'Utilisateur désabonné' });
    } catch (err) {
        // Gestion des erreurs
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupère la liste des abonnés (followers) d'un utilisateur
exports.getFollowers = async (req, res) => {
    const userId = req.user.id; // ID de l'utilisateur dont on veut les abonnés
    try {
        // Récupère les informations des utilisateurs qui suivent l'utilisateur spécifié
        const [rows] = await db.execute(`
            SELECT u.id, u.name, u.email FROM users u
            JOIN followers f ON u.id = f.follower_id
            WHERE f.followed_id = ?`, [userId]);
        res.json(rows);
    } catch (err) {
        // Gestion des erreurs
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupère la liste des utilisateurs qu'un utilisateur suit (following)
exports.getFollowing = async (req, res) => {
    const userId = req.user.id; // ID de l'utilisateur dont on veut la liste des abonnements
    try {
        // Récupère les informations des utilisateurs que l'utilisateur spécifié suit
        const [rows] = await db.execute(`
            SELECT u.id, u.name, u.email FROM users u
            JOIN followers f ON u.id = f.followed_id
            WHERE f.follower_id = ?`, [userId]);
        res.json(rows);
    } catch (err) {
        // Gestion des erreurs
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
