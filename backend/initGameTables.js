// Simple database initialization for mini-games
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function initializeGameTables() {
    try {
        console.log('🚀 Initializing Mini-Games Tables...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'msa'
        });

        // 1. Create game_sessions table
        console.log('Creating game_sessions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                game_id INT NOT NULL,
                session_type ENUM('flash_cards', 'branching_adventure') NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                final_score INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (game_id) REFERENCES mini_games(id) ON DELETE CASCADE
            )
        `);

        // 2. Create game_rewards table
        console.log('Creating game_rewards table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS game_rewards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                session_id INT,
                game_type ENUM('flash_cards', 'branching_adventure') NOT NULL,
                xp_earned INT DEFAULT 0,
                badge_earned VARCHAR(100),
                equipment_unlocked VARCHAR(100),
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE SET NULL
            )
        `);

        // 3. Create user_game_progress table
        console.log('Creating user_game_progress table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_game_progress (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                game_type ENUM('flash_cards', 'branching_adventure') NOT NULL,
                total_sessions INT DEFAULT 0,
                total_xp INT DEFAULT 0,
                best_score INT DEFAULT 0,
                current_level INT DEFAULT 1,
                last_played TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_game (user_id, game_type)
            )
        `);

        console.log('✅ All mini-games tables created successfully!');

        // Check if sample games exist
        const [existingGames] = await connection.query('SELECT COUNT(*) as count FROM mini_games WHERE type = "flash_cards"');
        
        if (existingGames[0].count === 0) {
            console.log('Adding sample flash cards games...');
            await connection.query(`
                INSERT INTO mini_games (name, type, description, target_cycle, subject, difficulty_level, theme) VALUES
                ('Flash Cards Mathématiques', 'flash_cards', 'Révise tes tables et calculs rapidement', 'cycle_4', 'mathematics', 'moyen', 'default'),
                ('Flash Cards Français', 'flash_cards', 'Améliore ton vocabulaire et ta grammaire', 'cycle_4', 'french', 'moyen', 'default'),
                ('Flash Cards Histoire', 'flash_cards', 'Teste tes connaissances historiques', 'cycle_4', 'history', 'moyen', 'default'),
                ('Flash Cards Sciences', 'flash_cards', 'Révise tes notions scientifiques', 'cycle_4', 'sciences', 'moyen', 'default')
            `);
            console.log('✅ Sample games added!');
        } else {
            console.log('ℹ️  Sample games already exist');
        }

        await connection.end();
        console.log('🎉 Mini-games database initialization complete!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    initializeGameTables();
}

module.exports = initializeGameTables;
