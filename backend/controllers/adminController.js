const db = require('../config/db');
const bcrypt = require('bcrypt');

// Récupérer tous les utilisateurs avec pagination
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const accountType = req.query.accountType || '';

        let query = `
            SELECT id, name, username, email, account_type, profile_picture, 
                   level, fragments, created_at, is_super_admin, is_suspended
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (accountType) {
            query += ' AND account_type = ?';
            params.push(accountType);
        }

        // Get total count
        const countQuery = query.replace('SELECT id, name, username, email, account_type, profile_picture, level, fragments, created_at, is_super_admin, is_suspended', 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Get paginated results
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [users] = await db.execute(query, params);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer un utilisateur spécifique avec ses détails
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user details
        const [userResult] = await db.execute(`
            SELECT id, name, username, email, account_type, profile_picture, 
                   level, quests_completed, fragments, badges, user_rank, 
                   style, parent_id, created_at, is_super_admin, is_suspended
            FROM users
            WHERE id = ?
        `, [id]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = userResult[0];

        // Get user's children if parent
        if (user.account_type === 'parent') {
            const [children] = await db.execute(`
                SELECT u.id, u.name, u.username, u.email
                FROM users u
                JOIN child_parent_links cpl ON u.id = cpl.child_id
                WHERE cpl.parent_id = ?
            `, [id]);
            user.children = children;
        }

        // Get user's recent posts
        const [posts] = await db.execute(`
            SELECT id, content, created_at
            FROM posts
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [id]);
        user.recentPosts = posts;

        // Get user's activity stats
        const [stats] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM posts WHERE user_id = ?) as totalPosts,
                (SELECT COUNT(*) FROM comments WHERE user_id = ?) as totalComments,
                (SELECT COUNT(*) FROM likes WHERE user_id = ?) as totalLikes
        `, [id, id, id]);
        user.stats = stats[0];

        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Suspendre/réactiver un utilisateur
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;

        if (!['suspend', 'activate'].includes(action)) {
            return res.status(400).json({ error: 'Action invalide' });
        }

        // Vérifier que l'utilisateur existe
        const [userResult] = await db.execute('SELECT account_type FROM users WHERE id = ?', [id]);
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Empêcher la suspension d'un admin par un non-super admin
        if (userResult[0].account_type === 'admin' && !req.user.isSuperAdmin) {
            return res.status(403).json({ error: 'Vous ne pouvez pas suspendre un administrateur' });
        }

        // Pour l'instant, on va ajouter une colonne is_suspended à la table users
        // Dans une vraie implémentation, vous devriez d'abord ajouter cette colonne via migration
        const isSuspended = action === 'suspend';
        
        await db.execute(
            'UPDATE users SET is_suspended = ? WHERE id = ?',
            [isSuspended, id]
        );

        res.json({ 
            message: `Utilisateur ${action === 'suspend' ? 'suspendu' : 'réactivé'} avec succès`,
            userId: id,
            action,
            reason
        });
    } catch (error) {
        console.error('Erreur lors du changement de statut utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Réinitialiser le mot de passe d'un utilisateur
exports.resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Vérifier que l'utilisateur existe
        const [userResult] = await db.execute('SELECT email, account_type FROM users WHERE id = ?', [id]);
        if (userResult.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Empêcher la réinitialisation du mot de passe d'un admin par un non-super admin
        if (userResult[0].account_type === 'admin' && !req.user.isSuperAdmin) {
            return res.status(403).json({ error: 'Vous ne pouvez pas réinitialiser le mot de passe d\'un administrateur' });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );

        res.json({ 
            message: 'Mot de passe réinitialisé avec succès',
            userId: id,
            email: userResult[0].email
        });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Promouvoir un utilisateur en admin
exports.promoteToAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Seuls les super admins peuvent promouvoir d'autres utilisateurs
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ error: 'Seuls les super administrateurs peuvent promouvoir des utilisateurs' });
        }

        // Vérifier que l'utilisateur existe et n'est pas déjà admin
        const [userResult] = await db.execute(
            'SELECT account_type, email, name FROM users WHERE id = ?',
            [id]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        if (userResult[0].account_type === 'admin') {
            return res.status(400).json({ error: 'Cet utilisateur est déjà administrateur' });
        }

        // Promouvoir l'utilisateur
        await db.execute(
            'UPDATE users SET account_type = ? WHERE id = ?',
            ['admin', id]
        );

        res.json({ 
            message: 'Utilisateur promu administrateur avec succès',
            userId: id,
            email: userResult[0].email,
            name: userResult[0].name
        });
    } catch (error) {
        console.error('Erreur lors de la promotion admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Obtenir les statistiques globales de la plateforme
exports.getPlatformStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM users WHERE account_type = 'parent') as totalParents,
                (SELECT COUNT(*) FROM users WHERE account_type = 'child') as totalChildren,
                (SELECT COUNT(*) FROM users WHERE account_type = 'teacher') as totalTeachers,
                (SELECT COUNT(*) FROM users WHERE account_type = 'admin') as totalAdmins,
                (SELECT COUNT(*) FROM posts) as totalPosts,
                (SELECT COUNT(*) FROM comments) as totalComments,
                (SELECT COUNT(*) FROM mini_games) as totalGames,
                (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as newUsersToday,
                (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = CURDATE()) as newPostsToday
        `);

        // Récupérer les utilisateurs actifs des 7 derniers jours
        const [activeUsers] = await db.execute(`
            SELECT COUNT(DISTINCT user_id) as activeUsers
            FROM (
                SELECT user_id FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION
                SELECT user_id FROM comments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION
                SELECT user_id FROM likes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) as activity
        `);

        res.json({
            ...stats[0],
            activeUsersLast7Days: activeUsers[0].activeUsers
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Rechercher dans les logs admin
exports.getAdminLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const adminId = req.query.adminId;
        const actionType = req.query.actionType;

        let query = `
            SELECT al.*, u.name as admin_name, u.username as admin_username
            FROM admin_actions al
            JOIN users u ON al.admin_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (adminId) {
            query += ' AND al.admin_id = ?';
            params.push(adminId);
        }

        if (actionType) {
            query += ' AND al.action_type = ?';
            params.push(actionType);
        }

        // Get total count
        const countQuery = query.replace('SELECT al.*, u.name as admin_name, u.username as admin_username', 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Get paginated results
        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [logs] = await db.execute(query, params);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};