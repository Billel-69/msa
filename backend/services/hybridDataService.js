// Hybrid Data Service - Manages both MySQL and MongoDB data
const db = require('../config/db'); // MySQL connection
const MongoUser = require('../models/mongodb/User');
const MongoPost = require('../models/mongodb/Post');
const MongoProgress = require('../models/mongodb/Progress');
const MongoAnalytics = require('../models/mongodb/Analytics');
const MongoNotification = require('../models/mongodb/Notification');

class HybridDataService {
  
  // User Management - Hybrid approach
  async createUserHybrid(userData) {
    try {
      // 1. Create user in MySQL (primary source)
      const [mysqlResult] = await db.execute(
        'INSERT INTO users (username, email, password, role, profile_picture) VALUES (?, ?, ?, ?, ?)',
        [userData.username, userData.email, userData.password, userData.role, userData.profile_picture]
      );
      
      // 2. Create corresponding MongoDB document for unstructured data
      const mongoUser = new MongoUser({
        username: userData.username,
        email: userData.email,
        role: userData.role,
        social: {
          mysqlUserId: mysqlResult.insertId
        },
        profile: {
          bio: userData.bio || '',
          interests: userData.interests || [],
          preferences: {
            theme: userData.theme || 'light',
            language: userData.language || 'fr'
          }
        },
        education: {
          level: userData.educationLevel || '',
          subjects: userData.subjects || [],
          progress: {
            totalPoints: 0,
            currentLevel: 1,
            fragments: 0,
            questsCompleted: 0
          }
        }
      });
      
      await mongoUser.save();
      
      return {
        mysqlId: mysqlResult.insertId,
        mongoId: mongoUser._id,
        user: mongoUser
      };
    } catch (error) {
      console.error('Error creating hybrid user:', error);
      throw error;
    }
  }
  
  // Post Creation - Store basic in MySQL, rich data in MongoDB
  async createPostHybrid(postData) {
    try {
      // 1. Create post in MySQL
      const [mysqlResult] = await db.execute(
        'INSERT INTO posts (user_id, content, image_url, created_at) VALUES (?, ?, ?, NOW())',
        [postData.user_id, postData.content, postData.image_url]
      );
      
      // 2. Create rich MongoDB document
      const mongoPost = new MongoPost({
        author: postData.mongoUserId, // MongoDB user ID
        content: {
          text: postData.content,
          media: postData.media || []
        },
        type: postData.type || 'text',
        educational: postData.educational || {},
        settings: {
          visibility: postData.visibility || 'public',
          allowComments: true,
          allowShares: true
        },
        mysqlPostId: mysqlResult.insertId,
        metadata: postData.metadata || {}
      });
      
      await mongoPost.save();
      
      return {
        mysqlId: mysqlResult.insertId,
        mongoId: mongoPost._id,
        post: mongoPost
      };
    } catch (error) {
      console.error('Error creating hybrid post:', error);
      throw error;
    }
  }
  
  // Progress Tracking - MongoDB for detailed analytics
  async trackLearningProgress(progressData) {
    try {
      const progress = new MongoProgress({
        user: {
          userId: progressData.mongoUserId,
          mysqlUserId: progressData.mysqlUserId
        },
        educational: {
          subject: progressData.subject,
          topic: progressData.topic,
          difficulty: progressData.difficulty
        },
        quest: {
          questId: progressData.questId,
          questTitle: progressData.questTitle,
          questType: progressData.questType
        },
        progress: {
          status: progressData.status,
          completionPercentage: progressData.completionPercentage,
          timeSpent: progressData.timeSpent,
          attempts: progressData.attempts,
          performance: {
            accuracy: progressData.accuracy,
            scores: progressData.scores || []
          }
        },
        gamification: {
          points: progressData.points || 0,
          fragments: progressData.fragments || 0,
          badges: progressData.badges || [],
          achievements: progressData.achievements || []
        }
      });
      
      await progress.save();
      return progress;
    } catch (error) {
      console.error('Error tracking progress:', error);
      throw error;
    }
  }
  
