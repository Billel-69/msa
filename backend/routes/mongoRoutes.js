const express = require('express');
const router = express.Router();
const mongoController = require('../controllers/mongoController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Test MongoDB connection
router.get('/test', mongoController.testConnection);

// Analytics routes
router.get('/analytics/:userId', verifyToken, mongoController.getUserAnalytics);
router.post('/analytics/track', verifyToken, mongoController.trackLearningEvent);

// Progress routes
router.post('/progress/:userId', verifyToken, mongoController.updateProgress);
router.get('/insights/:userId', verifyToken, mongoController.getLearningInsights);

// Profile routes
router.get('/profile/:mysqlUserId', verifyToken, mongoController.getCompleteProfile);

module.exports = router;
