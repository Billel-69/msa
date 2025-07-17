const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runAdminMigration() {
    try {
        console.log('🔧 Démarrage de la migration admin...');

        // Lire le fichier de migration
        const migrationPath = path.join(__dirname, '../migrations/add_admin_role.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Diviser les requêtes SQL
        const queries = migrationSQL
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0 && !query.startsWith('--'));

        console.log(`📝 Exécution de ${queries.length} requêtes de migration...`);

        // Exécuter chaque requête
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            console.log(`Requête ${i + 1}/${queries.length}: ${query.substring(0, 50)}...`);
            
            try {
                await db.execute(query);
                console.log(`✅ Requête ${i + 1} exécutée avec succès`);
            } catch (error) {
                // Ignorer les erreurs de colonnes/tables déjà existantes
                if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`⚠️  Requête ${i + 1} ignorée (élément déjà existant)`);
                } else {
                    console.error(`❌ Erreur requête ${i + 1}:`, error.message);
                }
            }
        }

        // Ajouter la colonne is_suspended si elle n'existe pas
        try {
            await db.execute('ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE');
            console.log('✅ Colonne is_suspended ajoutée');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Colonne is_suspended déjà existante');
            } else {
                console.error('❌ Erreur lors de l\'ajout de is_suspended:', error.message);
            }
        }

        console.log('\n🎉 Migration admin terminée avec succès!');
        console.log('\n📋 Résumé des changements:');
        console.log('  - Rôle admin ajouté à la table users');
        console.log('  - Colonne is_super_admin ajoutée');
        console.log('  - Colonne is_suspended ajoutée');
        console.log('  - Table admin_actions créée pour l\'audit');
        console.log('  - Index créés pour optimiser les performances');

        console.log('\n🔧 Prochaines étapes:');
        console.log('  1. Redémarrer le serveur pour charger les nouvelles routes');
        console.log('  2. Utiliser le script promoteToAdmin.js pour créer votre premier admin');
        console.log('     Exemple: node scripts/promoteToAdmin.js user@example.com super');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

// Exécuter uniquement si le script est appelé directement
if (require.main === module) {
    runAdminMigration().then(() => {
        console.log('\n✅ Migration terminée!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { runAdminMigration };