  // Analytics Tracking - MongoDB for flexible event data
  async trackEvent(eventData) {
    try {
      const analytics = new MongoAnalytics({
        eventType: eventData.eventType,
        user: {
          userId: eventData.mongoUserId,
          mysqlUserId: eventData.mysqlUserId,
          role: eventData.userRole,
          age: eventData.userAge
        },
        session: {
          sessionId: eventData.sessionId,
          deviceType: eventData.deviceType,
          browser: eventData.browser,
          os: eventData.os
        },
        event: {
          action: eventData.action,
          target: eventData.target,
          category: eventData.category,
          value: eventData.value,
          duration: eventData.duration,
          educational: eventData.educational || {},
          social: eventData.social || {},
          game: eventData.game || {}
        },
        context: {
          page: eventData.page,
          referrer: eventData.referrer,
          classroom: eventData.classroom
        },
        metadata: eventData.metadata || {}
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }
  
  // Notification System - MongoDB for rich notification data
  async createNotification(notificationData) {
    try {
      const notification = new MongoNotification({
        recipient: {
          userId: notificationData.recipientMongoId,
          mysqlUserId: notificationData.recipientMysqlId,
          role: notificationData.recipientRole
        },
        sender: {
          userId: notificationData.senderMongoId,
          mysqlUserId: notificationData.senderMysqlId,
          type: notificationData.senderType || 'user'
        },
        content: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          actions: notificationData.actions || [],
          style: {
            priority: notificationData.priority || 'normal',
            icon: notificationData.icon,
            color: notificationData.color
          }
        },
        context: notificationData.context || {},
        delivery: {
          channels: notificationData.channels || [{ type: 'in_app', status: 'pending' }],
          scheduledFor: notificationData.scheduledFor || new Date()
        }
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  // Get User Complete Profile (MySQL + MongoDB)
  async getUserCompleteProfile(mysqlUserId) {
    try {
      // Get basic user data from MySQL
      const [mysqlUsers] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [mysqlUserId]
      );
      
      if (mysqlUsers.length === 0) {
        throw new Error('User not found');
      }
      
      const mysqlUser = mysqlUsers[0];
      
      // Get rich profile data from MongoDB
      const mongoUser = await MongoUser.findOne({
        'social.mysqlUserId': mysqlUserId
      });
      
      return {
        basic: mysqlUser,
        extended: mongoUser,
        combined: {
          id: mysqlUser.id,
          username: mysqlUser.username,
          email: mysqlUser.email,
          role: mysqlUser.role,
          profile_picture: mysqlUser.profile_picture,
          created_at: mysqlUser.created_at,
          // Extended MongoDB data
          bio: mongoUser?.profile?.bio,
          interests: mongoUser?.profile?.interests,
          preferences: mongoUser?.profile?.preferences,
          education: mongoUser?.education,
          activity: mongoUser?.activity,
          social: mongoUser?.social
        }
      };
    } catch (error) {
      console.error('Error getting complete user profile:', error);
      throw error;
    }
  }
  
  // Analytics Query Examples
  async getEducationalAnalytics(filters = {}) {
    try {
      const matchConditions = {};
      
      if (filters.subject) {
        matchConditions['event.educational.subject'] = filters.subject;
      }
      
      if (filters.userId) {
        matchConditions['user.userId'] = filters.userId;
      }
      
      if (filters.dateFrom && filters.dateTo) {
        matchConditions.timestamp = {
          $gte: new Date(filters.dateFrom),
          $lte: new Date(filters.dateTo)
        };
      }
      
      const analytics = await MongoAnalytics.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              subject: '$event.educational.subject',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            totalEvents: { $sum: 1 },
            totalTimeSpent: { $sum: '$event.educational.timeSpent' },
            averageAccuracy: { $avg: '$event.educational.correctAnswers' },
            totalPointsEarned: { $sum: '$event.educational.pointsEarned' }
          }
        },
        { $sort: { '_id.date': -1 } }
      ]);
      
      return analytics;
    } catch (error) {
      console.error('Error getting educational analytics:', error);
      throw error;
    }
  }
}

module.exports = new HybridDataService();
