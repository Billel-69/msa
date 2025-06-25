const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['parent', 'child', 'teacher'],
    required: true
  },
  
  // Unstructured profile data
  profile: {
    bio: String,
    interests: [String],
    preferences: {
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'fr' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true }
      }
    },
    customFields: mongoose.Schema.Types.Mixed // For any additional unstructured data
  },
  
  // Educational data (flexible structure)
  education: {
    level: String,
    subjects: [String],
    achievements: [{
      title: String,
      description: String,
      earnedAt: { type: Date, default: Date.now },
      metadata: mongoose.Schema.Types.Mixed
    }],
    progress: {
      totalPoints: { type: Number, default: 0 },
      currentLevel: { type: Number, default: 1 },
      fragments: { type: Number, default: 0 },
      questsCompleted: { type: Number, default: 0 },
      customMetrics: mongoose.Schema.Types.Mixed
    }
  },
  
  // Activity tracking
  activity: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // in minutes
    sessions: [{
      startTime: Date,
      endTime: Date,
      duration: Number,
      activities: [String]
    }]
  },
  
  // Social connections (references to MySQL IDs for hybrid approach)
  social: {
    mysqlUserId: Number, // Reference to MySQL user table
    followers: [String], // MongoDB user IDs
    following: [String], // MongoDB user IDs
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  },
  
  // Parent-child relationships for complex family structures
  relationships: {
    parentIds: [String], // MongoDB parent user IDs
    childIds: [String],  // MongoDB child user IDs
    teacherIds: [String], // MongoDB teacher user IDs
    classrooms: [String] // Classroom/group identifiers
  },
  
  // Settings and configurations
  settings: {
    privacy: {
      profileVisible: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true },
      allowFollows: { type: Boolean, default: true }
    },
    parental: {
      timeLimit: Number, // Daily time limit in minutes
      allowedContent: [String],
      blockedContent: [String],
      supervisionLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    }
  },
  
  // Flexible metadata for future features
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ 'social.mysqlUserId': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);