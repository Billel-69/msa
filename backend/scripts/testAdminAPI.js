const http = require('http');

// Function to test an endpoint
function testEndpoint(path, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function testAdminAPI() {
    console.log('🔧 Test des endpoints admin...\n');

    // Test basic server
    console.log('1. Test du serveur de base...');
    try {
        const healthResponse = await testEndpoint('/');
        console.log(`   Status: ${healthResponse.status}`);
        console.log(`   Response: ${healthResponse.data.substring(0, 100)}...`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        console.log('   Le serveur backend n\'est probablement pas démarré sur le port 5000');
        return;
    }

    // Test admin stats without auth (should fail)
    console.log('\n2. Test admin stats sans authentification...');
    try {
        const statsResponse = await testEndpoint('/api/admin/stats');
        console.log(`   Status: ${statsResponse.status}`);
        console.log(`   Response: ${statsResponse.data.substring(0, 200)}`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test admin users without auth (should fail)
    console.log('\n3. Test admin users sans authentification...');
    try {
        const usersResponse = await testEndpoint('/api/admin/users');
        console.log(`   Status: ${usersResponse.status}`);
        console.log(`   Response: ${usersResponse.data.substring(0, 200)}`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test auth endpoint
    console.log('\n4. Test endpoint auth...');
    try {
        const authResponse = await testEndpoint('/api/auth/me');
        console.log(`   Status: ${authResponse.status}`);
        console.log(`   Response: ${authResponse.data.substring(0, 200)}`);
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
    }

    console.log('\n📋 Résumé:');
    console.log('   - Si le serveur répond sur le port 5000: ✅ Backend OK');
    console.log('   - Si admin endpoints retournent 401: ✅ Auth fonctionne');
    console.log('   - Si admin endpoints retournent 404: ❌ Routes admin manquantes');
    console.log('\n💡 Instructions:');
    console.log('   1. Assurez-vous que le backend est démarré: npm start ou node server.js');
    console.log('   2. Vérifiez que les routes admin sont chargées dans server.js');
    console.log('   3. Connectez-vous avec un compte admin pour obtenir un token valide');
}

if (require.main === module) {
    testAdminAPI();
}

module.exports = { testAdminAPI };