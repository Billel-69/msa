// ==========================================
// SCRIPT DE DIAGNOSTIC CORRIGÉ - diagnostic.js
// ==========================================

const mysql = require('mysql2/promise');

// Configuration base de données
const dbConfig = {
    host: 'localhost',
    user: 'root', // Votre utilisateur MySQL
    password: '', // Votre mot de passe MySQL
    database: 'msa' // Nom de votre base
};

async function runDiagnostic() {
    let connection;

    try {
        console.log('🔍 DIAGNOSTIC SYSTÈME LIVE SESSIONS');
        console.log('=====================================');

        // Connexion à la base
        console.log('\n1. Connexion à la base de données...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion réussie');

        // Vérifier les tables
        console.log('\n2. Vérification des tables...');
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE 'live_%'
        `);

        console.log('Tables live trouvées:');
        tables.forEach(table => {
            console.log(`   ✅ ${Object.values(table)[0]}`);
        });

        // Vérifier la structure de live_chat
        console.log('\n3. Structure table live_chat...');
        try {
            const [structure] = await connection.execute('DESCRIBE live_chat');
            console.log('✅ Table live_chat existe');
            console.table(structure);
        } catch (error) {
            console.log('❌ Table live_chat manquante');
            console.log('Création de la table...');

            await connection.execute(`
                CREATE TABLE live_chat (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    session_id INT NOT NULL,
                    user_id INT NOT NULL,
                    message TEXT NOT NULL,
                    message_type ENUM('text', 'system') DEFAULT 'text',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_session_time (session_id, created_at)
                )
            `);
            console.log('✅ Table live_chat créée');
        }

        // Vérifier les sessions existantes
        console.log('\n4. Sessions existantes...');
        const [sessions] = await connection.execute(`
            SELECT 
                id, 
                title, 
                teacher_id, 
                status, 
                room_code,
                created_at
            FROM live_sessions 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        if (sessions.length > 0) {
            console.log('Sessions trouvées:');
            console.table(sessions);
        } else {
            console.log('❌ Aucune session trouvée');
        }

        // Vérifier les participants
        console.log('\n5. Participants actifs...');
        const [participants] = await connection.execute(`
            SELECT 
                lp.session_id,
                ls.title,
                u.name as user_name,
                lp.role,
                lp.is_active,
                lp.joined_at
            FROM live_participants lp
            JOIN live_sessions ls ON lp.session_id = ls.id
            JOIN users u ON lp.user_id = u.id
            WHERE lp.is_active = 1
            ORDER BY lp.session_id, lp.joined_at
        `);

        if (participants.length > 0) {
            console.log('Participants actifs:');
            console.table(participants);
        } else {
            console.log('ℹ️  Aucun participant actif');
        }

        // Vérifier les messages de chat
        console.log('\n6. Messages de chat...');
        const [messages] = await connection.execute(`
            SELECT 
                lc.id,
                lc.session_id,
                ls.title as session_title,
                u.name as author,
                lc.message,
                lc.created_at
            FROM live_chat lc
            JOIN live_sessions ls ON lc.session_id = ls.id
            LEFT JOIN users u ON lc.user_id = u.id
            ORDER BY lc.created_at DESC
            LIMIT 10
        `);

        if (messages.length > 0) {
            console.log('Messages récents:');
            console.table(messages);
        } else {
            console.log('ℹ️  Aucun message de chat');
        }

        // Test de la requête problématique pour la session 12
        console.log('\n7. Test requête session 12...');
        try {
            const [chatTest] = await connection.execute(`
                SELECT
                    lc.id,
                    lc.session_id,
                    lc.user_id,
                    lc.message,
                    lc.message_type,
                    lc.created_at,
                    COALESCE(u.name, 'Utilisateur supprimé') as user_name,
                    u.username,
                    u.profile_picture,
                    u.account_type
                FROM live_chat lc
                LEFT JOIN users u ON lc.user_id = u.id
                WHERE lc.session_id = 12
                ORDER BY lc.created_at DESC
                LIMIT 50
            `);

            console.log(`✅ Requête réussie: ${chatTest.length} messages pour session 12`);

        } catch (error) {
            console.log('❌ Erreur requête session 12:', error.message);
        }

        // Vérifier les clés étrangères
        console.log('\n8. Vérification clés étrangères...');
        const [foreignKeys] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'live_chat'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        if (foreignKeys.length > 0) {
            console.log('Clés étrangères:');
            console.table(foreignKeys);
        } else {
            console.log('⚠️  Aucune clé étrangère trouvée');
        }

        // Vérifier les utilisateurs de test - VERSION CORRIGÉE
        console.log('\n9. Utilisateurs de test...');

        try {
            // D'abord, vérifier la structure de la table users
            const [userStructure] = await connection.execute('DESCRIBE users');
            const hasEmailVerified = userStructure.some(col => col.Field === 'email_verified');

            let query = `
                SELECT id, username, name, account_type
                FROM users 
                WHERE username LIKE '%_test'
            `;

            if (hasEmailVerified) {
                query = `
                    SELECT id, username, name, account_type, email_verified
                    FROM users 
                    WHERE username LIKE '%_test'
                `;
            }

            const [testUsers] = await connection.execute(query);

            if (testUsers.length > 0) {
                console.log('Utilisateurs de test:');
                console.table(testUsers);
            } else {
                console.log('❌ Aucun utilisateur de test trouvé');
                console.log('Exécutez: node createTestAccounts.js');
            }

        } catch (userError) {
            console.log('⚠️  Erreur vérification utilisateurs:', userError.message);
        }

        console.log('\n🎯 RÉSUMÉ DIAGNOSTIC');
        console.log('====================');
        console.log(`Sessions: ${sessions.length}`);
        console.log(`Participants actifs: ${participants.length}`);
        console.log(`Messages chat: ${messages.length}`);

        // Recommandations
        console.log('\n💡 RECOMMANDATIONS');
        console.log('==================');

        if (foreignKeys.length === 0) {
            console.log('⚠️  Ajouter les clés étrangères pour maintenir l\'intégrité');
        }

        console.log('✅ Le système semble fonctionnel');
        console.log('🧪 Prêt pour les tests manuels');

    } catch (error) {
        console.error('❌ Erreur diagnostic:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Fonction pour nettoyer et recréer les tables
async function resetLiveTables() {
    let connection;

    try {
        console.log('🔄 RESET DES TABLES LIVE');
        console.log('=========================');

        connection = await mysql.createConnection(dbConfig);

        // Supprimer les tables dans l'ordre
        console.log('Suppression des tables...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('DROP TABLE IF EXISTS live_chat');
        await connection.execute('DROP TABLE IF EXISTS live_participants');
        await connection.execute('DROP TABLE IF EXISTS live_sessions');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Tables supprimées');

        // Recréer les tables
        console.log('Recréation des tables...');

        // Table live_sessions
        await connection.execute(`
            CREATE TABLE live_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                subject VARCHAR(100),
                max_participants INT DEFAULT 50,
                current_participants INT DEFAULT 0,
                room_code VARCHAR(8) UNIQUE NOT NULL,
                password VARCHAR(255),
                status ENUM('waiting', 'live', 'ended') DEFAULT 'waiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP NULL,
                ended_at TIMESTAMP NULL,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_status (status),
                INDEX idx_room_code (room_code),
                INDEX idx_teacher (teacher_id)
            )
        `);

        // Table live_participants
        await connection.execute(`
            CREATE TABLE live_participants (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('teacher', 'student', 'parent') DEFAULT 'student',
                is_active BOOLEAN DEFAULT TRUE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMP NULL,
                UNIQUE KEY unique_session_user (session_id, user_id),
                FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_active (session_id, is_active),
                INDEX idx_user_active (user_id, is_active)
            )
        `);

        // Table live_chat
        await connection.execute(`
            CREATE TABLE live_chat (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id INT NOT NULL,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                message_type ENUM('text', 'system', 'emoji') DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_time (session_id, created_at),
                INDEX idx_user_time (user_id, created_at)
            )
        `);

        console.log('✅ Tables recréées avec succès');

    } catch (error) {
        console.error('❌ Erreur reset:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Fonction pour ajouter les clés étrangères manquantes
async function addForeignKeys() {
    let connection;

    try {
        console.log('🔗 AJOUT DES CLÉS ÉTRANGÈRES');
        console.log('============================');

        connection = await mysql.createConnection(dbConfig);

        // Vérifier si les clés existent déjà
        const [existingKeys] = await connection.execute(`
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'live_chat'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        if (existingKeys.length > 0) {
            console.log('✅ Clés étrangères déjà présentes');
            return;
        }

        // Ajouter les clés étrangères
        console.log('Ajout des contraintes...');

        await connection.execute(`
            ALTER TABLE live_chat 
            ADD CONSTRAINT fk_chat_session 
            FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE
        `);

        await connection.execute(`
            ALTER TABLE live_chat 
            ADD CONSTRAINT fk_chat_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);

        console.log('✅ Clés étrangères ajoutées avec succès');

    } catch (error) {
        console.error('❌ Erreur ajout clés:', error.message);
        console.log('💡 Les clés peuvent déjà exister ou il y a des données incompatibles');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Fonction de test complet
async function testLiveSystem() {
    console.log('🧪 TEST SYSTÈME LIVE COMPLET');
    console.log('============================');

    try {
        await runDiagnostic();

        console.log('\n✅ Diagnostic terminé');
        console.log('\n📝 Prochaines étapes :');
        console.log('1. Créer les comptes de test: node createTestAccounts.js');
        console.log('2. Redémarrer votre serveur backend');
        console.log('3. Ouvrir deux fenêtres navigateur');
        console.log('4. Se connecter avec prof_test et eleve_test');
        console.log('5. Créer une session et tester le chat');

    } catch (error) {
        console.error('❌ Erreur test:', error.message);
    }
}

// Exécution selon l'argument
const action = process.argv[2];

console.log('🚀 DIAGNOSTIC LIVE SESSIONS MSA');
console.log('================================');

if (action === 'reset') {
    resetLiveTables();
} else if (action === 'keys') {
    addForeignKeys();
} else if (action === 'test') {
    testLiveSystem();
} else {
    runDiagnostic();
}

console.log('\n💡 Commandes disponibles:');
console.log('  node diagnostic.js        - Diagnostic complet');
console.log('  node diagnostic.js reset  - Reset des tables');
console.log('  node diagnostic.js keys   - Ajouter clés étrangères');
console.log('  node diagnostic.js test   - Test complet');

module.exports = { runDiagnostic, resetLiveTables, addForeignKeys };