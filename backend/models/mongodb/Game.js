const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['quiz', 'memory', 'puzzle', 'math', 'language', 'logic'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['facile', 'moyen', 'difficile'],
        default: 'facile'
    },
    subject: {
        type: String,
        enum: ['mathématiques', 'français', 'histoire', 'géographie', 'sciences', 'anglais', 'espagnol'],
        required: true
    },
    imageUrl: {
        type: String,
        default: '/assets/default-game.png'
    },
    xpReward: {
        type: Number,
        default: 10
    },
    fragmentsReward: {
        type: Number,
        default: 1
    },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String
    }],
    status: {
        type: String,
        enum: ['active', 'maintenance', 'coming_soon'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;