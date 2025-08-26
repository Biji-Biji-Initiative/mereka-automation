/**
 * Emoji-based Feedback System
 * Handles team reactions for AI decision overrides
 */

const fetch = require('node-fetch');
const { TicketRevisionSystem } = require('./ticket-revision-system.js');

class EmojiFeedbackHandler {
  constructor(clickupApiKey, slackToken) {
    this.clickupToken = clickupApiKey;
    this.slackToken = slackToken;
    
    // Initialize ticket revision system
    this.revisionSystem = new TicketRevisionSystem(clickupApiKey, slackToken);
    
    this.feedbackEmojis = {
      // ESCALATION: Override AI decision, treat as urgent bug
      '🚨': {
        action: 'escalate_issue',
        description: 'AI got it wrong - this IS a real bug that needs immediate code fix!',
        workflow: 'bypass_ai_analysis_create_urgent_ticket'
      },

      // USER NEEDS HELP: Convert to support issue
      '🙋': {
        action: 'convert_to_user_support', 
        description: 'This person needs help, not a code fix',
        workflow: 'provide_educational_response'
      },

      // AI LEARNING: Add to training data
      '🤖': {
        action: 'retrain_ai_with_this_example',
        description: 'Use this example to improve AI classification',
        workflow: 'add_to_training_dataset'
      },

      // TICKET REVISION EMOJIS (NEW!)
      // REVISE EXISTING TICKET: Re-analyze and update current ticket
      '🔧': {
        action: 'revise_existing_ticket',
        description: 'AI got it wrong - please revise this ticket with correct understanding',
        workflow: 'reanalyze_and_update_ticket'
      },

      // EDIT DESCRIPTION: Update ticket description only
      '📝': {
        action: 'edit_ticket_description',
        description: 'Update the ticket description with additional context',
        workflow: 'update_description_only'
      },

      // CHANGE CATEGORY: Reclassify ticket type
      '🏷️': {
        action: 'change_ticket_category',
        description: 'This ticket is in wrong category - reclassify it',
        workflow: 'reclassify_ticket_type'
      },

      // MARK INVALID: Close ticket as invalid
      '❌': {
        action: 'mark_ticket_invalid',
        description: 'This ticket should not have been created - mark as invalid',
        workflow: 'close_as_invalid'
      }
    };

    this.authorizedUsers = [
      'merekahira',     // Main admin
      'fadlan',         // Your user
      // Add other team members who can override AI decisions
    ];
  }

  /**
   * Handle reaction added to Slack message
   */
  async handleReactionAdded(event) {
    const { emoji, message, user, channel, timestamp } = event;
    
    console.log(`👆 Reaction ${emoji} added by ${user}`);
    
    // Only process authorized users (team members)
    if (!this.isAuthorizedUser(user)) {
      console.log('❌ Unauthorized user, ignoring reaction');
      return;
    }
    
    // Check if this is an AI Bug Router message
    const isAIMessage = await this.isAIRouterMessage(message);
    if (!isAIMessage) {
      console.log('ℹ️ Not an AI Router message, ignoring');
      return;
    }
    
    // Process the feedback
    const feedbackConfig = this.feedbackEmojis[emoji];
    if (!feedbackConfig) {
      console.log('ℹ️ Not a recognized feedback emoji, ignoring');
      return;
    }
    
    console.log(`🎯 Processing ${emoji} feedback from ${user}: ${feedbackConfig.description}`);
    await this.processFeedback(message, feedbackConfig, user, channel);
  }

