const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const Game = require('../models/mongodb/Game');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrateGamesToMySQL() {
    try {
        console.log('🔄 Starting game migration from MongoDB to MySQL...');
        
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Fetch all games from MongoDB
        console.log('📊 Fetching games from MongoDB...');
        const mongoGames = await Game.find({});
        console.log(`📋 Found ${mongoGames.length} games in MongoDB`);
        
        if (mongoGames.length === 0) {
            console.log('⚠️  No games found in MongoDB to migrate');
            return;
        }
        
        // Clear existing games in MySQL
        console.log('🗑️  Clearing existing games in MySQL...');
        await db.execute('DELETE FROM game_sessions');
        await db.execute('DELETE FROM user_game_progress');
        await db.execute('DELETE FROM mini_games');
        
        // Migrate each game
        console.log('📝 Migrating games to MySQL...');
        for (const game of mongoGames) {
            const gameId = uuidv4(); // Generate UUID for MySQL
            
            // Prepare JSON fields
            const questions = game.questions ? JSON.stringify(game.questions) : null;
            const memoryPairs = game.memoryPairs ? JSON.stringify(game.memoryPairs) : null;
            const puzzleData = game.puzzleData ? JSON.stringify(game.puzzleData) : null;
            
            // Insert game into MySQL
            await db.execute(
                `INSERT INTO mini_games (
                    id, name, description, type, difficulty, subject, 
                    imageUrl, xpReward, fragmentsReward, questions, 
                    memoryPairs, puzzleData, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    gameId,
                    game.name,
                    game.description,
                    game.type,
                    game.difficulty,
                    game.subject,
                    game.imageUrl,
                    game.xpReward || 0,
                    game.fragmentsReward || 0,
                    questions,
                    memoryPairs,
                    puzzleData,
                    game.status || 'active'
                ]
            );
            
            console.log(`✅ Migrated: ${game.name} (${game.type})`);
        }
        
        // Verify migration
        const [mysqlGames] = await db.execute('SELECT COUNT(*) as count FROM mini_games');
        console.log(`📊 MySQL now contains ${mysqlGames[0].count} games`);
        
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    } finally {
        // Close connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('🔌 MongoDB connection closed');
        }
        await db.end();
        console.log('🔌 MySQL connection closed');
    }
}

// Execute migration
migrateGamesToMySQL();