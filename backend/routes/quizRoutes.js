const express = require('express');
const router = express.Router();
const { getQuizzes, createQuiz, getQuizById, submitQuiz } = require('../controllers/quizController');
const authMiddleware = require('../middlewares/authMiddleware');

router.route('/').get(getQuizzes).post(authMiddleware, createQuiz);
router.route('/:id').get(authMiddleware, getQuizById);
router.route('/:id/submit').post(authMiddleware, submitQuiz);

module.exports = router;