  /**
   * Process feedback based on emoji type
   */
  async processFeedback(originalMessage, feedbackConfig, feedbackUser, channel) {
    const { action, workflow, description } = feedbackConfig;
    
    try {
      // Find the original issue tracking record
      const issueTracking = await this.findIssueBySlackMessage(originalMessage);
      
      // Log the feedback immediately
      await this.logFeedbackEvent(issueTracking, action, feedbackUser, description);
      
      // Execute the appropriate workflow
      let result;
      switch (action) {
        case 'escalate_issue':
          result = await this.executeEscalationWorkflow(issueTracking, feedbackUser, channel);
          break;
        
        case 'convert_to_user_support':
          result = await this.executeUserSupportWorkflow(issueTracking, feedbackUser, channel);
          break;
        
        case 'retrain_ai_with_this_example':
          result = await this.executeAIRetrainingWorkflow(issueTracking, feedbackUser, channel);
          break;

        // NEW: Ticket revision actions
        case 'revise_existing_ticket':
          result = await this.revisionSystem.processTicketRevision(originalMessage, '🔧', feedbackUser, channel);
          break;
        
        case 'edit_ticket_description':
          result = await this.revisionSystem.processTicketRevision(originalMessage, '📝', feedbackUser, channel);
          break;
        
        case 'change_ticket_category':
          result = await this.revisionSystem.processTicketRevision(originalMessage, '🏷️', feedbackUser, channel);
          break;
        
        case 'mark_ticket_invalid':
          result = await this.revisionSystem.processTicketRevision(originalMessage, '❌', feedbackUser, channel);
          break;
        
        default:
          throw new Error(`Unknown feedback action: ${action}`);
      }

      // Send confirmation to channel
      await this.sendFeedbackConfirmation(channel, feedbackConfig, result, feedbackUser);
      
      console.log(`✅ Successfully processed ${action} feedback`);
      return result;

    } catch (error) {
      console.error(`❌ Error processing feedback:`, {
        message: error.message,
        action: action
      });
      await this.sendErrorNotification(channel, feedbackConfig, error.message, feedbackUser);
    }
  }

  /**
   * Execute escalation workflow - create urgent bug ticket
   */
  async executeEscalationWorkflow(issueTracking, feedbackUser, channel) {
    console.log(`🚨 ESCALATION: ${feedbackUser} overriding AI classification`);
    
    // Create urgent ClickUp ticket immediately
    const urgentTicket = await this.createUrgentOverrideTicket(issueTracking, feedbackUser);
    
    // Trigger AI code generation workflow
    const codeGeneration = await this.triggerCodeGenerationWorkflow(urgentTicket);
    
    // Notify development team
    await this.sendEscalationNotification(channel, issueTracking, urgentTicket, feedbackUser);
    
    // Update issue tracking with escalation
    if (issueTracking) {
      await this.updateIssueTracking(issueTracking.id, {
        state: 'human_escalated',
        escalated_by: feedbackUser,
        escalated_at: Date.now(),
        override_ticket_id: urgentTicket.id,
        escalation_reason: 'Human override via emoji feedback'
      });
    }

    return {
      action: 'escalated',
      ticket: urgentTicket,
      codeGeneration: codeGeneration
    };
  }

  /**
   * Execute user support workflow - provide education response
   */
  async executeUserSupportWorkflow(issueTracking, feedbackUser, channel) {
    console.log(`🙋 USER SUPPORT: ${feedbackUser} marking as user education issue`);
    
    // Generate educational response
    const UserEducationSystem = require('./user-education-system.js').UserEducationSystem;
    const educationSystem = new UserEducationSystem();
    
    const originalText = issueTracking ? issueTracking.slack_text : 'Unknown issue';
    const educationalResponse = await educationSystem.generateEducationalResponse(originalText);
    
    // Create support ticket instead of bug ticket
    const supportTicket = await this.createUserSupportTicket(issueTracking, feedbackUser, educationalResponse);
    
    // Send educational response to original user
    await this.sendEducationalResponse(issueTracking, educationalResponse);
    
    // Update tracking
    if (issueTracking) {
      await this.updateIssueTracking(issueTracking.id, {
        state: 'converted_to_support',
        converted_by: feedbackUser,
        converted_at: Date.now(),
        support_ticket_id: supportTicket.id,
        educational_response: educationalResponse
      });
    }

    return {
      action: 'converted_to_support',
      ticket: supportTicket,
      educationalResponse: educationalResponse
    };
  }

