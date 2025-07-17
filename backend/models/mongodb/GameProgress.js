const mongoose = require('mongoose');

const gameProgressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    sessionsCompleted: {
        type: Number,
        default: 0
    },
    bestScore: {
        type: Number,
        default: 0
    },
    totalXpEarned: {
        type: Number,
        default: 0
    },
    totalFragmentsEarned: {
        type: Number,
        default: 0
    },
    achievements: [{
        name: String,
        description: String,
        unlockedAt: Date
    }],
    lastPlayedAt: {
        type: Date,
        default: Date.now
    }
});

const GameProgress = mongoose.model('GameProgress', gameProgressSchema);

module.exports = GameProgress;