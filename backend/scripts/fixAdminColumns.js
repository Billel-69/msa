const db = require('../config/db');

async function checkTableStructure() {
    try {
        const [columns] = await db.execute('DESCRIBE users');
        console.log('📋 Structure actuelle de la table users:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });
        return columns;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de la structure:', error);
        return [];
    }
}

async function addMissingColumns() {
    try {
        const columns = await checkTableStructure();
        const columnNames = columns.map(col => col.Field);

        console.log('\n🔧 Ajout des colonnes manquantes...');

        // Vérifier et ajouter is_super_admin
        if (!columnNames.includes('is_super_admin')) {
            console.log('➕ Ajout de la colonne is_super_admin...');
            await db.execute('ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE AFTER account_type');
            console.log('✅ Colonne is_super_admin ajoutée');
        } else {
            console.log('✅ Colonne is_super_admin déjà présente');
        }

        // Vérifier et ajouter is_suspended
        if (!columnNames.includes('is_suspended')) {
            console.log('➕ Ajout de la colonne is_suspended...');
            await db.execute('ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE AFTER is_super_admin');
            console.log('✅ Colonne is_suspended ajoutée');
        } else {
            console.log('✅ Colonne is_suspended déjà présente');
        }

        // Vérifier et modifier account_type pour inclure admin
        const accountTypeCol = columns.find(col => col.Field === 'account_type');
        if (accountTypeCol && !accountTypeCol.Type.includes('admin')) {
            console.log('➕ Mise à jour du type account_type pour inclure admin...');
            await db.execute("ALTER TABLE users MODIFY COLUMN account_type ENUM('parent', 'child', 'teacher', 'admin') NOT NULL");
            console.log('✅ Type account_type mis à jour');
        } else {
            console.log('✅ Type account_type déjà mis à jour');
        }

        console.log('\n🎉 Toutes les colonnes ont été ajoutées avec succès!');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des colonnes:', error);
        return false;
    }
}

async function createAdminActionsTable() {
    try {
        console.log('🔧 Création de la table admin_actions...');
        
        // First check if the table already exists
        const [existingTables] = await db.execute(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'admin_actions'
        `);
        
        if (existingTables[0].count > 0) {
            console.log('✅ Table admin_actions déjà existante');
            return;
        }

        // Create table without foreign key constraint first (MyISAM like your other tables)
        await db.execute(`
            CREATE TABLE admin_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                target_type VARCHAR(50),
                target_id INT,
                details JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_admin_id (admin_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table admin_actions créée');
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('✅ Table admin_actions déjà existante');
        } else {
            console.error('❌ Erreur lors de la création de la table admin_actions:', error.message);
        }
    }
}

async function main() {
    console.log('🚀 Démarrage de la correction des colonnes admin...\n');
    
    await checkTableStructure();
    
    const success = await addMissingColumns();
    
    if (success) {
        await createAdminActionsTable();
        console.log('\n✅ Correction terminée avec succès!');
        console.log('\n🔧 Vous pouvez maintenant utiliser:');
        console.log('   node scripts/promoteToAdmin.js prof1@test.com super');
    } else {
        console.log('\n❌ Échec de la correction');
        process.exit(1);
    }
}

if (require.main === module) {
    main().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { checkTableStructure, addMissingColumns, createAdminActionsTable };