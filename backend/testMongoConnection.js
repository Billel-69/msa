/**
 * MongoDB Atlas Connection Test Script
 * Run this to verify your MongoDB Atlas configuration
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const testMongoConnection = async () => {
    console.log('🧪 Testing MongoDB Atlas Connection...\n');
    
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI not found in .env file');
        console.log('📝 Please add MONGODB_URI to your .env file');
        console.log('📖 See MONGODB_ATLAS_SETUP.md for instructions');
        process.exit(1);
    }
    
    // Mask sensitive information for logging
    const maskedURI = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('🔗 Connection URI (masked):', maskedURI);
    console.log('🎯 Database name: kaizenverse_games\n');
    
    try {        // Attempt connection
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            maxPoolSize: 1, // Use only 1 connection for testing
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('⚡ Ready state:', mongoose.connection.readyState);
          // Test a simple operation
        console.log('\n🔍 Testing database operations...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Available collections:', collections.length);
        
        // Test write operation (create a test document)
        const testCollection = mongoose.connection.db.collection('connection_test');
        const testDoc = {
            test: true,
            timestamp: new Date(),
            message: 'MongoDB Atlas connection successful!'
        };
        
        await testCollection.insertOne(testDoc);
        console.log('✍️ Test write operation: SUCCESS');
        
        // Test read operation
        const retrievedDoc = await testCollection.findOne({ test: true });
        console.log('📖 Test read operation: SUCCESS');
        
        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('🧹 Test cleanup: SUCCESS');
        
        console.log('\n🎉 All tests passed! MongoDB Atlas is working perfectly.');
        
    } catch (error) {
        console.error('\n❌ Connection test failed:');
        console.error('Error:', error.message);
        
        // Provide specific troubleshooting based on error type
        if (error.message.includes('authentication failed')) {
            console.log('\n🔐 Authentication Issue:');
            console.log('   • Check username and password in MONGODB_URI');
            console.log('   • Verify database user exists in Atlas');
            console.log('   • Make sure password doesn\'t contain special characters');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
            console.log('\n🌐 Network Issue:');
            console.log('   • Check internet connection');
            console.log('   • Verify cluster is running in Atlas');
            console.log('   • Check IP whitelist in Network Access');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔌 Connection Issue:');
            console.log('   • Make sure MONGODB_URI points to Atlas (not localhost)');
            console.log('   • Check cluster status in MongoDB Atlas dashboard');
        }
        
        console.log('\n📖 For detailed setup instructions, see: MONGODB_ATLAS_SETUP.md');
        process.exit(1);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔚 Connection closed.');
        process.exit(0);
    }
};

// Run the test
console.log('=' .repeat(60));
console.log('🚀 MongoDB Atlas Connection Test');
console.log('=' .repeat(60));

testMongoConnection().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
