const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

const verifyToken = async (req, res, next) => {
    try {
        // Récupérer le token depuis les headers
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        // Vérifier le format "Bearer token"
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Format du token incorrect. Utilisez: Bearer <token>' });
        }

        // Extraire le token
        const token = authHeader.substring(7); // Retire "Bearer "

        if (!token) {
            return res.status(401).json({ error: 'Token manquant après Bearer' });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Vérifier que l'utilisateur existe toujours et n'est pas suspendu
        const db = require('../config/db');
        const [userResult] = await db.execute(
            'SELECT id, name, username, email, account_type, is_super_admin, is_suspended FROM users WHERE id = ?',
            [decoded.id]
        );

        if (userResult.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouvé. Veuillez vous reconnecter.' });
        }

        const user = userResult[0];

        // Vérifier si l'utilisateur est suspendu
        if (user.is_suspended) {
            return res.status(403).json({ 
                error: 'Votre compte a été suspendu. Contactez un administrateur.',
                suspended: true 
            });
        }

        // Ajouter les informations utilisateur mises à jour à la requête
        req.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            accountType: user.account_type,
            isSuperAdmin: user.is_super_admin
        };
        
        next();

    } catch (error) {
        console.error('Erreur de vérification du token:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide. Veuillez vous reconnecter.' });
        } else {
            return res.status(403).json({ error: 'Accès interdit' });
        }
    }
};
// Middleware pour verifier si un user est child/student
const isChildOrStudent = (req, res, next) => {
    // verfifier si l'utilisateur est authentifié
    if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // verifier si l'utilisateur est de type enfant/élève
    if (req.user.accountType === 'child' || req.user.accountType === 'élève' || req.user.accountType === 'enfant') {
        next();
    } else {
        return res.status(403).json({ error: 'Accès réservé aux élèves/enfants' });
    }
};

// Middleware pour vérifier si un utilisateur est admin
const isAdmin = (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier si l'utilisateur est de type admin
    if (req.user.accountType === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
};

// Middleware pour vérifier si un utilisateur est admin ou super admin
const isSuperAdmin = (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier si l'utilisateur est admin et super admin
    if (req.user.accountType === 'admin' && req.user.isSuperAdmin === true) {
        next();
    } else {
        return res.status(403).json({ error: 'Accès réservé aux super administrateurs' });
    }
};

// Middleware pour logger les actions admin
const logAdminAction = (actionType) => {
    return async (req, res, next) => {
        const db = require('../config/db');
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log l'action seulement si la requête est réussie
            if (!data.error && req.user && req.user.accountType === 'admin') {
                const details = {
                    method: req.method,
                    path: req.path,
                    params: req.params,
                    body: req.body ? { ...req.body, password: undefined } : undefined
                };
                
                db.execute(
                    'INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        req.user.id,
                        actionType,
                        req.params.type || null,
                        req.params.id || null,
                        JSON.stringify(details),
                        req.ip || req.connection.remoteAddress
                    ]
                ).catch(err => console.error('Erreur lors du log admin:', err));
            }
            originalJson.call(this, data);
        };
        next();
    };
};

module.exports = { verifyToken, isChildOrStudent, isAdmin, isSuperAdmin, logAdminAction };