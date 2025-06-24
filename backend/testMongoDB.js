// Test MongoDB Connection
const connectMongoDB = require('./config/mongodb');
const MongoUser = require('./models/mongodb/User');
const MongoAnalytics = require('./models/mongodb/Analytics');

async function testMongoDB() {
    try {
        console.log('🧪 Testing MongoDB Connection...');
        
        // Connect to MongoDB
        await connectMongoDB();
        
        // Test basic operations
        console.log('📊 Testing MongoDB Operations...');
        
        // Test User model
        const testUser = new MongoUser({
            username: 'test_user_' + Date.now(),
            email: 'test@example.com',
            role: 'child',
            profile: {
                bio: 'Test user for MongoDB connection',
                interests: ['mathematics', 'science'],
                preferences: {
                    theme: 'dark',
                    language: 'fr'
                }
            },
            education: {
                level: 'elementary',
                subjects: ['math', 'science'],
                progress: {
                    totalPoints: 100,
                    currentLevel: 2,
                    fragments: 5,
                    questsCompleted: 3
                }
            }
        });
        
        await testUser.save();
        console.log('✅ User saved successfully:', testUser._id);
        
        // Test Analytics model
        const testAnalytics = new MongoAnalytics({
            eventType: 'learning_event',
            user: {
                userId: testUser._id,
                role: 'child',
                age: 10,
                grade: 'CM1',
                mysqlUserId: 123
            },
            session: {
                sessionId: 'test_session_' + Date.now(),
                deviceType: 'desktop',
                browser: 'chrome',
                os: 'windows'
            },
            event: {
                action: 'quest_completed',
                target: 'math_quest_1',
                category: 'education',
                label: 'mathematics',
                value: 50,
                duration: 120000,
                educational: {
                    subject: 'mathematics',
                    topic: 'addition',
                    difficulty: 'beginner',
                    score: 85,
                    attempts: 2,
                    timeSpent: 120
                }
            },
            context: {
                questId: 'math_001',
                worldId: 'math_world',
                achievements: ['first_quest'],
                metadata: {
                    testConnection: true,
                    timestamp: new Date()
                }
            }
        });
        
        await testAnalytics.save();
        console.log('✅ Analytics event saved successfully:', testAnalytics._id);
        
        // Clean up test data
        await MongoUser.findByIdAndDelete(testUser._id);
        await MongoAnalytics.findByIdAndDelete(testAnalytics._id);
        console.log('🧹 Test data cleaned up');
        
        console.log('🎉 MongoDB Connection Test PASSED!');
        console.log('📝 Available collections:');
        console.log('   - User (unstructured profiles & preferences)');
        console.log('   - Analytics (learning events & behavior tracking)');
        console.log('   - Progress (detailed educational progress)');
        console.log('   - Post (rich social media metadata)');
        console.log('   - Comment (extended comment analytics)');
        console.log('   - Notification (personalized notifications)');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Test FAILED:', error.message);
        console.error('🔧 Troubleshooting tips:');
        console.error('   1. Check internet connection');
        console.error('   2. Verify MongoDB Atlas cluster is running');
        console.error('   3. Check connection string in .env file');
        console.error('   4. Ensure IP address is whitelisted in MongoDB Atlas');
        process.exit(1);
    }
}

// Run the test
testMongoDB();
