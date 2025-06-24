const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Basic comment information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Target information (what is being commented on)
  target: {
    type: {
      type: String,
      enum: ['post', 'comment', 'quest', 'achievement', 'user_profile', 'educational_content'],
      required: true
    },
    id: { type: String, required: true }, // ID of the target (could be MongoDB ObjectId or MySQL ID)
    mysqlId: Number, // For hybrid approach when targeting MySQL entities
    
    // Additional context about the target
    context: {
      subject: String, // if educational content
      difficulty: String,
      topic: String,
      metadata: mongoose.Schema.Types.Mixed
    }
  },
  
  // Comment content
  content: {
    text: { type: String, required: true, maxlength: 2000 },
    
    // Rich content support
    media: [{
      type: { type: String, enum: ['image', 'video', 'audio', 'document', 'link'] },
      url: String,
      filename: String,
      caption: String,
      thumbnail: String,
      duration: Number, // for video/audio
      size: Number,
      metadata: mongoose.Schema.Types.Mixed
    }],
    
    // Formatted content
    formatted: {
      html: String, // HTML version of the comment
      markdown: String, // Markdown version
      mentions: [{ // @username mentions
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        startIndex: Number,
        endIndex: Number
      }],
      hashtags: [String], // #hashtags found in the comment
      links: [{ // URLs found in the comment
        url: String,
        title: String,
        description: String,
        image: String,
        domain: String
      }]
    }
  },
  
  // Threading and hierarchy
  threading: {
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    rootComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    level: { type: Number, default: 0 }, // 0 = top level, 1 = reply, 2 = reply to reply, etc.
    path: String, // Materialized path for efficient tree queries (e.g., "1.2.3")
    
    // Thread metadata
    threadStats: {
      totalReplies: { type: Number, default: 0 },
      maxDepth: { type: Number, default: 0 },
      lastReplyAt: Date
    }
  },
  
  // Engagement and interactions
  engagement: {
    likes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now },
      type: { type: String, enum: ['like', 'love', 'helpful', 'insightful'], default: 'like' }
    }],
    
    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: String,
      reactedAt: { type: Date, default: Date.now }
    }],
    
    // Educational specific engagement
    educational: {
      helpful: { type: Number, default: 0 }, // "This helped me" count
      accuracy: { type: Number, default: 0 }, // Teacher/peer verification of accuracy
      difficulty: { type: Number, default: 0 }, // User-reported difficulty of understanding
      clarity: { type: Number, default: 0 } // How clear/well-explained the comment is
    },
    
    // Social engagement
    shares: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      platform: String,
      sharedAt: { type: Date, default: Date.now }
    }],
    
    bookmarks: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      bookmarkedAt: { type: Date, default: Date.now },
      note: String
    }]
  },
  
  // Educational value and categorization
  educational: {
    type: {
      type: String,
      enum: ['question', 'answer', 'explanation', 'clarification', 'example', 'correction', 'encouragement', 'feedback'],
      default: 'question'
    },
    
    // Knowledge and skill tags
    skills: [String], // Skills this comment relates to
    concepts: [String], // Educational concepts discussed
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    
    // Quality indicators
    quality: {
      accuracy: Number, // 0-100, teacher/AI verified
      helpfulness: Number, // 0-100, peer rated
      clarity: Number, // 0-100, readability score
      depth: Number, // 0-100, thoroughness of explanation
      creativity: Number // 0-100, originality of approach
    },
    
    // Learning context
    context: {
      subject: String,
      topic: String,
      lessonId: String,
      questId: String,
      assignmentId: String
    }
  },
  
  // Moderation and safety
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'hidden', 'removed'],
      default: 'approved'
    },
    
    flags: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: {
        type: String,
        enum: ['spam', 'inappropriate', 'off_topic', 'incorrect', 'bullying', 'other']
      },
      description: String,
      flaggedAt: { type: Date, default: Date.now },
      resolved: Boolean,
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // Automated moderation
    automated: {
      toxicityScore: Number, // 0-100
      spamScore: Number, // 0-100
      sentimentScore: Number, // -100 to 100
      languageConfidence: Number, // 0-100
      topics: [String], // AI-detected topics
      
      // Content analysis
      wordCount: Number,
      readingLevel: String,
      complexity: Number,
      professionalismScore: Number
    },
    
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    moderationNotes: String
  },
  
  // Privacy and visibility
  visibility: {
    scope: {
      type: String,
      enum: ['public', 'followers', 'mentioned_users', 'private', 'classroom', 'teacher_only'],
      default: 'public'
    },
    classroomId: String, // If limited to a specific classroom
    groups: [String], // Specific user groups that can see this
    hiddenFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Users who can't see this comment
  },
  
  // AI and analytics
  ai: {
    // AI analysis
    analysis: {
      sentiment: String, // positive, negative, neutral
      intent: String, // question, answer, discussion, etc.
      topics: [String],
      entities: [String],
      keyPhrases: [String],
      language: String,
      translation: mongoose.Schema.Types.Mixed // Translations to other languages
    },
    
    // AI-generated suggestions
    suggestions: {
      improvements: [String],
      relatedContent: [String],
      followUpQuestions: [String],
      resources: [String]
    },
    
    // AI confidence scores
    confidence: {
      contentQuality: Number,
      educationalValue: Number,
      appropriateness: Number,
      factualAccuracy: Number
    }
  },
  
  // Notifications and alerts
  notifications: {
    mentionedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subscribedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users following this comment thread
    parentAuthorNotified: Boolean, // Whether parent comment author was notified
    targetAuthorNotified: Boolean // Whether target post/content author was notified
  },
  
  // Version control and editing
  versioning: {
    editHistory: [{
      content: String,
      editedAt: { type: Date, default: Date.now },
      editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      editReason: String
    }],
    lastEditedAt: Date,
    editCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false }
  },
  
  // Metadata and tracking
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'api', 'import'],
      default: 'web'
    },
    device: String,
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    
    // Custom metadata
    custom: mongoose.Schema.Types.Mixed,
    tags: [String],
    
    // Integration data
    integration: {
      externalId: String,
      externalSource: String,
      syncedAt: Date
    }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Soft delete
  deleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update thread statistics if this is a reply
  if (this.threading.parentComment && this.isNew) {
    this.threading.level = (this.threading.level || 0) + 1;
  }
  
  // Generate materialized path
  if (this.threading.parentComment && !this.threading.path) {
    // This would need to be implemented based on parent's path
    // For now, just use the comment ID
    this.threading.path = this._id.toString();
  }
  
  next();
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.engagement.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.threading.threadStats.totalReplies;
});

// Indexes for performance
commentSchema.index({ 'target.type': 1, 'target.id': 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ 'threading.parentComment': 1 });
commentSchema.index({ 'threading.rootComment': 1 });
commentSchema.index({ 'threading.path': 1 });
commentSchema.index({ 'moderation.status': 1 });
commentSchema.index({ 'educational.type': 1 });
commentSchema.index({ 'educational.subject': 1 });
commentSchema.index({ 'engagement.likes.userId': 1 });
commentSchema.index({ deleted: 1, createdAt: -1 });

// Compound indexes for common queries
commentSchema.index({ 
  'target.type': 1, 
  'target.id': 1, 
  'moderation.status': 1, 
  createdAt: -1 
});
commentSchema.index({ 
  author: 1, 
  'educational.subject': 1, 
  createdAt: -1 
});

module.exports = mongoose.model('Comment', commentSchema);