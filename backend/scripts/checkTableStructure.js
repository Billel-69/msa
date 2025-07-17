const db = require('../config/db');

async function checkTableStructure() {
    try {
        console.log('🔍 Checking mini_games table structure...\n');
        
        // Get column information
        const [columns] = await db.execute(
            `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mini_games'
             ORDER BY ORDINAL_POSITION`
        );
        
        console.log('📊 mini_games table columns:');
        console.log('----------------------------------------');
        columns.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
    } finally {
        await db.end();
    }
}

checkTableStructure();