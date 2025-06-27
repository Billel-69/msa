const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
// Using path.resolve to ensure we find the .env file regardless of where the script is run from
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate MongoDB connection string
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is not defined!');
  console.error('Please check your .env file in the backend directory.');
  process.exit(1);
}

// Import Game model
const Game = require('../models/mongodb/Game');

// Sample game data
// Sample game data with actual content
const gameData = [
  {
    name: 'Quiz de Mathématiques',
    description: 'Teste tes connaissances en mathématiques avec des questions variées et amusantes',
    type: 'quiz',
    difficulty: 'facile',
    subject: 'mathématiques',
    imageUrl: '/assets/games/math-quiz.png',
    xpReward: 20,
    fragmentsReward: 2,
    questions: [
      {
        question: 'Combien font 5 × 8 ?',
        options: ['35', '40', '45', '50'],
        correctAnswer: '40',
        explanation: '5 × 8 = 40'
      },
      {
        question: 'Quel est le résultat de 12 + 9 ?',
        options: ['19', '21', '23', '25'],
        correctAnswer: '21',
        explanation: '12 + 9 = 21'
      },
      {
        question: 'Quelle est la moitié de 36 ?',
        options: ['12', '16', '18', '24'],
        correctAnswer: '18',
        explanation: 'La moitié de 36 est 36 ÷ 2 = 18'
      },
      {
        question: 'Combien font 7 × 6 ?',
        options: ['36', '42', '48', '54'],
        correctAnswer: '42',
        explanation: '7 × 6 = 42'
      },
      {
        question: 'Quel nombre vient après 39 ?',
        options: ['38', '40', '49', '50'],
        correctAnswer: '40',
        explanation: 'Le nombre qui suit 39 est 40'
      }
    ],
    status: 'active'
  },
  {
    name: 'Memory des Mots',
    description: 'Améliore ton vocabulaire en français en associant des mots à leur définition',
    type: 'memory',
    difficulty: 'moyen',
    subject: 'français',
    imageUrl: '/assets/games/language-memory.png',
    xpReward: 15,
    fragmentsReward: 1,
    memoryPairs: [
      { word: 'heureux', match: 'content', id: 1 },
      { word: 'rapide', match: 'véloce', id: 2 },
      { word: 'maison', match: 'demeure', id: 3 },
      { word: 'beau', match: 'joli', id: 4 },
      { word: 'intelligent', match: 'brillant', id: 5 },
      { word: 'petit', match: 'minuscule', id: 6 },
      { word: 'parler', match: 'discuter', id: 7 },
      { word: 'voir', match: 'apercevoir', id: 8 }
    ],
    status: 'active'
  },
  {
    name: 'Puzzle Historique',
    description: 'Reconstitue des événements historiques importants dans le bon ordre chronologique',
    type: 'puzzle',
    difficulty: 'difficile',
    subject: 'histoire',
    imageUrl: '/assets/games/history-puzzle.png',
    xpReward: 25,
    fragmentsReward: 3,
    puzzleData: {
      title: 'Révolution Française',
      description: 'Remets les événements de la Révolution Française dans le bon ordre chronologique',
      events: [
        { 
          id: 1, 
          text: 'Prise de la Bastille', 
          date: '14 juillet 1789',
          correctPosition: 1
        },
        { 
          id: 2, 
          text: 'Déclaration des droits de l\'homme et du citoyen', 
          date: '26 août 1789',
          correctPosition: 2
        },
        { 
          id: 3, 
          text: 'Abolition des privilèges', 
          date: '4 août 1789',
          correctPosition: 3
        },
        { 
          id: 4, 
          text: 'Exécution du roi Louis XVI', 
          date: '21 janvier 1793',
          correctPosition: 4
        },
        { 
          id: 5, 
          text: 'Début de la Terreur', 
          date: 'septembre 1793',
          correctPosition: 5
        }
      ]
    },
    status: 'active'
  }
];

// Function to seed games
async function seedGames() {
  try {
    console.log('🔄 Starting game seeding process...');
    
    // Connect directly to MongoDB Atlas
    console.log('🔌 Connecting to MongoDB Atlas...');
    const mongoURI = process.env.MONGODB_URI;
    console.log('MongoDB URI (masked):', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // Check if games already exist
    const existingCount = await Game.countDocuments({});
    console.log(`🔍 Found ${existingCount} existing games in database`);
    
    if (existingCount > 0) {
      console.log('⚠️ Removing existing games...');
      const deleteResult = await Game.deleteMany({});
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing games`);
    }
    
    // Insert new games
    console.log(`📝 Inserting ${gameData.length} games...`);
    const insertedGames = await Game.insertMany(gameData);
    
    console.log('✅ Games seeded successfully!');
    console.log('📋 Games added:');
    
    insertedGames.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (${game.type} - ${game.subject})`);
    });
    
    // Final verification
    const finalCount = await Game.countDocuments({});
    console.log(`📊 Database now contains ${finalCount} games`);
    
  } catch (error) {
    console.error('❌ Error during seeding process:');
    console.error(error);
    process.exit(1);
  } finally {
    // Always close the connection when done
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed');
    }
    console.log('✅ Seeding process complete!');
  }
}

// Execute the seed function
seedGames();