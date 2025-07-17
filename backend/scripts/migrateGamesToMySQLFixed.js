const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
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
        await db.execute('DELETE FROM game_sessions WHERE game_id IN (SELECT id FROM mini_games)');
        await db.execute('DELETE FROM mini_games');
        
        // Get the next available ID
        const [maxIdResult] = await db.execute('SELECT MAX(id) as maxId FROM mini_games');
        let nextId = (maxIdResult[0].maxId || 0) + 1;
        
        // Migrate each game
        console.log('📝 Migrating games to MySQL...');
        for (const game of mongoGames) {
            // Map MongoDB fields to MySQL fields
            const difficultyMap = {
                'facile': 'easy',
                'moyen': 'medium',
                'difficile': 'hard'
            };
            
            const cycleMap = {
                'all': 'all',
                'primary': 'primary',
                'college': 'college',
                'lycee': 'lycee'
            };
            
            // Determine target cycle based on difficulty
            let targetCycle = 'all';
            if (game.difficulty === 'facile') targetCycle = 'primary';
            else if (game.difficulty === 'moyen') targetCycle = 'college';
            else if (game.difficulty === 'difficile') targetCycle = 'lycee';
            
            // Insert game into MySQL with existing table structure
            await db.execute(
                `INSERT INTO mini_games (
                    id, name, type, description, target_cycle, 
                    subject, difficulty_level, theme, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nextId++,
                    game.name,
                    game.type || 'quiz',
                    game.description,
                    targetCycle,
                    game.subject || 'general',
                    difficultyMap[game.difficulty] || 'medium',
                    game.subject || 'educational', // Using subject as theme
                    game.status === 'active' ? 1 : 0
                ]
            );
            
            console.log(`✅ Migrated: ${game.name} (${game.type})`);
            
            // Store game data (questions, etc.) in a separate table if needed
            // For now, we'll need to create an additional table to store this data
        }
        
        // Verify migration
        const [mysqlGames] = await db.execute('SELECT COUNT(*) as count FROM mini_games');
        console.log(`📊 MySQL now contains ${mysqlGames[0].count} games`);
        
        console.log('✅ Migration completed successfully!');
        console.log('\n⚠️  Note: Game questions, memory pairs, and puzzle data need to be stored separately.');
        console.log('Consider creating additional tables for game-specific data.');
        
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