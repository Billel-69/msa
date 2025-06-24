const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_action', 'learning_event', 'social_interaction', 
      'system_event', 'performance_metric', 'engagement_metric',
      'educational_progress', 'game_event', 'custom_event'
    ]
  },
  
  // User context
  user: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    age: Number,
    grade: String,
    mysqlUserId: Number // Reference to MySQL user
  },
  
  // Session information
  session: {
    sessionId: String,
    deviceType: String,
    browser: String,
    os: String,
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  
  // Event details (flexible structure)
  event: {
    action: String, // What action was performed
    target: String, // What was the target of the action
    category: String, // Category of the event
    label: String, // Additional label
    value: Number, // Numeric value if applicable
    duration: Number, // Duration in milliseconds
    
    // Educational specific data
    educational: {
      subject: String,
      topic: String,
      difficulty: String,
      questId: String,
      fragmentsEarned: Number,
      pointsEarned: Number,
      correctAnswers: Number,
      totalQuestions: Number,
      timeSpent: Number,
      hintsUsed: Number,
      attemptsCount: Number
    },
    
    // Social interaction data
    social: {
      interactionType: String, // like, comment, share, follow
      targetUserId: String,
      postId: String,
      contentType: String
    },
    
    // Game/Gamification data
    game: {
      gameType: String,
      level: Number,
      score: Number,
      achievement: String,
      powerUpsUsed: [String],
      gameMode: String
    },
    
    // Performance metrics
    performance: {
      loadTime: Number,
      responseTime: Number,
      errorRate: Number,
      successRate: Number,
      completionRate: Number
    }
  },
  
  // Contextual data
  context: {
    page: String, // Current page/route
    referrer: String, // Previous page
    campaign: String, // Marketing campaign
    source: String, // Traffic source
    medium: String, // Marketing medium
    classroom: String, // Educational context
    assignment: String, // Assignment context
    
    // Custom context fields
    customDimensions: mongoose.Schema.Types.Mixed
  },
  
  // Metadata for the event
  metadata: {
    version: String, // App version
    experiment: String, // A/B test group
    feature: String, // Feature flag
    environment: String, // dev, staging, prod
    
    // Custom metadata
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Aggregation helpers
  aggregation: {
    hourOfDay: Number,
    dayOfWeek: Number,
    weekOfYear: Number,
    monthOfYear: Number,
    quarter: Number,
    isWeekend: Boolean,
    isSchoolHours: Boolean
  },
  
  // Data quality and processing
  processing: {
    processed: { type: Boolean, default: false },
    processedAt: Date,
    quality: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high'
    },
    flags: [String], // Data quality flags
    source: String // How this data was collected
  },
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
  serverTimestamp: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate aggregation fields
analyticsSchema.pre('save', function(next) {
  const date = this.timestamp || new Date();
  
  this.aggregation = {
    hourOfDay: date.getHours(),
    dayOfWeek: date.getDay(),
    weekOfYear: Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)),
    monthOfYear: date.getMonth() + 1,
    quarter: Math.ceil((date.getMonth() + 1) / 3),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
    isSchoolHours: date.getHours() >= 8 && date.getHours() <= 17 && date.getDay() >= 1 && date.getDay() <= 5
  };
  
  next();
});

// Indexes for analytics queries
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ 'user.userId': 1, timestamp: -1 });
analyticsSchema.index({ 'user.role': 1, timestamp: -1 });
analyticsSchema.index({ 'event.educational.subject': 1 });
analyticsSchema.index({ 'context.page': 1 });
analyticsSchema.index({ 'aggregation.dayOfWeek': 1 });
analyticsSchema.index({ 'aggregation.hourOfDay': 1 });
analyticsSchema.index({ 'aggregation.isSchoolHours': 1 });
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ createdAt: -1 });

// Compound indexes for common queries
analyticsSchema.index({ eventType: 1, 'user.role': 1, timestamp: -1 });
analyticsSchema.index({ 'event.educational.subject': 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);