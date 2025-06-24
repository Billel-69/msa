const express = require('express');
const router = express.Router();
const mongoController = require('../controllers/mongoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Test MongoDB connection
router.get('/test', mongoController.testConnection);

// Analytics routes
router.get('/analytics/:userId', authMiddleware, mongoController.getUserAnalytics);
router.post('/analytics/track', authMiddleware, mongoController.trackLearningEvent);

// Progress routes
router.post('/progress/:userId', authMiddleware, mongoController.updateProgress);
router.get('/insights/:userId', authMiddleware, mongoController.getLearningInsights);

// Profile routes
router.get('/profile/:mysqlUserId', authMiddleware, mongoController.getCompleteProfile);

module.exports = router;
