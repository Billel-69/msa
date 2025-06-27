const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

const verifyToken = (req, res, next) => {
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

        // Ajouter les informations utilisateur à la requête
        req.user = decoded;
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
module.exports = { verifyToken };