const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Basic post information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: String,
    media: [{
      type: { type: String, enum: ['image', 'video', 'document', 'audio'] },
      url: String,
      filename: String,
      size: Number,
      metadata: mongoose.Schema.Types.Mixed
    }],
    attachments: [mongoose.Schema.Types.Mixed] // For any type of attachment
  },
  
  // Post metadata
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'achievement', 'quest_completion', 'educational'],
    default: 'text'
  },
  
  // Educational context (if applicable)
  educational: {
    subject: String,
    level: String,
    questId: String,
    fragmentsEarned: Number,
    skills: [String],
    curriculum: mongoose.Schema.Types.Mixed
  },
  
  // Engagement metrics
  engagement: {
    likes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }],
    shares: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sharedAt: { type: Date, default: Date.now },
      platform: String
    }],
    views: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now },
      duration: Number // Time spent viewing in seconds
    }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
  },
  
  // Post settings
  settings: {
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private', 'classroom'],
      default: 'public'
    },
    allowComments: { type: Boolean, default: true },
    allowShares: { type: Boolean, default: true },
    moderationRequired: { type: Boolean, default: false }
  },
  
  // Location and context
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    classroom: String,
    event: String
  },
  
  // Tags and categorization
  tags: [String],
  categories: [String],
  hashtags: [String],
  
  // Moderation and safety
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'removed'],
      default: 'approved'
    },
    flags: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      flaggedAt: { type: Date, default: Date.now }
    }],
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    notes: String
  },
  
  // Analytics and insights
  analytics: {
    impressions: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    demographics: mongoose.Schema.Types.Mixed,
    performance: mongoose.Schema.Types.Mixed
  },
  
  // Reference to MySQL post (for hybrid approach)
  mysqlPostId: Number,
  
  // Flexible metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: Date.now },
  editedAt: Date
});

// Update the updatedAt field before saving
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.engagement.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.engagement.comments.length;
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ 'settings.visibility': 1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'educational.subject': 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'engagement.likes.userId': 1 });
postSchema.index({ mysqlPostId: 1 });

module.exports = mongoose.model('Post', postSchema);