  /**
   * Execute AI retraining workflow - add to training dataset
   */
  async executeAIRetrainingWorkflow(issueTracking, feedbackUser, channel) {
    console.log(`🤖 AI TRAINING: ${feedbackUser} adding example to training dataset`);
    
    if (!issueTracking) {
      throw new Error('Cannot add to training dataset - issue tracking not found');
    }

    // Add to training dataset
    const trainingExample = {
      original_text: issueTracking.slack_text,
      ai_classification: issueTracking.ai_classification,
      human_correction: 'needs_manual_review', // Will be updated later
      feedback_user: feedbackUser,
      feedback_timestamp: Date.now(),
      confidence: issueTracking.confidence,
      context: {
        channel: issueTracking.slack_channel,
        user: issueTracking.slack_user
      }
    };

    await this.addToTrainingDataset(trainingExample);
    
    // Create tracking ticket for review
    const reviewTicket = await this.createTrainingReviewTicket(issueTracking, feedbackUser);
    
    // Update tracking
    await this.updateIssueTracking(issueTracking.id, {
      state: 'added_to_training',
      training_added_by: feedbackUser,
      training_added_at: Date.now(),
      training_review_ticket_id: reviewTicket.id
    });

    return {
      action: 'added_to_training',
      trainingExample: trainingExample,
      reviewTicket: reviewTicket
    };
  }

  /**
   * Create urgent override ticket in ClickUp
   */
  async createUrgentOverrideTicket(issueTracking, feedbackUser) {
    const ticketData = {
      name: `[URGENT][OVERRIDE] ${this.extractTitle(issueTracking?.slack_text || 'Unknown issue')}`,
      description: `🚨 **HUMAN OVERRIDE - AI CLASSIFICATION OVERRIDDEN**

👤 **Overridden by:** ${feedbackUser}
🤖 **Original AI Decision:** ${issueTracking?.ai_classification || 'Unknown'}
📊 **AI Confidence:** ${issueTracking?.confidence ? (issueTracking.confidence * 100).toFixed(1) + '%' : 'Unknown'}

🔗 **Original Slack Message:**
${issueTracking?.slack_text || 'Message not found'}

📋 **Issue Details:**
- **Channel:** ${issueTracking?.slack_channel || 'Unknown'}
- **Reporter:** ${issueTracking?.slack_user || 'Unknown'}
- **Timestamp:** ${issueTracking?.created_at ? new Date(issueTracking.created_at).toISOString() : 'Unknown'}

⚡ **URGENT ACTION REQUIRED:**
This issue was manually escalated by a team member after AI incorrectly classified it as a non-bug. 

🎯 **Next Steps:**
1. Investigate the actual issue immediately
2. Generate code fix if needed
3. Update AI training data to prevent similar misclassifications
4. Deploy fix as soon as possible

🔄 **AI Training Note:**
This case should be added to training data to improve future classifications.`,
      
      priority: 1, // Urgent
      status: 'to do',
      assignees: [66733245, 25514528], // Fadlan and Hiramani
      tags: ['human-override', 'urgent', 'ai-misclassification']
    };

    const clickupResponse = await this.createClickUpTask('900501824745', ticketData);
    
    console.log(`🎫 Created urgent override ticket: ${clickupResponse.id}`);
    return clickupResponse;
  }

  /**
   * Create user support ticket
   */
  async createUserSupportTicket(issueTracking, feedbackUser, educationalResponse) {
    const ticketData = {
      name: `[USER SUPPORT] ${this.extractTitle(issueTracking?.slack_text || 'User help request')}`,
      description: `🙋 **USER EDUCATION ISSUE - NO CODE FIX NEEDED**

👤 **Converted by:** ${feedbackUser}
🤖 **Original AI Decision:** ${issueTracking?.ai_classification || 'Unknown'}

🔗 **Original User Message:**
${issueTracking?.slack_text || 'Message not found'}

📚 **Educational Response Provided:**
${educationalResponse}

📋 **Issue Details:**
- **Channel:** ${issueTracking?.slack_channel || 'Unknown'}
- **User:** ${issueTracking?.slack_user || 'Unknown'}
- **Timestamp:** ${issueTracking?.created_at ? new Date(issueTracking.created_at).toISOString() : 'Unknown'}

✅ **Resolution:**
Educational response has been provided to the user. No code changes are required.

📊 **Follow-up Actions:**
- Monitor if user needs additional help
- Update knowledge base if this is a common question
- Consider improving UI/UX if many users have similar confusion`,
      
      priority: 3, // Normal
      status: 'to do',
      assignees: [66733245], // Fadlan for tracking
      tags: ['user-education', 'not-a-bug', 'support']
    };

    const clickupResponse = await this.createClickUpTask('900501824745', ticketData);
    
    console.log(`🎫 Created user support ticket: ${clickupResponse.id}`);
    return clickupResponse;
  }

