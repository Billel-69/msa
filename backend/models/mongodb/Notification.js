const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipient: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mysqlUserId: Number, // Reference to MySQL user for hybrid approach
    role: String, // parent, child, teacher
    preferences: {
      channels: [String], // email, push, in-app, sms
      frequency: String, // immediate, daily, weekly
      categories: [String] // which types of notifications to receive
    }
  },
  
  // Sender information (if applicable)
  sender: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mysqlUserId: Number,
    type: {
      type: String,
      enum: ['user', 'system', 'automated', 'ai'],
      default: 'system'
    }
  },
  
  // Notification content
  content: {
    type: {
      type: String,
      required: true,
      enum: [
        'achievement', 'progress_update', 'social_interaction', 'message',
        'quest_completion', 'new_content', 'reminder', 'alert',
        'parent_notification', 'teacher_notification', 'system_update',
        'friend_request', 'assignment', 'deadline', 'celebration',
        'recommendation', 'warning', 'maintenance', 'custom'
      ]
    },
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    summary: String, // Short summary for mobile/email
    
    // Rich content
    media: [{
      type: String, // image, video, gif
      url: String,
      thumbnail: String,
      alt: String
    }],
    
    // Call-to-action
    actions: [{
      label: String,
      action: String, // navigate, api_call, external_link
      url: String,
      data: mongoose.Schema.Types.Mixed,
      primary: Boolean
    }],
    
    // Formatting and styling
    style: {
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
      },
      color: String,
      icon: String,
      badge: String,
      sound: String
    }
  },
  
  // Contextual information
  context: {
    // Educational context
    educational: {
      subject: String,
      questId: String,
      achievementId: String,
      progressId: String,
      classroomId: String,
      assignmentId: String
    },
    
    // Social context
    social: {
      postId: String,
      commentId: String,
      conversationId: String,
      eventId: String
    },
    
    // System context
    system: {
      featureId: String,
      campaignId: String,
      experimentId: String,
      version: String
    },
    
    // Custom context
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Delivery settings
  delivery: {
    channels: [{
      type: {
        type: String,
        enum: ['in_app', 'push', 'email', 'sms', 'webhook'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
        default: 'pending'
      },
      sentAt: Date,
      deliveredAt: Date,
      failureReason: String,
      retryCount: { type: Number, default: 0 },
      metadata: mongoose.Schema.Types.Mixed
    }],
    
    // Scheduling
    scheduledFor: Date,
    timezone: String,
    
    // Targeting
    targeting: {
      deviceTypes: [String],
      locations: [String],
      timeWindows: [{
        start: String, // HH:MM
        end: String,   // HH:MM
        days: [Number] // 0-6 (Sunday-Saturday)
      }]
    }
  },
  
  // User interaction
  interaction: {
    status: {
      type: String,
      enum: ['unread', 'read', 'dismissed', 'archived', 'starred'],
      default: 'unread'
    },
    readAt: Date,
    dismissedAt: Date,
    archivedAt: Date,
    starredAt: Date,
    
    // Actions taken
    actionsPerformed: [{
      actionId: String,
      performedAt: { type: Date, default: Date.now },
      result: String,
      metadata: mongoose.Schema.Types.Mixed
    }],
    
    // Engagement metrics
    engagement: {
      openCount: { type: Number, default: 0 },
      clickCount: { type: Number, default: 0 },
      timeSpent: Number, // seconds
      shareCount: { type: Number, default: 0 }
    }
  },
  
  // Personalization data
  personalization: {
    relevanceScore: Number, // 0-100
    urgencyScore: Number,   // 0-100
    engagementPrediction: Number, // predicted engagement probability
    
    // A/B testing
    variant: String,
    experimentGroup: String,
    
    // AI-generated insights
    aiInsights: {
      sentimentScore: Number,
      topics: [String],
      entities: [String],
      intent: String
    }
  },
  
  // Automation and rules
  automation: {
    ruleId: String,
    triggerId: String,
    workflowId: String,
    templateId: String,
    
    // Conditional logic
    conditions: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }],
    
    // Follow-up actions
    followUps: [{
      delay: Number, // minutes
      action: String,
      condition: mongoose.Schema.Types.Mixed,
      executed: Boolean,
      executedAt: Date
    }]
  },
  
  // Analytics and tracking
  analytics: {
    campaign: String,
    source: String,
    medium: String,
    
    // Attribution
    attribution: {
      touchpoint: String,
      journey: String,
      previousNotifications: [String]
    },
    
    // Performance metrics
    metrics: {
      deliveryRate: Number,
      openRate: Number,
      clickRate: Number,
      conversionRate: Number
    }
  },
  
  // Data management
  metadata: {
    version: String,
    source: String, // manual, automated, imported, ai_generated
    tags: [String],
    categories: [String],
    
    // Compliance and privacy
    gdprConsent: Boolean,
    dataRetention: {
      deleteAfter: Date,
      category: String
    },
    
    // Custom metadata
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: Date, // Auto-delete after this date
  
  // Soft delete
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

// Update timestamps on save
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// TTL index for auto-deletion
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for queries
notificationSchema.index({ 'recipient.userId': 1, createdAt: -1 });
notificationSchema.index({ 'recipient.userId': 1, 'interaction.status': 1 });
notificationSchema.index({ 'content.type': 1, createdAt: -1 });
notificationSchema.index({ 'delivery.scheduledFor': 1 });
notificationSchema.index({ 'delivery.channels.status': 1 });
notificationSchema.index({ 'interaction.status': 1, createdAt: -1 });
notificationSchema.index({ 'automation.ruleId': 1 });
notificationSchema.index({ deleted: 1, createdAt: -1 });

// Compound indexes
notificationSchema.index({ 
  'recipient.userId': 1, 
  'interaction.status': 1, 
  'content.style.priority': -1, 
  createdAt: -1 
});

module.exports = mongoose.model('Notification', notificationSchema);