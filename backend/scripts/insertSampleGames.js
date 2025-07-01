const db = require('../config/db');

async function insertSampleGames() {
    try {
        console.log('🔄 Inserting sample games into MySQL...');
        
        // Clear existing games
        console.log('🗑️  Clearing existing games...');
        await db.execute('DELETE FROM game_sessions WHERE game_id IN (SELECT id FROM mini_games)');
        await db.execute('DELETE FROM mini_games');
        
        // Templates de jeux (contenu généré dynamiquement selon niveau/matière)
        const games = [
            {
                name: 'Battle Quiz',
                type: 'quiz',
                description: 'Défie tes connaissances ! Réponds à des questions personnalisées selon ta matière et ton niveau pour gagner des XP',
                target_cycle: 'all',
                subject: 'all',
                difficulty_level: 'adaptive',
                theme: 'educational',
                is_active: 1
            },
            {
                name: 'Memory Match',
                type: 'memory',
                description: 'Entraîne ta mémoire ! Associe les concepts, définitions ou formules de ta matière dans ce jeu de cartes',
                target_cycle: 'all',
                subject: 'all',
                difficulty_level: 'adaptive',
                theme: 'educational',
                is_active: 1
            },
            {
                name: 'Logic Builder',
                type: 'puzzle',
                description: 'Construis la logique ! Remets dans l\'ordre les étapes, événements ou processus selon ton domaine d\'étude',
                target_cycle: 'all',
                subject: 'all',
                difficulty_level: 'adaptive',
                theme: 'educational',
                is_active: 1
            }
        ];
        
        // Insert games
        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            const id = i + 1; // Start IDs from 1
            
            await db.execute(
                `INSERT INTO mini_games (
                    id, name, type, description, target_cycle, subject, 
                    difficulty_level, theme, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    game.name,
                    game.type,
                    game.description,
                    game.target_cycle,
                    game.subject,
                    game.difficulty_level,
                    game.theme,
                    game.is_active
                ]
            );
            
            console.log(`✅ Inserted: ${game.name} (ID: ${id})`);
        }
        
        // Verify insertion
        const [result] = await db.execute('SELECT COUNT(*) as count FROM mini_games');
        console.log(`\n📊 Total games in database: ${result[0].count}`);
        
        // Display all games
        const [allGames] = await db.execute('SELECT id, name, type, subject, difficulty_level FROM mini_games');
        console.log('\n📋 Games in database:');
        allGames.forEach(game => {
            console.log(`   ID ${game.id}: ${game.name} (${game.type} - ${game.subject} - ${game.difficulty_level})`);
        });
        
        console.log('\n✅ Sample games inserted successfully!');
        
    } catch (error) {
        console.error('❌ Error inserting games:', error);
        process.exit(1);
    } finally {
        await db.end();
        console.log('🔌 Database connection closed');
    }
}

// Execute
insertSampleGames();