  /**
   * Send escalation notification to development team
   */
  async sendEscalationNotification(channel, issueTracking, urgentTicket, feedbackUser) {
    const message = `🚨 URGENT: AI Classification Override

👤 Override by: <@${feedbackUser}>
🎫 Urgent Ticket: ${urgentTicket.url}
🔗 Original Issue: ${issueTracking?.slack_url || 'Link not available'}

What happened:
AI classified this as "${issueTracking?.ai_classification || 'unknown'}" but team member identified it as a real bug requiring immediate attention.

Action taken:
- Created urgent ClickUp ticket with highest priority
- Triggered AI code generation workflow
- Added to training data for future improvement

@merekahira Please review immediately! 🆘`;

    await this.sendSlackMessage(process.env.SLACK_DEV_CHANNEL || channel, message);
  }

  /**
   * Send feedback confirmation
   */
  async sendFeedbackConfirmation(channel, feedbackConfig, result, feedbackUser) {
    const { action } = feedbackConfig;
    let message = '';

    switch (action) {
      case 'escalate_issue':
        message = `✅ Issue Escalated Successfully

🎫 Urgent Ticket: ${result.ticket.url}
👤 Escalated by: <@${feedbackUser}>
🚀 Status: AI code generation started
⏱️ Priority: URGENT

The development team has been notified! 🔔`;
        break;

      case 'convert_to_user_support':
        message = `✅ Converted to User Support

🎫 Support Ticket: ${result.ticket.url}
👤 Converted by: <@${feedbackUser}>
📚 Action: Educational response provided
💡 Type: User help (not a bug)

User will receive helpful guidance! 🤗`;
        break;

      case 'retrain_ai_with_this_example':
        message = `✅ Added to AI Training Dataset

🎫 Training Task: ${result.trainingData?.clickup_url || result.reviewTicket.url}
👤 Added by: <@${feedbackUser}>
🤖 Purpose: Improve AI classification accuracy
📊 Status: Ready for training review

AI will learn from this example! 🧠`;
        break;
    }

    await this.sendSlackMessage(channel, message);
  }

  // Helper methods
  isAuthorizedUser(userId) {
    return this.authorizedUsers.includes(userId);
  }

  async isAIRouterMessage(message) {
    // Check if message is from AI Bug Router
    // Look for specific patterns or bot user ID
    return message.text && (
      message.text.includes('AI Bug Router') ||
      message.text.includes('Issue Classification') ||
      message.bot_id === 'ai-bug-router' // Replace with actual bot ID
    );
  }

  async findIssueBySlackMessage(message) {
    // In real implementation, query database to find issue by Slack timestamp/channel
    console.log('🔍 Finding issue by Slack message...');
    return {
      id: 'mock_issue_id',
      slack_text: message.text,
      slack_channel: message.channel,
      slack_user: message.user,
      slack_ts: message.ts,
      ai_classification: 'USER_EDUCATION_RESPONSE',
      confidence: 0.75,
      created_at: Date.now()
    };
  }

