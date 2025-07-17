const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin, isSuperAdmin, logAdminAction } = require('../middlewares/authMiddleware');

// Toutes les routes admin nécessitent une authentification et le rôle admin
router.use(verifyToken);
router.use(isAdmin);

// ===== GESTION DES UTILISATEURS =====

// GET /api/admin/users - Récupérer tous les utilisateurs avec pagination
router.get('/users', logAdminAction('view_users'), adminController.getAllUsers);

// GET /api/admin/users/:id - Récupérer les détails d'un utilisateur
router.get('/users/:id', logAdminAction('view_user_details'), adminController.getUserDetails);

// POST /api/admin/users/:id/toggle-status - Suspendre/réactiver un utilisateur
router.post('/users/:id/toggle-status', logAdminAction('toggle_user_status'), adminController.toggleUserStatus);

// POST /api/admin/users/:id/reset-password - Réinitialiser le mot de passe d'un utilisateur
router.post('/users/:id/reset-password', logAdminAction('reset_user_password'), adminController.resetUserPassword);

// POST /api/admin/users/:id/promote - Promouvoir un utilisateur en admin (super admin seulement)
router.post('/users/:id/promote', isSuperAdmin, logAdminAction('promote_to_admin'), adminController.promoteToAdmin);

// ===== STATISTIQUES ET MONITORING =====

// GET /api/admin/stats - Obtenir les statistiques globales
router.get('/stats', logAdminAction('view_stats'), adminController.getPlatformStats);

// GET /api/admin/logs - Obtenir les logs des actions admin
router.get('/logs', logAdminAction('view_logs'), adminController.getAdminLogs);

module.exports = router;