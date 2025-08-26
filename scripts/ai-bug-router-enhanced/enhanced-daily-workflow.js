/**
 * Enhanced Daily Workflow with Smart Deduplication
 * Runs daily to process new issues while preventing duplicates
 */

const { EnhancedIssueClassifier } = require('./enhanced-issue-classifier.js');
const { IssueStateTracker } = require('./issue-tracker.js');
const { UserEducationSystem } = require('./user-education-system.js');
const { EmojiFeedbackHandler } = require('./emoji-feedback-handler.js');

class EnhancedDailyWorkflow {
  constructor(config) {
    this.config = {
      openaiApiKey: config?.openaiApiKey || process.env.OPENAI_API_KEY,
      clickupApiKey: config?.clickupApiKey || process.env.CLICKUP_API_TOKEN,
      slackToken: config?.slackToken || process.env.SLACK_TOKEN,
      slackChannel: config?.slackChannel || process.env.SLACK_CHANNEL,
      githubToken: config?.githubToken || process.env.GITHUB_TOKEN,
      ...(config || {})
    };

    // Initialize components with error handling
    try {
      this.classifier = new EnhancedIssueClassifier(this.config.openaiApiKey);
      this.tracker = new IssueStateTracker();
      this.educationSystem = new UserEducationSystem();
      this.feedbackHandler = new EmojiFeedbackHandler(this.config.clickupApiKey, this.config.slackToken);
    } catch (error) {
      console.error('⚠️ Error initializing Enhanced Daily Workflow components:', error);
      throw error;
    }
  }

  /**
   * Main daily workflow execution
   */
  async runDailyCheck() {
    console.log('🌅 Starting Enhanced Daily AI Bug Router Check...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
      // Step 1: Get new issues from last 24 hours
      const newIssues = await this.getNewSlackIssues() || [];
      console.log(`📝 Found ${newIssues.length} potential new issues`);

      // Step 2: Check existing issue states
      const stuckIssues = await this.checkStuckIssues() || [];
      console.log(`⏰ Found ${stuckIssues.length} stuck issues needing attention`);

      // Step 3: Process each new issue with enhanced classification
      const processedResults = [];
      for (const issue of newIssues) {
        try {
          const result = await this.processIssueWithEnhancedClassification(issue);
          processedResults.push(result);
          
          // Add small delay to avoid rate limits
          await this.sleep(1000);
        } catch (error) {
          console.error(`❌ Error processing issue:`, error);
          processedResults.push({
            action: 'error',
            issue: issue,
            error: error.message
          });
        }
      }

      // Step 4: Handle stuck issues
      const escalatedResults = [];
      for (const stuckIssue of stuckIssues) {
        try {
          const result = await this.handleStuckIssue(stuckIssue);
          escalatedResults.push(result);
        } catch (error) {
          console.error(`❌ Error handling stuck issue:`, error);
          escalatedResults.push({
            action: 'error',
            issue: stuckIssue,
            error: error.message
          });
        }
      }

      // Step 5: Generate daily summary
      const summary = await this.generateDailySummary(processedResults, escalatedResults);
      
      console.log('✅ Daily workflow completed successfully');
      return summary;

    } catch (error) {
      console.error('❌ Daily workflow failed:', error);
      await this.sendErrorNotification(error);
      throw error;
    }
  }

  /**
   * Process issue with enhanced classification and deduplication
   */
  async processIssueWithEnhancedClassification(slackMessage) {
    console.log(`🔍 Processing: "${slackMessage.text.substring(0, 50)}..."`);
    
    // Step 1: Enhanced AI classification first
    const userContext = await this.getUserContext(slackMessage.user);
    const hasEmergencyEmoji = this.hasEmergencyEmoji(slackMessage.text);
    
    const classification = await this.classifier.classifyIssue(
      slackMessage.text,
      userContext,
      hasEmergencyEmoji
    );

    // Step 2: Check for duplicates and track issue
    const trackingResult = await this.tracker.trackIssue(slackMessage, classification);
    
    if (!trackingResult.shouldProceed) {
      console.log(`🔄 ${trackingResult.action}: ${trackingResult.record?.id || 'unknown'}`);
      
      // Send duplicate notification if appropriate
      if (trackingResult.action === 'duplicate_detected') {
        await this.sendDuplicateNotification(slackMessage, trackingResult);
      }
      
      return trackingResult;
    }



    // Step 3: Execute workflow based on classification
    const workflowResult = await this.executeWorkflowBasedOnClassification(
      trackingResult.record,
      classification,
      slackMessage
    );

    // Step 4: Update tracking with final results
    await this.tracker.updateIssueState(trackingResult.record.id, workflowResult.state, {
      workflow_result: JSON.stringify(workflowResult),
      final_action: workflowResult.action
    });

    console.log(`✅ Completed: ${workflowResult.action}`);
    return {
      action: workflowResult.action,
      classification: classification,
      tracking: trackingResult.record,
      result: workflowResult
    };
  }

