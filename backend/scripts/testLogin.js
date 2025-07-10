const http = require('http');

function testLogin(email, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            identifier: email,
            password: password
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

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

        req.write(postData);
        req.end();
    });
}

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Usage: node testLogin.js <email> <password>');
        console.log('Example: node testLogin.js suspension@test.com password123');
        return;
    }

    console.log(`🧪 Test de connexion pour: ${email}`);
    
    try {
        const response = await testLogin(email, password);
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📄 Response: ${response.data}`);
        
        if (response.status === 403) {
            const data = JSON.parse(response.data);
            if (data.suspended) {
                console.log('✅ Suspension fonctionne correctement!');
            } else {
                console.log('❌ Erreur 403 mais pas de flag suspended');
            }
        } else if (response.status === 200) {
            console.log('❌ Connexion réussie - suspension ne fonctionne PAS');
        } else {
            console.log(`ℹ️  Autre réponse: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testLogin };