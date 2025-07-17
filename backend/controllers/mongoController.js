const HybridDataService = require('../services/hybridDataService');
const MongoUser = require('../models/mongodb/User');
const MongoAnalytics = require('../models/mongodb/Analytics');

class MongoController {
  
  // Get user's detailed analytics
  async getUserAnalytics(req, res) {
    try {
      const { userId } = req.params;
      const { subject, dateFrom, dateTo } = req.query;
      
      const analytics = await HybridDataService.getEducationalAnalytics({
        userId,
        subject,
        dateFrom,
        dateTo
      });
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving analytics',
        error: error.message
      });
    }
  }
  
  // Track learning event
  async trackLearningEvent(req, res) {
    try {
      const {
        mongoUserId,
        mysqlUserId,
        eventType,
        action,
        educational,
        session,
        context
      } = req.body;
      
      const event = await HybridDataService.trackEvent({
        eventType: eventType || 'learning_event',
        mongoUserId,
        mysqlUserId,
        userRole: req.user?.role,
        action,
        target: educational?.questId || educational?.topic,
        category: 'education',
        educational,
        sessionId: session?.sessionId,
        deviceType: session?.deviceType,
        browser: session?.browser,
        page: context?.page,
        classroom: context?.classroom,
        metadata: req.body.metadata
      });
      
      res.json({
        success: true,
        message: 'Learning event tracked successfully',
        eventId: event._id
      });
    } catch (error) {
      console.error('Error tracking learning event:', error);
      res.status(500).json({
        success: false,
        message: 'Error tracking event',
        error: error.message
      });
    }
  }
  
  // Update user progress
  async updateProgress(req, res) {
    try {
      const { userId } = req.params;
      const progressData = req.body;
      
      // Find MongoDB user
      const mongoUser = await MongoUser.findById(userId);
      if (!mongoUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const progress = await HybridDataService.trackLearningProgress({
        mongoUserId: userId,
        mysqlUserId: mongoUser.social.mysqlUserId,
        ...progressData
      });
      
      res.json({
        success: true,
        message: 'Progress updated successfully',
        progress
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating progress',
        error: error.message
      });
    }
  }
  
  // Get user's complete profile (MySQL + MongoDB)
  async getCompleteProfile(req, res) {
    try {
      const { mysqlUserId } = req.params;
      
      const profile = await HybridDataService.getUserCompleteProfile(mysqlUserId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error getting complete profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving profile',
        error: error.message
      });
    }
  }
  
  // Get learning insights
  async getLearningInsights(req, res) {
    try {
      const { userId } = req.params;
      const { timeframe = '30' } = req.query; // days
      
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - parseInt(timeframe));
      
      // Get learning analytics
      const analytics = await MongoAnalytics.aggregate([
        {
          $match: {
            'user.userId': userId,
            eventType: 'learning_event',
            timestamp: { $gte: dateFrom }
          }
        },
        {
          $group: {
            _id: '$event.educational.subject',
            totalTime: { $sum: '$event.educational.timeSpent' },
            totalEvents: { $sum: 1 },
            averageAccuracy: { $avg: '$event.educational.correctAnswers' },
            totalPoints: { $sum: '$event.educational.pointsEarned' },
            topicsStudied: { $addToSet: '$event.educational.topic' }
          }
        },
        {
          $project: {
            subject: '$_id',
            totalTime: 1,
            totalEvents: 1,
            averageAccuracy: { $round: ['$averageAccuracy', 2] },
            totalPoints: 1,
            topicsCount: { $size: '$topicsStudied' },
            topicsStudied: { $slice: ['$topicsStudied', 5] }
          }
        },
        { $sort: { totalTime: -1 } }
      ]);
      
      // Get recent achievements
      const recentAchievements = await MongoAnalytics.find({
        'user.userId': userId,
        eventType: 'learning_event',
        'event.educational.fragmentsEarned': { $gt: 0 },
        timestamp: { $gte: dateFrom }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('event.educational timestamp');
      
      res.json({
        success: true,
        data: {
          timeframe: `${timeframe} days`,
          subjects: analytics,
          recentAchievements,
          summary: {
            totalSubjects: analytics.length,
            totalTimeSpent: analytics.reduce((sum, s) => sum + s.totalTime, 0),
            totalPoints: analytics.reduce((sum, s) => sum + s.totalPoints, 0),
            averageAccuracy: analytics.length > 0 
              ? analytics.reduce((sum, s) => sum + s.averageAccuracy, 0) / analytics.length 
              : 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting learning insights:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving learning insights',
        error: error.message
      });
    }
  }
  
  // Test MongoDB connection
  async testConnection(req, res) {
    try {
      // Simple test to verify MongoDB is working
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'MongoDB connection test successful'
      };
      
      const analytics = new MongoAnalytics({
        eventType: 'system_event',
        user: {
          userId: null,
          role: 'system'
        },
        event: {
          action: 'connection_test',
          target: 'mongodb',
          category: 'system'
        },
        metadata: testDoc
      });
      
      await analytics.save();
      
      res.json({
        success: true,
        message: 'MongoDB connection is working!',
        testEventId: analytics._id,
        timestamp: analytics.timestamp
      });
    } catch (error) {
      console.error('MongoDB connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'MongoDB connection failed',
        error: error.message
      });
    }
  }
}

module.exports = new MongoController();
