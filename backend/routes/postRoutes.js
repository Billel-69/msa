const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Créer un post avec image
router.post('/posts', verifyToken, upload.single('image'), postController.createPost);

// Récupérer le feed
router.get('/feed', verifyToken, postController.getFeed);

// Like / Unlike un post
router.post('/posts/:id/like', verifyToken, postController.likePost);

// Vérifier le statut de like d'un post
router.get('/posts/:id/like-status', verifyToken, postController.checkLikeStatus);

module.exports = router;