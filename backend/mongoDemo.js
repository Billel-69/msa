// MongoDB Usage Examples for MSA Project
// This script demonstrates how to use the MongoDB integration for unstructured data

const HybridDataService = require('./services/hybridDataService');
const MongoUser = require('./models/mongodb/User');
const MongoAnalytics = require('./models/mongodb/Analytics');
const MongoProgress = require('./models/mongodb/Progress');

async function demonstrateMongoDB() {
    console.log('📚 MSA MongoDB Usage Examples\n');

    try {
        // 1. Track a learning event
        console.log('1️⃣ Tracking a Learning Event:');
        const learningEvent = await MongoAnalytics.create({
            eventType: 'learning_event',
            user: {
                userId: 'sample_user_id',
                role: 'child',
                age: 8,
                grade: 'CE2',
                mysqlUserId: 123
            },
            session: {
                sessionId: 'session_' + Date.now(),
                deviceType: 'tablet',
                browser: 'safari',
                os: 'ios'
            },
            event: {
                action: 'quest_completed',
                target: 'math_quest_addition',
                category: 'education',
                label: 'mathematics',
                value: 75,
                duration: 180000, // 3 minutes
                educational: {
                    subject: 'mathematics',
                    topic: 'addition',
                    difficulty: 'beginner',
                    score: 85,
                    attempts: 1,
                    timeSpent: 180,
                    hintsUsed: 2,
                    mistakes: 1
                }
            },
            context: {
                questId: 'math_addition_001',
                worldId: 'math_world',
                levelId: 'level_1',
                achievements: ['first_quest', 'quick_learner'],
                metadata: {
                    parentWatching: true,
                    backgroundMusic: true,
                    difficulty_adjusted: false
                }
            }
        });
        console.log('✅ Learning event tracked:', learningEvent._id);

        // 2. Update user progress in MongoDB
        console.log('\n2️⃣ Updating User Progress:');
        const progressUpdate = await MongoProgress.create({
            user: {
                userId: 'sample_user_id',
                mysqlUserId: 123,
                role: 'child'
            },
            academic: {
                subjects: {
                    mathematics: {
                        level: 2,
                        totalPoints: 250,
                        skillsProgress: {
                            addition: { level: 3, mastery: 0.85 },
                            subtraction: { level: 2, mastery: 0.72 },
                            multiplication: { level: 1, mastery: 0.45 }
                        },
                        recentActivities: [
                            {
                                activityType: 'quest',
                                activityId: 'math_addition_001',
                                completedAt: new Date(),
                                score: 85,
                                timeSpent: 180
                            }
                        ]
                    }
                },
                overallProgress: {
                    totalQuestsCompleted: 15,
                    totalTimeSpent: 3600, // 1 hour
                    averageScore: 78,
                    streakDays: 5,
                    fragments: 25,
                    achievements: ['dedicated_learner', 'math_enthusiast']
                }
            },
            behavioral: {
                learningStyle: 'visual',
                preferredDifficulty: 'moderate',
                engagementPatterns: {
                    bestTimeOfDay: 'morning',
                    averageSessionLength: 20,
                    preferredSubjects: ['mathematics', 'science']
                }
            }
        });
        console.log('✅ Progress updated:', progressUpdate._id);

        // 3. Create extended user profile
        console.log('\n3️⃣ Creating Extended User Profile:');
        const extendedProfile = await MongoUser.create({
            username: 'sample_student',
            email: 'student@example.com',
            role: 'child',
            social: {
                mysqlUserId: 123,
                followers: [],
                following: [],
                posts: [],
                socialScore: 45
            },
            profile: {
                bio: 'Young explorer learning mathematics and science!',
                interests: ['mathematics', 'space', 'animals', 'drawing'],
                preferences: {
                    theme: 'space',
                    language: 'fr',
                    notifications: {
                        email: false,
                        push: true,
                        inApp: true
                    },
                    accessibility: {
                        fontSize: 'large',
                        highContrast: false,
                        audioHelp: true
                    }
                },
                customFields: {
                    favoriteCharacter: 'space_explorer',
                    preferredAvatar: 'astronaut',
                    parentalSettings: {
                        maxDailyTime: 60, // minutes
                        allowedWorlds: ['math_world', 'science_world'],
                        contentFilter: 'child_safe'
                    }
                }
            },
            education: {
                level: 'elementary',
                grade: 'CE2',
                school: 'École Primaire Example',
                subjects: ['mathematics', 'french', 'science', 'art'],
                specialNeeds: [],
                learningGoals: [
                    'Master basic addition and subtraction',
                    'Improve reading comprehension',
                    'Learn about solar system'
                ]
            }
        });
        console.log('✅ Extended profile created:', extendedProfile._id);

        // 4. Demonstrate analytics queries
        console.log('\n4️⃣ Running Analytics Queries:');
        
        // Get learning analytics for a subject
        const mathAnalytics = await MongoAnalytics.find({
            'event.educational.subject': 'mathematics',
            'user.role': 'child'
        }).limit(5);
        console.log(`📊 Found ${mathAnalytics.length} math learning events`);

        // Get users by learning style
        const visualLearners = await MongoProgress.find({
            'behavioral.learningStyle': 'visual'
        }).limit(3);
        console.log(`👀 Found ${visualLearners.length} visual learners`);

        // Clean up demo data
        console.log('\n🧹 Cleaning up demo data...');
        await MongoAnalytics.findByIdAndDelete(learningEvent._id);
        await MongoProgress.findByIdAndDelete(progressUpdate._id);
        await MongoUser.findByIdAndDelete(extendedProfile._id);

        console.log('\n🎉 MongoDB Demo Complete!');
        console.log('\n📝 Key Benefits of MongoDB Integration:');
        console.log('   ✅ Flexible schema for evolving educational features');
        console.log('   ✅ Rich analytics and behavioral insights');
        console.log('   ✅ Personalized learning recommendations');
        console.log('   ✅ Scalable unstructured data storage');
        console.log('   ✅ Future-ready for AI/ML integration');

    } catch (error) {
        console.error('❌ MongoDB Demo Error:', error.message);
    }
}

// Export for use in other files
module.exports = {
    demonstrateMongoDB,
    
    // Helper functions for common MongoDB operations
    trackLearningEvent: async (eventData) => {
        return await MongoAnalytics.create(eventData);
    },
    
    updateUserProgress: async (progressData) => {
        return await MongoProgress.create(progressData);
    },
    
    getAnalytics: async (userId, filters = {}) => {
        return await MongoAnalytics.find({
            'user.mysqlUserId': userId,
            ...filters
        });
    },
    
    getUserInsights: async (userId) => {
        return await MongoProgress.findOne({
            'user.mysqlUserId': userId
        });
    }
};

// Run demo if called directly
if (require.main === module) {
    const connectMongoDB = require('./config/mongodb');
    connectMongoDB().then(demonstrateMongoDB);
}