  /**
   * Execute appropriate workflow based on AI classification
   */
  async executeWorkflowBasedOnClassification(issueRecord, classification, slackMessage) {
    const { recommendation } = classification;
    
    console.log(`🎯 Executing workflow: ${recommendation.workflow}`);

    switch (recommendation.workflow) {
      case 'ai_code_generation_approved':
        return await this.executeAICodeGenerationWorkflow(issueRecord, classification, slackMessage);
      
      case 'automated_education_response':
        return await this.executeEducationResponseWorkflow(issueRecord, classification, slackMessage);
      
      case 'human_review_then_decision':
        return await this.executeHumanReviewWorkflow(issueRecord, classification, slackMessage);
      
      case 'admin_review_required':
        return await this.executeAdminReviewWorkflow(issueRecord, classification, slackMessage);
      
      case 'emergency_human_review':
        return await this.executeEmergencyReviewWorkflow(issueRecord, classification, slackMessage);
      
      default:
        return await this.executeConservativeReviewWorkflow(issueRecord, classification, slackMessage);
    }
  }

  /**
   * Execute AI code generation workflow
   */
  async executeAICodeGenerationWorkflow(issueRecord, classification, slackMessage) {
    console.log('🤖 Executing AI code generation workflow...');
    
    // Create ClickUp ticket for bug tracking
    const bugTicket = await this.createBugTicket(issueRecord, classification, 'high');
    
    // Send notification about AI processing
    await this.sendProcessingNotification(slackMessage, bugTicket, 'AI code generation started');
    
    // Trigger AI code generation (this would integrate with existing workflow)
    const codeGeneration = await this.triggerAICodeGeneration(bugTicket, issueRecord);
    
    return {
      action: 'ai_code_generation_started',
      state: 'code_generation_in_progress',
      ticket: bugTicket,
      codeGeneration: codeGeneration
    };
  }

  /**
   * Execute education response workflow
   */
  async executeEducationResponseWorkflow(issueRecord, classification, slackMessage) {
    console.log('📚 Executing education response workflow...');
    
    // Generate educational response
    const educationalResponse = await this.educationSystem.generateEducationalResponse(
      slackMessage.text,
      classification
    );
    
    // Create support ticket for tracking
    const supportTicket = await this.createSupportTicket(issueRecord, classification, educationalResponse);
    
    // Send educational response to user
    await this.sendEducationalResponse(slackMessage, educationalResponse);
    
    // Send summary to team
    await this.sendEducationSummary(slackMessage, supportTicket, classification);
    
    return {
      action: 'education_response_provided',
      state: 'resolved_with_education',
      ticket: supportTicket,
      response: educationalResponse
    };
  }

  /**
   * Execute human review workflow
   */
  async executeHumanReviewWorkflow(issueRecord, classification, slackMessage) {
    console.log('👤 Executing human review workflow...');
    
    // Create triage ticket
    const triageTicket = await this.createTriageTicket(issueRecord, classification);
    
    // Send to team for human review
    await this.sendTriageNotification(slackMessage, triageTicket, classification);
    
    return {
      action: 'human_review_requested',
      state: 'awaiting_human_review',
      ticket: triageTicket
    };
  }

  /**
   * Execute admin review workflow
   */
  async executeAdminReviewWorkflow(issueRecord, classification, slackMessage) {
    console.log('⚙️ Executing admin review workflow...');
    
    // Create admin investigation ticket
    const adminTicket = await this.createAdminTicket(issueRecord, classification);
    
    // Send to admin team
    await this.sendAdminNotification(slackMessage, adminTicket, classification);
    
    return {
      action: 'admin_investigation_requested',
      state: 'awaiting_admin_review',
      ticket: adminTicket
    };
  }

  /**
   * Execute emergency review workflow
   */
  async executeEmergencyReviewWorkflow(issueRecord, classification, slackMessage) {
    console.log('🚨 Executing emergency review workflow...');
    
    // Create emergency ticket
    const emergencyTicket = await this.createEmergencyTicket(issueRecord, classification);
    
    // Send urgent notification
    await this.sendEmergencyNotification(slackMessage, emergencyTicket, classification);
    
    return {
      action: 'emergency_review_requested',
      state: 'emergency_review_pending',
      ticket: emergencyTicket
    };
  }

