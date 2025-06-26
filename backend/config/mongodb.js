const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaizenverse_games';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      maxIdleTimeMS: 30000 // Close connections after 30 seconds of inactivity
    });
    
    console.log('✅ MongoDB connected successfully to Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed (continuing without MongoDB):', error.message);
    console.error('🔍 Check your MONGODB_URI in .env file');
    console.error('🌐 Make sure your MongoDB Atlas cluster is running and accessible');
    // Don't exit - continue without MongoDB for now
  }
};

module.exports = connectMongoDB;
