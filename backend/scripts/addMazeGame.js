const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function addMazeGame() {
    try {
        console.log('🎮 Adding Knowledge Maze Explorer to database...');
        
        const gameId = uuidv4();
        const mazeGameData = {
            id: gameId,
            name: 'Knowledge Maze Explorer',
            description: 'Naviguez dans un labyrinthe interactif et résolvez des défis éducatifs pour progresser ! Utilisez vos capacités spéciales pour surmonter les obstacles.',
            type: 'maze',
            difficulty: 'moyen',
            subject: 'multi-matières',
            imageUrl: '/assets/games/maze-explorer.png',
            xpReward: 30,
            fragmentsReward: 3,
            questions: null, // Questions will be generated dynamically via OpenAI
            memoryPairs: null,
            puzzleData: JSON.stringify({
                mazeConfig: {
                    width: 18,
                    height: 10,
                    cellSize: 50,
                    abilities: {
                        sprint: { cost: 10, duration: 5000, cooldown: 10000 },
                        hint: { uses: 3, cost: 0 },
                        shield: { cost: 20, duration: 10000, cooldown: 20000 },
                        freeze: { cost: 30, cooldown: 30000 }
                    }
                },
                gameplay: {
                    minGates: 3,
                    maxGates: 6,
                    energyPerCollectible: 20,
                    energyLossOnWrongAnswer: 20,
                    energyGainOnCorrectAnswer: 10,
                    xpPerCorrectAnswer: 100,
                    xpPerCollectible: 50
                }
            }),
            status: 'active'
        };

        // Check if game already exists
        const [existing] = await db.execute(
            'SELECT id FROM mini_games WHERE name = ?',
            [mazeGameData.name]
        );

        if (existing.length > 0) {
            console.log('⚠️ Knowledge Maze Explorer already exists, updating...');
            await db.execute(
                `UPDATE mini_games 
                 SET description = ?, type = ?, difficulty = ?, subject = ?, 
                     imageUrl = ?, xpReward = ?, fragmentsReward = ?, puzzleData = ?, 
                     status = ?, updated_at = NOW()
                 WHERE name = ?`,
                [
                    mazeGameData.description,
                    mazeGameData.type,
                    mazeGameData.difficulty,
                    mazeGameData.subject,
                    mazeGameData.imageUrl,
                    mazeGameData.xpReward,
                    mazeGameData.fragmentsReward,
                    mazeGameData.puzzleData,
                    mazeGameData.status,
                    mazeGameData.name
                ]
            );
            console.log('✅ Knowledge Maze Explorer updated successfully!');
        } else {
            // Insert new game
            await db.execute(
                `INSERT INTO mini_games 
                 (id, name, description, type, difficulty, subject, imageUrl, xpReward, fragmentsReward, puzzleData, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    mazeGameData.id,
                    mazeGameData.name,
                    mazeGameData.description,
                    mazeGameData.type,
                    mazeGameData.difficulty,
                    mazeGameData.subject,
                    mazeGameData.imageUrl,
                    mazeGameData.xpReward,
                    mazeGameData.fragmentsReward,
                    mazeGameData.puzzleData,
                    mazeGameData.status
                ]
            );
            console.log('✅ Knowledge Maze Explorer added successfully!');
        }

        // Verify the insertion
        const [games] = await db.execute(
            'SELECT id, name, type, status FROM mini_games ORDER BY created_at'
        );

        console.log('📊 Current games in database:');
        games.forEach((game, index) => {
            console.log(`   ${index + 1}. ${game.name} (${game.type}) - ${game.status}`);
        });

    } catch (error) {
        console.error('❌ Error adding maze game:', error);
        process.exit(1);
    } finally {
        await db.end();
        console.log('🔌 Database connection closed');
    }
}

// Execute
addMazeGame();