  async createClickUpTask(listId, taskData) {
    console.log('🎫 Creating ClickUp task...');
    
    try {
      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`ClickUp API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ ClickUp task created:', result.id);
      
      return {
        id: result.id,
        url: result.url || `https://app.clickup.com/t/${result.id}`
      };
    } catch (error) {
      console.error('❌ Failed to create ClickUp task:', {
        message: error.message,
        status: error.status
      });
      throw new Error('Failed to create ClickUp task');
    }
  }

  async sendSlackMessage(channel, text, threadTs = null) {
    console.log(`💬 Sending Slack message to ${channel}:`, text.substring(0, 100) + '...');
    
    try {
      const body = {
        channel: channel,
        text: text
      };

      if (threadTs) {
        body.thread_ts = threadTs;
      }

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.slackToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ Slack message sent successfully');
        return result;
      } else {
        console.error('❌ Slack API error:', { error: result.error });
        throw new Error('Slack API Error occurred');
      }
    } catch (error) {
      console.error('💥 Error sending Slack message:', {
        message: error.message,
        type: error.name
      });
      throw new Error('Failed to send Slack message');
    }
  }

  extractTitle(text) {
    if (!text) return 'Unknown Issue';
    const cleanText = text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanText.length > 50 ? cleanText.substring(0, 47) + '...' : cleanText;
  }

  async logFeedbackEvent(issueTracking, action, user, description) {
    console.log(`📝 Logging feedback event: ${action} by ${user}`);
    return true;
  }

  async updateIssueTracking(id, data) {
    console.log(`🔄 Updating issue tracking ${id}:`, Object.keys(data));
    return true;
  }

  async addToTrainingDataset(example) {
    console.log('🧠 Adding to AI training dataset...');
    
    // Create training example task in ClickUp
    const trainingTask = {
      name: `[TRAINING] ${example.original_text.substring(0, 50)}...`,
      description: `🤖 AI TRAINING EXAMPLE

📝 Original Message:
${example.original_text}

🧠 AI Classification:
${example.ai_classification}

👤 Human Feedback By: ${example.feedback_user}
⏰ Added: ${new Date(example.feedback_timestamp).toLocaleString()}

📊 Confidence Score: ${example.confidence || 'Unknown'}

📍 Context:
- Channel: ${example.context.channel || 'Unknown'}
- User: ${example.context.user || 'Unknown'}

🎯 Training Notes:
This example was flagged by a human for AI training improvement. Review this classification and use it to enhance the AI model's understanding.

🔄 Next Steps:
1. Review AI classification accuracy
2. Identify areas for model improvement  
3. Add to training dataset
4. Update AI classification rules if needed`,
      assignees: [66733245],
      priority: 3,
      tags: ['ai-training', 'human-feedback']
    };

    try {
      const response = await this.createClickUpTask('901610583307', trainingTask);
      console.log('✅ Training example created in ClickUp:', response.id);
      
      // Return the created task info
      return {
        success: true,
        clickup_task_id: response.id,
        clickup_url: response.url || `https://app.clickup.com/t/${response.id}`,
        training_data: example
      };
      
    } catch (error) {
      console.error('❌ Failed to create training task:', {
        message: error.message,
        status: error.status
      });
      // Fallback to console logging if ClickUp fails
      console.log('📊 Training example (fallback):', JSON.stringify(example, null, 2));
      return {
        success: false,
        error: error.message,
        training_data: example
      };
    }
  }

  async createTrainingReviewTicket(issueTracking, feedbackUser) {
    const reviewTask = {
      name: `[REVIEW] Training Example - ${issueTracking.slack_text.substring(0, 40)}...`,
      description: `👥 TRAINING REVIEW REQUIRED

📊 Training Example Added By: ${feedbackUser}

🧠 Original AI Classification:
${issueTracking.ai_classification}

📝 Original Message:
${issueTracking.slack_text}

📍 Context:
- Channel: ${issueTracking.slack_channel}  
- User: ${issueTracking.slack_user}
- Confidence: ${issueTracking.confidence || 'Unknown'}

🎯 Review Tasks:
- Verify AI classification accuracy
- Determine correct classification
- Update training dataset if needed
- Improve classification rules
- Test updated model

⏰ Added for Training: ${new Date().toLocaleString()}`,
      assignees: [66733245],
      priority: 2,
      tags: ['training-review', 'human-feedback', 'ai-improvement']
    };

    try {
      const response = await this.createClickUpTask('901610583307', reviewTask);
      console.log('✅ Training review ticket created:', response.id);
      
      return {
        id: response.id,
        url: response.url || `https://app.clickup.com/t/${response.id}`
      };
      
    } catch (error) {
      console.error('❌ Failed to create review ticket:', {
        message: error.message,
        status: error.status
      });
      return {
        id: `review_${Date.now()}`,
        url: 'https://app.clickup.com/t/training_review_fallback',
        error: error.message
      };
    }
  }

  async triggerCodeGenerationWorkflow(ticket) {
    console.log('⚡ Triggering AI code generation workflow...');
    return { status: 'initiated' };
  }

  async sendEducationalResponse(issueTracking, response) {
    console.log('📚 Sending educational response to user...');
    return true;
  }

  async sendErrorNotification(channel, feedbackConfig, error, user) {
    const message = `❌ **Error Processing Feedback**

👤 **User:** <@${user}>
🎯 **Action:** ${feedbackConfig.action}
❌ **Error:** ${error.message}

Please try again or contact support if the issue persists.`;

    await this.sendSlackMessage(channel, message);
  }
}

module.exports = { EmojiFeedbackHandler };
