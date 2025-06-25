// Test script for the Flash Cards API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let gameSessionId = '';

// Test data - you'll need to update these with valid user credentials
const testUser = {
    username: 'testuser', // Update with existing user
    password: 'password123' // Update with correct password
};

async function testFlashCardsAPI() {
    try {
        console.log('🧪 Starting Flash Cards API Tests...\n');

        // 1. Login to get auth token
        console.log('1️⃣ Testing user login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${authToken}` };

        // 2. Get available games
        console.log('\n2️⃣ Testing available games endpoint...');
        const gamesResponse = await axios.get(`${BASE_URL}/api/games/available`, { headers });
        console.log('✅ Available games:', gamesResponse.data.games?.length || 0);

        // 3. Start a flash cards session
        console.log('\n3️⃣ Testing flash cards session start...');
        const startResponse = await axios.post(`${BASE_URL}/api/games/flash-cards/start`, {
            subject: 'mathématiques',
            difficulty: 'facile',
            questionCount: 5
        }, { headers });
        
        gameSessionId = startResponse.data.sessionId;
        const questions = startResponse.data.questions;
        console.log('✅ Session started with', questions?.length || 0, 'questions');

        // 4. Submit answers for each question
        if (questions && questions.length > 0) {
            console.log('\n4️⃣ Testing answer submission...');
            
            for (let i = 0; i < Math.min(3, questions.length); i++) {
                const question = questions[i];
                // For testing, we'll alternate between correct and incorrect answers
                const isCorrect = i % 2 === 0;
                const answer = isCorrect ? question.correctAnswer : 'wrong_answer';
                
                const answerResponse = await axios.post(`${BASE_URL}/api/games/flash-cards/answer`, {
                    sessionId: gameSessionId,
                    questionId: question.id,
                    answer: answer,
                    timeSpent: 3000 + Math.random() * 2000 // Random time between 3-5 seconds
                }, { headers });
                
                console.log(`   Question ${i + 1}: ${answerResponse.data.isCorrect ? '✅' : '❌'} (Expected: ${isCorrect ? 'correct' : 'incorrect'})`);
            }
        }

        // 5. Complete the session
        console.log('\n5️⃣ Testing session completion...');
        const completeResponse = await axios.post(`${BASE_URL}/api/games/flash-cards/complete`, {
            sessionId: gameSessionId
        }, { headers });
        
        console.log('✅ Session completed');
        console.log('   Final Score:', completeResponse.data.finalScore);
        console.log('   XP Earned:', completeResponse.data.xpEarned);

        // 6. Get user stats
        console.log('\n6️⃣ Testing user statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/api/games/flash-cards/stats`, { headers });
        console.log('✅ User stats retrieved');
        console.log('   Total Sessions:', statsResponse.data.stats?.totalSessions || 0);
        console.log('   Best Score:', statsResponse.data.stats?.bestScore || 0);

        // 7. Get leaderboard
        console.log('\n7️⃣ Testing leaderboard...');
        const leaderboardResponse = await axios.get(`${BASE_URL}/api/games/leaderboard/flash-cards`, { headers });
        console.log('✅ Leaderboard retrieved with', leaderboardResponse.data.leaderboard?.length || 0, 'entries');

        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('💡 Make sure to update the testUser credentials in this script');
        }
    }
}

// Helper function to create a test user if needed
async function createTestUser() {
    try {
        console.log('Creating test user...');
        await axios.post(`${BASE_URL}/api/auth/register`, {
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'student'
        });
        console.log('✅ Test user created');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('ℹ️  Test user already exists');
        } else {
            console.error('❌ Failed to create test user:', error.response?.data || error.message);
        }
    }
}

// Run tests
async function runTests() {
    console.log('🔧 Setting up test environment...\n');
    
    // First try to create a test user
    await createTestUser();
    
    // Wait a moment then run the actual tests
    setTimeout(testFlashCardsAPI, 1000);
}

if (require.main === module) {
    runTests();
}

module.exports = { testFlashCardsAPI, createTestUser };
