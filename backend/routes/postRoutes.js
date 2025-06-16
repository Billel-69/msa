const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Créer un post avec image
router.post('/posts', verifyToken, upload.single('image'), postController.createPost);

// Récupérer le feed complet (CETTE ROUTE QUI MANQUE !)
router.get('/feed', verifyToken, postController.getFeed);

// Like / Unlike un post
router.post('/posts/:id/like', verifyToken, postController.likePost);

module.exports = router;
