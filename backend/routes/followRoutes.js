
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const followController = require('../controllers/followController');

router.post('/follow/:id', verifyToken, followController.followUser);
router.post('/unfollow/:id', verifyToken, followController.unfollowUser);
router.get('/followers', verifyToken, followController.getFollowers);
router.get('/following', verifyToken, followController.getFollowing);

module.exports = router;
