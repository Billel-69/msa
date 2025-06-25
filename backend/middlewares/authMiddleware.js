// Middleware pour la vérification des jetons d'authentification JWT

const jwt = require('jsonwebtoken');
// Récupère la clé secrète depuis les variables d'environnement ou utilise une valeur par défaut
const JWT_SECRET = process.env.JWT_SECRET || 'kaizenverse_secret_key';

// Fonction middleware pour vérifier le jeton JWT
const verifyToken = (req, res, next) => {
    try {
        // Récupère l'en-tête 'Authorization' de la requête
        const authHeader = req.headers.authorization;

        // Vérifie si l'en-tête d'authentification est présent
        if (!authHeader) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        // Vérifie si le token est au format "Bearer <token>"
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Format du token incorrect. Utilisez: Bearer <token>' });
        }

        // Extrait le token en supprimant le préfixe "Bearer "
        const token = authHeader.substring(7); // Retire "Bearer "

        // Vérifie si le token est vide après l'extraction
        if (!token) {
            return res.status(401).json({ error: 'Token manquant après Bearer' });
        }

        // Vérifie la validité du token et décode son contenu
        const decoded = jwt.verify(token, JWT_SECRET);

        // Ajoute les informations de l'utilisateur (contenues dans le token) à l'objet de la requête
        req.user = decoded;
        // Passe au middleware ou au contrôleur suivant
        next();

    } catch (error) {
        // Log de l'erreur pour le débogage
        console.error('Erreur de vérification du token:', error.message);

        // Gère les erreurs spécifiques de JWT
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide. Veuillez vous reconnecter.' });
        } else {
            // Pour toute autre erreur, renvoie une erreur d'accès interdit
            return res.status(403).json({ error: 'Accès interdit' });
        }
    }
};

module.exports = verifyToken;