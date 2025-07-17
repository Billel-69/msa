const db = require('../config/db');

async function debugSuspension() {
    console.log('🔍 Debug du système de suspension...\n');

    try {
        // 1. Vérifier la structure de la table users
        console.log('1. Vérification de la structure de la table users...');
        const [columns] = await db.execute('DESCRIBE users');
        
        console.log('Colonnes trouvées:');
        columns.forEach(col => {
            if (col.Field.includes('suspend') || col.Field.includes('admin')) {
                console.log(`   ✅ ${col.Field} (${col.Type}) DEFAULT: ${col.Default}`);
            }
        });

        const hasSuspended = columns.find(col => col.Field === 'is_suspended');
        const hasSuperAdmin = columns.find(col => col.Field === 'is_super_admin');

        if (!hasSuspended) {
            console.log('   ❌ Colonne is_suspended manquante!');
            console.log('   💡 Exécutez: node scripts/fixAdminColumns.js');
            return;
        }

        // 2. Vérifier les utilisateurs existants
        console.log('\n2. Vérification des utilisateurs...');
        const [users] = await db.execute(`
            SELECT id, name, username, email, account_type, is_suspended, is_super_admin 
            FROM users 
            ORDER BY id ASC 
            LIMIT 10
        `);

        console.log('Utilisateurs trouvés:');
        users.forEach(user => {
            const suspendedStatus = user.is_suspended ? '🚫 SUSPENDU' : '✅ Actif';
            const adminStatus = user.account_type === 'admin' ? 
                (user.is_super_admin ? '👑 SUPER ADMIN' : '🛡️ ADMIN') : 
                `👤 ${user.account_type}`;
            
            console.log(`   ID ${user.id}: ${user.username} (${user.email}) - ${adminStatus} - ${suspendedStatus}`);
        });

        // 3. Test de suspension d'un utilisateur
        console.log('\n3. Test de suspension...');
        const testUser = users.find(u => u.account_type !== 'admin');
        
        if (!testUser) {
            console.log('   ⚠️  Aucun utilisateur non-admin trouvé pour le test');
            return;
        }

        console.log(`   Test avec utilisateur: ${testUser.username} (ID: ${testUser.id})`);
        
        // Suspendre l'utilisateur de test
        await db.execute('UPDATE users SET is_suspended = 1 WHERE id = ?', [testUser.id]);
        console.log('   ✅ Utilisateur suspendu');

        // Vérifier la suspension
        const [suspendedUser] = await db.execute(
            'SELECT is_suspended FROM users WHERE id = ?', 
            [testUser.id]
        );
        
        if (suspendedUser[0].is_suspended) {
            console.log('   ✅ Suspension confirmée dans la DB');
        } else {
            console.log('   ❌ Suspension échouée dans la DB');
        }

        // Remettre l'utilisateur actif
        await db.execute('UPDATE users SET is_suspended = 0 WHERE id = ?', [testUser.id]);
        console.log('   ✅ Utilisateur réactivé');

        // 4. Test du modèle utilisateur
        console.log('\n4. Test du modèle utilisateur...');
        const userModel = require('../models/userModel');
        const foundUser = await userModel.findUserByEmailOrUsername(testUser.email);
        
        if (foundUser && typeof foundUser.is_suspended !== 'undefined') {
            console.log('   ✅ Modèle utilisateur retourne is_suspended');
        } else {
            console.log('   ❌ Modèle utilisateur ne retourne PAS is_suspended');
            console.log('   🔧 Le modèle doit être mis à jour');
        }

        console.log('\n🎉 Debug terminé!');
        console.log('\n📋 Résumé:');
        console.log('   - Colonne is_suspended: ' + (hasSuspended ? '✅' : '❌'));
        console.log('   - Colonne is_super_admin: ' + (hasSuperAdmin ? '✅' : '❌'));
        console.log('   - Utilisateurs trouvés: ' + users.length);
        console.log('   - Test suspension: ✅');

    } catch (error) {
        console.error('❌ Erreur durant le debug:', error);
    }
}

async function testSuspensionAPI(userEmail) {
    console.log(`\n🧪 Test API de suspension pour: ${userEmail}`);
    
    try {
        // Trouver l'utilisateur
        const [users] = await db.execute('SELECT id, is_suspended FROM users WHERE email = ?', [userEmail]);
        
        if (users.length === 0) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        const user = users[0];
        const newStatus = !user.is_suspended;
        
        // Changer le statut
        await db.execute('UPDATE users SET is_suspended = ? WHERE id = ?', [newStatus, user.id]);
        
        console.log(`✅ Statut changé: ${newStatus ? 'SUSPENDU' : 'ACTIF'}`);
        
        // Vérifier le changement
        const [updatedUsers] = await db.execute('SELECT is_suspended FROM users WHERE id = ?', [user.id]);
        console.log(`🔍 Statut confirmé: ${updatedUsers[0].is_suspended ? 'SUSPENDU' : 'ACTIF'}`);
        
        return { userId: user.id, suspended: updatedUsers[0].is_suspended };
        
    } catch (error) {
        console.error('❌ Erreur API test:', error);
    }
}

// Script principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args[0] === 'test' && args[1]) {
        await testSuspensionAPI(args[1]);
    } else {
        await debugSuspension();
    }
    
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = { debugSuspension, testSuspensionAPI };