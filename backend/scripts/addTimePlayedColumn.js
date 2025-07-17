// Script to add total_time_played column to user_game_progress table
const db = require('../config/db');

async function addTimePlayedColumn() {
    try {
        console.log('Adding total_time_played column to user_game_progress table...');
        
        // Add the column
        await db.execute(`
            ALTER TABLE user_game_progress 
            ADD COLUMN total_time_played INT DEFAULT 0 
            COMMENT 'Total time played in seconds'
            AFTER best_score
        `);
        
        console.log('✅ Successfully added total_time_played column');
        
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column total_time_played already exists');
        } else {
            console.error('❌ Error adding column:', error.message);
            throw error;
        }
    } finally {
        process.exit();
    }
}

// Run the migration
addTimePlayedColumn();