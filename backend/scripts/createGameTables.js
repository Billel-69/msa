const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function createGameTables() {
    try {
        console.log('🔄 Creating game tables in MySQL...');
        
        // Read SQL file
        const sqlFile = path.join(__dirname, '../database/game_schema.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split SQL statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('📝 Executing statement...');
                await db.execute(statement);
            }
        }
        
        console.log('✅ All tables created successfully!');
        
        // Verify tables
        const [tables] = await db.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('mini_games', 'game_sessions', 'user_game_progress')"
        );
        
        console.log('📊 Created tables:');
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME || table.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    } finally {
        await db.end();
        console.log('🔌 Database connection closed');
    }
}

// Execute
createGameTables();