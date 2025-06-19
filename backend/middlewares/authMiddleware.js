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

module.exports = verifyToken;