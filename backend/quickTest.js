// Simple test for Flash Cards API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAvailableGames() {
    try {
        console.log('🧪 Testing available games endpoint (without auth)...');
        
        // Create a fake authorization header for testing
        const headers = { 
            Authorization: 'Bearer fake-token-for-testing' 
        };

        const response = await axios.get(`${BASE_URL}/api/games/available`, { headers });
        console.log('✅ Available games:', response.data);
        
    } catch (error) {
        console.error('❌ Test failed:', {
            status: error.response?.status,
            message: error.response?.data || error.message
        });
        
        if (error.response?.status === 401) {
            console.log('💡 Authentication required - this is expected');
        }
    }
}

async function testBasicEndpoint() {
    try {
        console.log('🧪 Testing basic API endpoint...');
        const response = await axios.get(`${BASE_URL}/`);
        console.log('✅ Basic endpoint working:', response.data);
    } catch (error) {
        console.error('❌ Basic endpoint failed:', error.message);
    }
}

async function runQuickTests() {
    console.log('🚀 Running Quick Flash Cards Tests...\n');
    
    await testBasicEndpoint();
    console.log();
    await testAvailableGames();
    
    console.log('\n✨ Tests completed!');
}

runQuickTests();