  /**
   * Get new Slack issues from last 24 hours
   */
  async getNewSlackIssues() {
    try {
      // In real implementation, this would query Slack API for messages with 🆘 emoji
      console.log('📡 Fetching new Slack issues...');
      
      // Mock data for testing
      const mockIssues = [
        {
          text: "🆘 Login button not working on mobile Safari",
          user: "U12345",
          channel: "C12345",
          ts: Date.now() / 1000
        }
      ];
      
      // Ensure we always return an array
      return Array.isArray(mockIssues) ? mockIssues : [];
    } catch (error) {
      console.error('⚠️ Error fetching Slack issues:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Check for stuck issues that need attention
   */
  async checkStuckIssues() {
    return await this.tracker.getStuckIssues();
  }

  /**
   * Handle stuck issue based on current state
   */
  async handleStuckIssue(stuckIssue) {
    const daysSinceCreated = (Date.now() - stuckIssue.created_at) / (1000 * 60 * 60 * 24);
    
    console.log(`⏰ Handling stuck issue: ${stuckIssue.id} (${daysSinceCreated.toFixed(1)} days old)`);
    
    if (stuckIssue.state === 'pr_created' && daysSinceCreated > 3) {
      return await this.sendPRReminderToSlack(stuckIssue);
    } else if (stuckIssue.state === 'ticket_created' && daysSinceCreated > 1) {
      return await this.escalateTicketToUrgent(stuckIssue);
    } else if (stuckIssue.state === 'analyzed' && daysSinceCreated > 2) {
      return await this.retryIssueProcessing(stuckIssue);
    }
    
    return { action: 'no_action_needed', issue: stuckIssue };
  }

  /**
   * Generate daily summary report
   */
  async generateDailySummary(processedResults, escalatedResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      newIssuesProcessed: processedResults.length,
      duplicatesSkipped: processedResults.filter(r => r.action === 'duplicate_detected').length,
      aiCodeGenerationStarted: processedResults.filter(r => r.action === 'ai_code_generation_started').length,
      educationResponsesProvided: processedResults.filter(r => r.action === 'education_response_provided').length,
      humanReviewRequested: processedResults.filter(r => r.action === 'human_review_requested').length,
      stuckIssuesEscalated: escalatedResults.length,
      errors: processedResults.filter(r => r.action === 'error').length,
      totalTimesSaved: this.calculateTimeSaved(processedResults)
    };

    // Send summary to team
    await this.sendDailySummaryToSlack(summary, processedResults, escalatedResults);
    
    console.log('📊 Daily summary:', summary);
    return summary;
  }

  // Helper methods
  hasEmergencyEmoji(text) {
    return /🆘/.test(text);
  }

  async getUserContext(userId) {
    // In real implementation, fetch user info from database
    return {
      userType: 'unknown',
      techLevel: 'unknown',
      previousIssues: []
    };
  }

  calculateTimeSaved(results) {
    const duplicates = results.filter(r => r.action === 'duplicate_detected').length;
    const education = results.filter(r => r.action === 'education_response_provided').length;
    
    // Estimate time saved: 2 hours per duplicate PR prevented, 30 min per education response
    return `~${(duplicates * 2) + (education * 0.5)} hours`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Notification methods
  async sendDuplicateNotification(slackMessage, trackingResult) {
    console.log('🔄 Sending duplicate notification');
    // Implementation would send Slack message
  }

  async sendProcessingNotification(slackMessage, ticket, message) {
    console.log('📤 Sending processing notification:', message);
    // Implementation would send Slack message
  }

  async sendEducationalResponse(slackMessage, response) {
    console.log('📚 Sending educational response to user');
    // Implementation would send Slack DM or reply
  }

  async sendEducationSummary(slackMessage, ticket, classification) {
    console.log('📊 Sending education summary to team');
    // Implementation would send Slack message to team channel
  }

  async sendTriageNotification(slackMessage, ticket, classification) {
    console.log('👤 Sending triage notification');
    // Implementation would send Slack message
  }

  async sendAdminNotification(slackMessage, ticket, classification) {
    console.log('⚙️ Sending admin notification');
    // Implementation would send Slack message
  }

  async sendEmergencyNotification(slackMessage, ticket, classification) {
    console.log('🚨 Sending emergency notification');
    // Implementation would send urgent Slack message
  }

  async sendDailySummaryToSlack(summary, processedResults, escalatedResults) {
    console.log('📊 Sending daily summary to Slack');
    // Implementation would send formatted summary
  }

  async sendErrorNotification(error) {
    console.log('❌ Sending error notification');
    // Implementation would send error alert
  }

  // Ticket creation methods
  async createBugTicket(issueRecord, classification, priority) {
    console.log('🎫 Creating real ClickUp bug ticket...');
    
    const fetch = require('node-fetch');
    
    try {
      // Build professional description using AI analysis
      const topProb = Object.entries(classification.probabilities)
        .sort((a, b) => b[1] - a[1])[0];
      const topLabel = topProb ? topProb[0] : 'unknown';
      const topPct = topProb ? Math.round(topProb[1]) : 0;
      const reasoningLines = Array.isArray(classification.reasoning) ? classification.reasoning.slice(0, 3) : [];
      
      const professionalSummary = [
        `System classified this as ${topLabel.replace(/_/g, ' ')} (${topPct}% probability).`,
        `Confidence: ${(classification.confidence * 100).toFixed(1)}%. Recommendation: ${classification.recommendation.action.replace(/_/g, ' ')}.`,
        ...reasoningLines
      ].filter(Boolean).join(' ');

      const bugReport = {
        name: `[Issue] ${issueRecord.slack_text.substring(0, 50)}`,
        description: `🎯 Description:
${professionalSummary}

🔗 Link to Thread:
${issueRecord.slack_url || `https://bijimereka.slack.com/archives/${issueRecord.slack_channel}/p${issueRecord.slack_ts.toString().replace('.', '')}`}

📋 Preconditions:
[To be filled by assignee based on investigation]

🔧 Steps to Reproduce:
[To be filled by assignee based on investigation]

✅ Expected Result:
[To be filled by assignee based on investigation]

❌ Actual Result:
[To be filled by assignee based on investigation]

🎨 Figma Link:
[Leave empty field for design reference]

📎 Attachments:
[Leave empty field for screenshots, files, etc.]

---
**Reported by:** <@${issueRecord.slack_user}>  
**Channel:** <#${issueRecord.slack_channel}>  
**Timestamp:** ${new Date(issueRecord.created_at).toLocaleString()}  
**Created:** ${new Date().toLocaleString()}`,
        assignees: [66733245], // Assign to Fadlan
        priority: priority === 'high' ? 2 : (priority === 'urgent' ? 1 : 3),
        tags: ['ai-routed', 'slack-bug-report', 'needs-investigation']
      };

      // Create task in ClickUp "All bugs" list
      const response = await fetch('https://api.clickup.com/api/v2/list/900501824745/task', {
        method: 'POST',
        headers: {
          'Authorization': this.config.clickupApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bugReport)
      });

      if (!response.ok) {
        throw new Error(`ClickUp API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Real ClickUp bug ticket created:', result.id);
      
      return {
        id: result.id,
        url: result.url || `https://app.clickup.com/t/${result.id}`
      };
      
    } catch (error) {
      console.error('❌ Failed to create real ClickUp bug ticket:', {
        message: error.message,
        status: error.status
      });
      
      // Fallback to mock for now to prevent complete failure
      return { id: 'bug_' + Date.now(), url: 'https://app.clickup.com/t/bug_' + Date.now() };
    }
  }

  async createSupportTicket(issueRecord, classification, response) {
    console.log('🎫 Creating support ticket');
    return { id: 'support_' + Date.now(), url: 'https://app.clickup.com/t/support_' + Date.now() };
  }

  async createTriageTicket(issueRecord, classification) {
    console.log('🎫 Creating triage ticket');
    return { id: 'triage_' + Date.now(), url: 'https://app.clickup.com/t/triage_' + Date.now() };
  }

  async createAdminTicket(issueRecord, classification) {
    console.log('🎫 Creating admin ticket');
    return { id: 'admin_' + Date.now(), url: 'https://app.clickup.com/t/admin_' + Date.now() };
  }

  async createEmergencyTicket(issueRecord, classification) {
    console.log('🎫 Creating emergency ticket');
    return { id: 'emergency_' + Date.now(), url: 'https://app.clickup.com/t/emergency_' + Date.now() };
  }

  // Workflow integration methods
  async triggerAICodeGeneration(ticket, issueRecord) {
    console.log('⚡ Triggering AI code generation');
    return { status: 'initiated', workflowId: 'workflow_' + Date.now() };
  }

  async sendPRReminderToSlack(stuckIssue) {
    console.log('⏰ Sending PR reminder');
    return { action: 'pr_reminder_sent', issue: stuckIssue };
  }

  async escalateTicketToUrgent(stuckIssue) {
    console.log('🚨 Escalating ticket to urgent');
    return { action: 'escalated_to_urgent', issue: stuckIssue };
  }

  async retryIssueProcessing(stuckIssue) {
    console.log('🔄 Retrying issue processing');
    return { action: 'retry_initiated', issue: stuckIssue };
  }
}

module.exports = { EnhancedDailyWorkflow };
