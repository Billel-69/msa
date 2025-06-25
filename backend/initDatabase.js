// Database initialization script for the mini-games system
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
    try {
        console.log('🚀 Initializing Mini-Games Database...');
        
        // Create connection without specifying database (to create it if needed)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'kaizenverse';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);
        
        console.log(`✅ Database "${dbName}" ready`);

        // Read and execute the schema
        const schemaPath = path.join(__dirname, 'database', 'game_schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
          // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }
        
        console.log('✅ Mini-games tables created');        // Insert sample mini-games if they don't exist
        const [existingGames] = await connection.query('SELECT COUNT(*) as count FROM mini_games');
        
        if (existingGames[0].count === 0) {
            await connection.query(`
                INSERT INTO mini_games (name, type, description, difficulty_levels, max_score, xp_per_question, is_active) VALUES
                ('Flash Cards - Mathématiques', 'flash-cards', 'Répondez rapidement aux questions de mathématiques', 'facile,moyen,difficile', 100, 10, TRUE),
                ('Flash Cards - Sciences', 'flash-cards', 'Testez vos connaissances scientifiques', 'facile,moyen,difficile', 100, 10, TRUE),
                ('Flash Cards - Histoire', 'flash-cards', 'Explorez l\'histoire à travers des questions', 'facile,moyen,difficile', 100, 10, TRUE),
                ('Flash Cards - Géographie', 'flash-cards', 'Découvrez le monde avec la géographie', 'facile,moyen,difficile', 100, 10, TRUE)
            `);
            console.log('✅ Sample mini-games inserted');
        } else {
            console.log('ℹ️  Mini-games already exist, skipping sample data');
        }

        await connection.end();
        console.log('🎉 Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
