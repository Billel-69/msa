const db = require('../config/db');

async function addImageUrls() {
    try {
        console.log('🔄 Ajout des URLs d\'images aux mini-jeux...');
        
        // Ajouter la colonne image_url si elle n'existe pas
        console.log('📝 Ajout de la colonne image_url...');
        try {
            await db.execute('ALTER TABLE mini_games ADD COLUMN image_url VARCHAR(500) DEFAULT NULL');
            console.log('✅ Colonne image_url ajoutée');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⏩ La colonne image_url existe déjà');
            } else {
                throw err;
            }
        }
        
        // Mettre à jour les URLs des images pour chaque jeu
        console.log('\n📸 Mise à jour des URLs des images...');
        
        const imageUpdates = [
            {
                name: 'Battle Quiz',
                image: '/assets/games/battle-quiz.png'
            },
            {
                name: 'Memory Match',
                image: '/assets/games/memory-match.png'
            },
            {
                name: 'Logic Builder',
                image: '/assets/games/logic-builder.png'
            }
        ];
        
        for (const update of imageUpdates) {
            const [result] = await db.execute(
                'UPDATE mini_games SET image_url = ? WHERE name = ?',
                [update.image, update.name]
            );
            
            if (result.affectedRows > 0) {
                console.log(`✅ ${update.name}: ${update.image}`);
            } else {
                console.log(`⚠️  ${update.name}: Jeu non trouvé`);
            }
        }
        
        // Vérifier les résultats
        console.log('\n📊 Vérification des jeux avec images :');
        const [games] = await db.execute(
            'SELECT id, name, image_url FROM mini_games ORDER BY id'
        );
        
        games.forEach(game => {
            console.log(`   ID ${game.id}: ${game.name} => ${game.image_url || 'Pas d\'image'}`);
        });
        
        console.log('\n✅ Mise à jour terminée !');
        console.log('\n📁 N\'oubliez pas de placer vos images dans :');
        console.log('   frontend/public/assets/games/');
        console.log('   - battle-quiz.png');
        console.log('   - memory-match.png');
        console.log('   - logic-builder.png');
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour :', error);
        process.exit(1);
    } finally {
        await db.end();
        console.log('\n🔌 Connexion fermée');
    }
}

// Exécuter
addImageUrls();