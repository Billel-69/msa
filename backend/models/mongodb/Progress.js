const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  // User identification
  user: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mysqlUserId: Number // Reference to MySQL user for hybrid approach
  },
  
  // Educational context
  educational: {
    subject: { type: String, required: true },
    topic: String,
    subtopic: String,
    curriculum: String,
    gradeLevel: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  
  // Quest/Activity information
  quest: {
    questId: String,
    questTitle: String,
    questType: {
      type: String,
      enum: ['lesson', 'exercise', 'quiz', 'project', 'game', 'assessment']
    },
    category: String,
    tags: [String]
  },
  
  // Progress metrics
  progress: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'mastered', 'needs_review'],
      default: 'not_started'
    },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    timeSpent: { type: Number, default: 0 }, // in minutes
    attempts: { type: Number, default: 0 },
    lastAttempt: Date,
    firstAttempt: Date,
    
    // Performance metrics
    performance: {
      accuracy: Number, // percentage
      speed: Number, // questions per minute or similar
      consistency: Number, // how consistent the performance is
      improvement: Number, // improvement rate over time
      
      // Detailed scores
      scores: [{
        attemptNumber: Number,
        score: Number,
        maxScore: Number,
        percentage: Number,
        timeSpent: Number,
        timestamp: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed
      }]
    }
  },
  
  // Learning analytics
  learning: {
    // Skill mastery tracking
    skills: [{
      skillName: String,
      proficiencyLevel: {
        type: String,
        enum: ['novice', 'developing', 'proficient', 'advanced', 'expert']
      },
      confidence: Number, // 0-100
      lastPracticed: Date,
      practiceCount: Number,
      mistakePatterns: [String]
    }],
    
    // Knowledge graph
    concepts: [{
      conceptId: String,
      conceptName: String,
      understanding: Number, // 0-100
      connections: [String], // related concept IDs
      misconceptions: [String],
      lastReviewed: Date
    }],
    
    // Learning preferences
    preferences: {
      learningStyle: [String], // visual, auditory, kinesthetic, etc.
      preferredDifficulty: String,
      optimalSessionLength: Number, // in minutes
      bestTimeOfDay: String,
      motivationFactors: [String]
    }
  },
  
  // Gamification elements
  gamification: {
    points: { type: Number, default: 0 },
    fragments: { type: Number, default: 0 },
    badges: [{
      badgeId: String,
      badgeName: String,
      earnedAt: { type: Date, default: Date.now },
      category: String,
      rarity: String
    }],
    achievements: [{
      achievementId: String,
      title: String,
      description: String,
      earnedAt: { type: Date, default: Date.now },
      points: Number,
      icon: String
    }],
    streaks: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: Date
    }
  },
  
  // Adaptive learning data
  adaptive: {
    recommendedDifficulty: String,
    nextTopics: [String],
    weakAreas: [String],
    strengthAreas: [String],
    learningPath: [{
      step: Number,
      topic: String,
      estimated_time: Number,
      prerequisites: [String],
      completed: Boolean
    }],
    
    // AI/ML model predictions
    predictions: {
      successProbability: Number,
      timeToMastery: Number, // estimated days
      riskOfDisengagement: Number,
      recommendedInterventions: [String]
    }
  },
  
  // Social learning
  social: {
    collaborations: [{
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      activityType: String,
      startDate: Date,
      endDate: Date,
      outcome: String
    }],
    peerComparisons: {
      percentile: Number,
      averageCompletion: Number,
      relativePerformance: String
    },
    teachingActivities: [{
      helpedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      topic: String,
      helpType: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  // Parent/Teacher insights
  insights: {
    parentNotes: [String],
    teacherNotes: [String],
    recommendations: [String],
    interventions: [{
      type: String,
      description: String,
      implementedAt: Date,
      effectiveness: Number,
      implementedBy: String
    }],
    
    // Automated insights
    automated: {
      patterns: [String],
      alerts: [String],
      suggestions: [String],
      generatedAt: { type: Date, default: Date.now }
    }
  },
  
  // Session tracking
  sessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    activitiesCompleted: Number,
    engagement: Number, // 0-100
    environment: String, // home, school, etc.
    deviceType: String,
    interruptions: Number
  }],
  
  // Metadata and settings
  metadata: {
    version: String,
    source: String, // manual, automated, imported
    reliability: Number, // data quality score
    tags: [String],
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
});

// Update timestamps on save
progressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('progress.status') || this.isModified('progress.completionPercentage')) {
    this.lastActivityAt = Date.now();
  }
  next();
});

// Virtual for overall mastery level
progressSchema.virtual('masteryLevel').get(function() {
  if (this.progress.completionPercentage >= 90 && this.progress.performance.accuracy >= 85) {
    return 'mastered';
  } else if (this.progress.completionPercentage >= 70) {
    return 'proficient';
  } else if (this.progress.completionPercentage >= 40) {
    return 'developing';
  } else {
    return 'beginning';
  }
});

// Indexes for queries
progressSchema.index({ 'user.userId': 1, 'educational.subject': 1 });
progressSchema.index({ 'quest.questId': 1 });
progressSchema.index({ 'progress.status': 1 });
progressSchema.index({ 'educational.subject': 1, updatedAt: -1 });
progressSchema.index({ lastActivityAt: -1 });
progressSchema.index({ 'user.userId': 1, updatedAt: -1 });
progressSchema.index({ 'gamification.points': -1 });

module.exports = mongoose.model('Progress', progressSchema);