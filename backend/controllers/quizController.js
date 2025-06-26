const Quiz = require('../models/mongodb/Quiz');
const User = require('../models/mongodb/User');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Admins/Teachers)
exports.createQuiz = async (req, res) => {
    try {
        const { title, subject, level, questions } = req.body;

        const quiz = new Quiz({
            title,
            subject,
            level,
            questions,
            createdBy: req.user.id
        });

        const createdQuiz = await quiz.save();
        res.status(201).json(createdQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
exports.getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({}).populate('createdBy', 'username');
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit a quiz and get results
// @route   POST /api/quizzes/:id/submit
// @access  Private (Students)
exports.submitQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        const { answers } = req.body; // answers should be an array of selected option indices

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let score = 0;
        const results = [];

        quiz.questions.forEach((question, index) => {
            const isCorrect = question.correctOption === answers[index];
            if (isCorrect) {
                score++;
            }
            results.push({
                question: question.questionText,
                answer: answers[index],
                correctAnswer: question.correctOption,
                isCorrect
            });
        });

        const totalQuestions = quiz.questions.length;
        const percentage = (score / totalQuestions) * 100;

        // Update user's progress (example)
        const user = await User.findById(req.user.id);
        if (user) {
            user.quests_completed = (user.quests_completed || 0) + 1;
            user.fragments = (user.fragments || 0) + score; // Reward fragments based on score
            await user.save();
        }

        res.json({
            score,
            totalQuestions,
            percentage,
            results,
            userFragments: user.fragments
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
