const db = require('../config/db');

async function promoteToAdmin(email, isSuperAdmin = false) {
    try {
        // Vérifier si l'utilisateur existe
        const [userResult] = await db.execute(
            'SELECT id, email, name, account_type FROM users WHERE email = ?',
            [email]
        );

        if (userResult.length === 0) {
            console.error(`❌ Utilisateur avec l'email ${email} non trouvé`);
            return false;
        }

        const user = userResult[0];

        if (user.account_type === 'admin') {
            console.log(`ℹ️  L'utilisateur ${user.name} (${user.email}) est déjà administrateur`);
            
            // Vérifier/mettre à jour le statut super admin
            if (isSuperAdmin) {
                await db.execute(
                    'UPDATE users SET is_super_admin = TRUE WHERE id = ?',
                    [user.id]
                );
                console.log(`✅ ${user.name} est maintenant super administrateur`);
            }
            return true;
        }

        // Promouvoir l'utilisateur (gestion des colonnes manquantes)
        try {
            await db.execute(
                'UPDATE users SET account_type = ?, is_super_admin = ? WHERE id = ?',
                ['admin', isSuperAdmin, user.id]
            );
        } catch (error) {
            if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('is_super_admin')) {
                console.log('⚠️  Colonne is_super_admin manquante, promotion sans flag super admin...');
                await db.execute(
                    'UPDATE users SET account_type = ? WHERE id = ?',
                    ['admin', user.id]
                );
                console.log('⚠️  Veuillez exécuter le script fixAdminColumns.js pour ajouter les colonnes manquantes');
            } else {
                throw error;
            }
        }

        console.log(`✅ Utilisateur ${user.name} (${user.email}) promu au rang d'administrateur`);
        if (isSuperAdmin) {
            console.log(`🔥 Avec les privilèges de super administrateur`);
        }

        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la promotion:', error);
        return false;
    }
}

async function listAdmins() {
    try {
        const [admins] = await db.execute(
            'SELECT id, name, email, is_super_admin, created_at FROM users WHERE account_type = "admin"'
        );

        console.log('\n📋 Liste des administrateurs:');
        console.log('================================');
        
        if (admins.length === 0) {
            console.log('Aucun administrateur trouvé.');
            return;
        }

        admins.forEach((admin, index) => {
            const superAdminBadge = admin.is_super_admin ? '🔥 SUPER ADMIN' : '👤 ADMIN';
            console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${superAdminBadge}`);
            console.log(`   Créé le: ${new Date(admin.created_at).toLocaleDateString('fr-FR')}`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des admins:', error);
    }
}

// Script principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📖 Usage:
  node promoteToAdmin.js <email> [super]     - Promouvoir un utilisateur
  node promoteToAdmin.js list                - Lister tous les admins

📝 Exemples:
  node promoteToAdmin.js user@example.com
  node promoteToAdmin.js user@example.com super
  node promoteToAdmin.js list
        `);
        process.exit(1);
    }

    if (args[0] === 'list') {
        await listAdmins();
        process.exit(0);
    }

    const email = args[0];
    const isSuperAdmin = args[1] === 'super';

    console.log(`🔧 Promotion de l'utilisateur: ${email}`);
    if (isSuperAdmin) {
        console.log('🔥 Avec privilèges de super administrateur');
    }

    const success = await promoteToAdmin(email, isSuperAdmin);
    
    if (success) {
        console.log('\n✅ Promotion réussie!');
        console.log('\n💡 L\'utilisateur peut maintenant:');
        console.log('  - Accéder au panel d\'administration');
        console.log('  - Gérer les autres utilisateurs');
        console.log('  - Voir les statistiques de la plateforme');
        if (isSuperAdmin) {
            console.log('  - Promouvoir d\'autres utilisateurs en admin');
        }
    } else {
        console.log('\n❌ Échec de la promotion');
        process.exit(1);
    }

    process.exit(0);
}

// Exécuter uniquement si le script est appelé directement
if (require.main === module) {
    main();
}

module.exports = { promoteToAdmin, listAdmins };