/**
 * Issue State Tracking & Deduplication System
 * Prevents duplicate PRs and tracks issue lifecycle
 */

const crypto = require('crypto');

class IssueStateTracker {
  constructor(databasePath = './issue_tracking.db') {
    this.databasePath = databasePath;
    this.states = {
      NEW: 'new',
      ANALYZED: 'analyzed',
      TICKET_CREATED: 'ticket_created',
      CODE_GENERATED: 'code_generated',
      PR_CREATED: 'pr_created',
      UNDER_REVIEW: 'under_review',
      MERGED: 'merged',
      CLOSED: 'closed',
      DUPLICATE: 'duplicate',
      INVALID: 'invalid',
      ESCALATED: 'escalated'
    };
  }

  /**
   * Generate unique fingerprint for issue deduplication
   */
  generateIssueFingerprint(slackMessage) {
    const normalizedText = this.normalizeText(slackMessage.text);
    const contentHash = this.generateContentHash(normalizedText);
    const userHash = this.simpleHash(slackMessage.user || 'unknown');
    const timeWindow = this.getTimeWindow(slackMessage.ts, 7); // 7-day window
    
    return {
      contentFingerprint: contentHash,
      userFingerprint: userHash,
      timeWindow: timeWindow,
      combinedFingerprint: `${contentHash}_${userHash}_${timeWindow}`,
      originalText: slackMessage.text,
      normalizedText: normalizedText
    };
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/\d+/g, 'NUM')  // Replace numbers with placeholder
      .trim();
  }

  generateContentHash(normalizedText) {
    // Create hash of key words (ignore filler words)
    const keyWords = normalizedText
      .split(' ')
      .filter(word => !this.isFillerWord(word))
      .sort() // Sort for consistent hashing
      .join('_');
    
    return this.simpleHash(keyWords);
  }

  isFillerWord(word) {
    const fillers = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
      'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 
      'have', 'has', 'had', 'will', 'would', 'could', 'should'
    ];
    return fillers.includes(word) || word.length < 3;
  }

  simpleHash(text) {
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
  }

  getTimeWindow(timestamp, days) {
    const date = new Date(timestamp * 1000);
    const windowStart = new Date(date);
    windowStart.setDate(date.getDate() - (date.getDate() % days));
    return windowStart.toISOString().split('T')[0];
  }

  /**
   * Track new issue or find existing
   */
  async trackIssue(slackMessage, classification) {
    const fingerprint = this.generateIssueFingerprint(slackMessage);
    
    console.log('🔍 Checking for existing issue...');
    const existingIssue = await this.findExistingIssue(fingerprint);
    
    if (existingIssue) {
      console.log(`🔄 Found existing issue: ${existingIssue.id}`);
      return await this.handleExistingIssue(existingIssue, slackMessage, classification);
    } else {
      console.log('✨ Creating new issue tracking record');
      return await this.createNewIssueTracking(fingerprint, slackMessage, classification);
    }
  }

  /**
   * Find existing issue using multiple fingerprint strategies
   */
  async findExistingIssue(fingerprint) {
    // In a real implementation, this would query a database
    // For now, we'll simulate with in-memory storage
    const searches = [
      fingerprint.combinedFingerprint,
      fingerprint.contentFingerprint,
      `${fingerprint.contentFingerprint}_${fingerprint.timeWindow}`
    ];

    // Simulate database query
    for (const search of searches) {
      const existing = await this.queryDatabase(`
        SELECT * FROM issue_tracking 
        WHERE fingerprint = ? 
        AND state NOT IN ('merged', 'closed', 'invalid')
        ORDER BY created_at DESC 
        LIMIT 1
      `, [search]);
      
      if (existing) return existing;
    }

    return null;
  }

  /**
   * Handle existing issue based on state and timing
   */
  async handleExistingIssue(existingIssue, newMessage, classification) {
    const timeSinceLastUpdate = Date.now() - existingIssue.last_updated;
    const daysSince = timeSinceLastUpdate / (1000 * 60 * 60 * 24);

    console.log(`📊 Existing issue state: ${existingIssue.state}, days since update: ${daysSince.toFixed(1)}`);

    switch (existingIssue.state) {
      case this.states.PR_CREATED:
      case this.states.UNDER_REVIEW:
        if (daysSince > 3) {
          return await this.sendReminderNotification(existingIssue, newMessage);
        } else {
          return await this.markAsDuplicate(existingIssue, newMessage);
        }

      case this.states.TICKET_CREATED:
        if (daysSince > 1) {
          return await this.escalateStuckIssue(existingIssue, newMessage);
        } else {
          return await this.markAsDuplicate(existingIssue, newMessage);
        }

      case this.states.ANALYZED:
        if (daysSince > 2) {
          return await this.retryProcessing(existingIssue, newMessage);
        } else {
          return await this.markAsDuplicate(existingIssue, newMessage);
        }

      default:
        return await this.markAsDuplicate(existingIssue, newMessage);
    }
  }

  /**
   * Create new issue tracking record
   */
  async createNewIssueTracking(fingerprint, slackMessage, classification) {
    const issueRecord = {
      id: this.generateUniqueId(),
      fingerprint: fingerprint.combinedFingerprint,
      content_fingerprint: fingerprint.contentFingerprint,
      state: this.states.NEW,
      slack_channel: slackMessage.channel,
      slack_ts: slackMessage.ts,
      slack_user: slackMessage.user,
      slack_text: slackMessage.text,
      normalized_text: fingerprint.normalizedText,
      ai_classification: classification.recommendation.action,
      confidence: classification.confidence,
      probabilities: JSON.stringify(classification.probabilities),
      created_at: Date.now(),
      last_updated: Date.now(),
      clickup_id: null,
      clickup_url: null,
      github_pr_url: null,
      escalated_by: null,
      escalated_at: null
    };

    await this.saveIssueRecord(issueRecord);
    
    console.log(`✅ Created issue tracking record: ${issueRecord.id}`);
    return {
      action: 'new_issue_created',
      record: issueRecord,
      shouldProceed: true
    };
  }

  /**
   * Mark as duplicate and notify
   */
  async markAsDuplicate(existingIssue, newMessage) {
    await this.updateIssueState(existingIssue.id, this.states.DUPLICATE);
    
    const duplicateInfo = {
      action: 'duplicate_detected',
      record: existingIssue,
      shouldProceed: false,
      message: `Issue already being tracked!\n\n` +
               `🎫 ClickUp: ${existingIssue.clickup_url || 'Pending'}\n` +
               `📊 Status: ${existingIssue.state}\n` +
               `📅 Originally reported: ${this.formatDate(existingIssue.created_at)}\n\n` +
               `${this.getStatusMessage(existingIssue.state)}`
    };

    console.log('🔄 Marked as duplicate');
    return duplicateInfo;
  }

  /**
   * Send reminder for stuck PR
   */
  async sendReminderNotification(existingIssue, newMessage) {
    const reminderInfo = {
      action: 'reminder_sent',
      record: existingIssue,
      shouldProceed: false,
      message: `⏰ REMINDER: AI-generated PR needs review\n\n` +
               `🔗 PR: ${existingIssue.github_pr_url}\n` +
               `🎫 ClickUp: ${existingIssue.clickup_url}\n` +
               `📅 Created: ${this.formatDate(existingIssue.created_at)}\n` +
               `👤 Additional report from: <@${newMessage.user}>\n\n` +
               `Please review when possible! 🙏`
    };

    console.log('⏰ Sending reminder notification');
    return reminderInfo;
  }

  /**
   * Escalate stuck issue
   */
  async escalateStuckIssue(existingIssue, newMessage) {
    await this.updateIssueState(existingIssue.id, this.states.ESCALATED);
    
    const escalationInfo = {
      action: 'escalated',
      record: existingIssue,
      shouldProceed: false,
      message: `🚨 ESCALATION: Issue stuck for > 24 hours\n\n` +
               `🎫 ClickUp: ${existingIssue.clickup_url}\n` +
               `📊 Current State: ${existingIssue.state}\n` +
               `👥 Multiple reports received\n` +
               `⏱️ Priority updated to URGENT\n\n` +
               `@merekahira Please review! 🆘`
    };

    console.log('🚨 Escalating stuck issue');
    return escalationInfo;
  }

  /**
   * Retry processing stuck issue
   */
  async retryProcessing(existingIssue, newMessage) {
    await this.updateIssueState(existingIssue.id, this.states.NEW);
    
    const retryInfo = {
      action: 'retry_processing',
      record: existingIssue,
      shouldProceed: true,
      message: `🔄 Retrying issue processing\n\n` +
               `Original issue was stuck in analysis. Attempting to process again with new information.`
    };

    console.log('🔄 Retrying processing for stuck issue');
    return retryInfo;
  }

  /**
   * Update issue state
   */
  async updateIssueState(issueId, newState, additionalData = {}) {
    const updateData = {
      state: newState,
      last_updated: Date.now(),
      ...additionalData
    };

    await this.updateIssueRecord(issueId, updateData);
    console.log(`📊 Updated issue ${issueId} to state: ${newState}`);
  }

  /**
   * Get stuck issues for daily check
   */
  async getStuckIssues() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);

    try {
      const results = await this.queryDatabase(`
        SELECT * FROM issue_tracking 
        WHERE (
          (state = 'analyzed' AND created_at < ?) OR
          (state = 'ticket_created' AND created_at < ?) OR
          (state = 'pr_created' AND created_at < ?)
        )
        AND state NOT IN ('merged', 'closed', 'invalid')
      `, [twoDaysAgo, oneDayAgo, threeDaysAgo]);
      
      // Ensure we always return an array, never null
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('⚠️ Error getting stuck issues:', error);
      return []; // Return empty array on error
    }
  }

  // Helper methods
  generateUniqueId() {
    return 'issue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
  }

  getStatusMessage(state) {
    const messages = {
      'analyzed': '🔍 Analysis complete, creating ClickUp ticket...',
      'ticket_created': '🎫 ClickUp ticket created, generating code fix...',
      'code_generated': '💻 Code fix generated, creating GitHub PR...',
      'pr_created': '📝 PR created and waiting for review',
      'under_review': '👀 Currently under team review',
      'escalated': '🚨 Escalated due to delays'
    };
    
    return messages[state] || 'ℹ️ Processing...';
  }

  // Database methods (simulate for now)
  async queryDatabase(query, params) {
    // In real implementation, this would use SQLite or another database
    console.log('🗄️ Database query:', query.replace(/\s+/g, ' ').trim());
    
    // Return empty array instead of null to prevent TypeError
    // This ensures .length and array methods work properly
    return []; // ✅ Safe: Returns empty array instead of null
  }

  async saveIssueRecord(record) {
    // In real implementation, this would save to database
    console.log('💾 Saving issue record to database');
    return true;
  }

  async updateIssueRecord(id, data) {
    // In real implementation, this would update database
    console.log('🔄 Updating issue record in database');
    return true;
  }
}

module.exports = { IssueStateTracker };
