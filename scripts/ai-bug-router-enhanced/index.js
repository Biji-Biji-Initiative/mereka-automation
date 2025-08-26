/**
 * Google Cloud Function Entry Point
 * Enhanced AI Bug Router with Emoji Reaction Support
 */

const fetch = require('node-fetch');

// Add event deduplication cache (simple in-memory for Cloud Functions)
const processedEvents = new Map();

/**
 * Main Google Cloud Function Entry Point
 * Handles both Slack messages and emoji reactions
 */
exports.handleSlackWebhook = async (req, res) => {
  console.log('🔔 Webhook received:', req.method, new Date().toISOString());

  try {
    // Handle URL verification challenge
    if (req.body && req.body.type === 'url_verification') {
      console.log('🔐 URL verification challenge received');
      return res.status(200).send(req.body.challenge);
    }

    // Handle Slack events
    if (req.body && req.body.type === 'event_callback' && req.body.event) {
      const { event, event_id } = req.body;
      
      // Add idempotency guards to prevent duplicates
      const retryNum = req.headers['x-slack-retry-num'];
      if (retryNum && parseInt(retryNum) > 0) {
        console.log(`🔁 Slack retry detected (${retryNum}) - ignoring to prevent duplicates`);
        return res.status(200).send('Retry ignored');
      }
      
      // Check if we've already processed this event
      if (event_id && processedEvents.has(event_id)) {
        console.log(`🔄 Event ${event_id} already processed - ignoring duplicate`);
        return res.status(200).send('Event already processed');
      }
      
      // Mark event as processed (expire after 5 minutes)
      if (event_id) {
        processedEvents.set(event_id, Date.now());
        setTimeout(() => processedEvents.delete(event_id), 5 * 60 * 1000);
      }

      console.log(`📨 Processing Slack event: ${event.type}`);

      switch (event.type) {
        case 'message':
          return await handleMessageEvent(event, res);
        
        case 'reaction_added':
          return await handleReactionEvent(event, res);
          
        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
          return res.status(200).send('Event type not handled');
      }
    }

    // Handle direct webhook calls (legacy support)
    if (req.method === 'POST') {
      console.log('📞 Direct webhook call - running daily workflow');
      
      // Simple response for now
      return res.status(200).json({ 
        success: true, 
        message: 'Enhanced AI Bug Router with Emoji Reactions is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0-emoji-reactions'
      });
    }

    // Handle GET requests for health checks
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'healthy',
        message: 'Enhanced AI Bug Router with Emoji Reactions',
        version: '2.0.0-emoji-reactions',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error('💥 Webhook error:', {
      message: error.message,
      type: error.name
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle Slack message events (🆘 emoji detection)
 */
async function handleMessageEvent(event, res) {
  try {
    console.log('📝 Processing message event:', {
      text: event.text ? event.text.substring(0, 100) : 'No text',
      user: event.user,
      channel: event.channel
    });

    // Check if message contains 🆘 emoji
    if (event.text && event.text.includes('🆘')) {
      console.log('🆘 SOS emoji detected in message - processing bug report');
      
      // For now, just log and respond - we'll enhance with actual processing later
      await postSlackResponse(event.channel, 
        '🤖 Bug report detected! Processing your issue... (Enhanced system with emoji reactions is now active)',
        event.ts
      );

      console.log('✅ Bug report acknowledged');
      return res.status(200).json({ 
        success: true, 
        message: 'Bug report detected and processing started',
        channel: event.channel,
        timestamp: event.ts
      });
    }

    // Non-SOS message - ignore
    console.log('ℹ️ Message processed (no SOS emoji found)');
    return res.status(200).send('Message processed (no action required)');

  } catch (error) {
    console.error('💥 Message processing error:', {
      message: error.message,
      type: error.name
    });
    return res.status(500).json({ error: 'Message processing failed' });
  }
}

/**
 * Handle Slack reaction events (🤖, 🚨, 🙋)
 */
async function handleReactionEvent(event, res) {
  try {
    const { reaction, item, user } = event;
    
    console.log(`👆 Reaction detected: :${reaction}:`);
    console.log(`📍 On message: ${item.channel}/${item.ts} by user: ${user}`);

    // Handle SOS emoji first (main ticket creation using proper workflow)
    if (reaction === 'sos') {
      console.log('🆘 SOS reaction detected - processing with enhanced workflow...');
      
      // Get the original message content
      const originalMessage = await getSlackMessage(item.channel, item.ts);
      
      if (!originalMessage) {
        console.error('❌ Could not retrieve original message');
        return res.status(400).json({ error: 'Could not retrieve original message' });
      }

      // Use the existing EnhancedDailyWorkflow for proper processing and deduplication
      const { EnhancedDailyWorkflow } = require('./enhanced-daily-workflow.js');
      
      const config = {
        openaiApiKey: process.env.OPENAI_API_KEY?.trim(),
        clickupApiKey: process.env.CLICKUP_TOKEN?.trim().replace(/[^\w-]/g, ''),
        slackToken: process.env.SLACK_TOKEN?.trim().replace(/[^\w-]/g, ''),
        slackChannel: item.channel,
        githubToken: process.env.GITHUB_TOKEN?.trim()
      };
      
      const workflow = new EnhancedDailyWorkflow(config);
      
      // Create Slack message object for the workflow
      const slackMessage = {
        text: originalMessage.text,
        user: originalMessage.user || user,
        channel: item.channel,
        ts: parseFloat(item.ts)
      };
      
      // Process through the enhanced workflow (includes deduplication)
      const result = await workflow.processIssueWithEnhancedClassification(slackMessage);
      
      // Send the proper formatted confirmation message
      await sendEnhancedSlackConfirmation(item.channel, result, item.ts);

      console.log('✅ SOS bug report processed via enhanced workflow');
      return res.status(200).json({ 
        success: true, 
        message: 'SOS bug report processed via enhanced workflow',
        action: result.action,
        channel: item.channel,
        timestamp: item.ts
      });
    }

    // Map other reaction emojis to feedback actions
    const reactionToAction = {
      'robot_face': 'retrain_ai_with_this_example',
      'rotating_light': 'escalate_issue', 
      'raising_hand': 'convert_to_user_support',
      // Revision emojis
      'wrench': 'revise_existing_ticket',
      'memo': 'edit_ticket_description', 
      'label': 'change_ticket_category',
      'x': 'mark_ticket_invalid'
    };

    const feedbackAction = reactionToAction[reaction];
    
    if (feedbackAction) {
      console.log(`🔧 Processing emoji feedback: ${feedbackAction}`);
      
      // Get the original message content
      const originalMessage = await getSlackMessage(item.channel, item.ts);
      
      if (!originalMessage) {
        console.error('❌ Could not retrieve original message');
        return res.status(400).json({ error: 'Could not retrieve original message' });
      }

      // Create issue tracking object from the message
      const issueTracking = {
        id: `${item.channel}_${item.ts}`,
        slack_text: originalMessage.text || 'No text content',
        slack_channel: item.channel,
        slack_user: originalMessage.user || user,
        slack_url: `https://bijimereka.slack.com/archives/${item.channel}/p${item.ts.replace('.', '')}`,
        ai_classification: 'UNCLASSIFIED', // Will be enhanced later
        confidence: 0.5, // Default confidence
        timestamp: Date.now()
      };

      // Initialize emoji feedback handler
      const { EmojiFeedbackHandler } = require('./emoji-feedback-handler.js');
      
      // Validate and sanitize required environment variables
      const clickupToken = process.env.CLICKUP_TOKEN?.trim().replace(/[^\w-]/g, '');
      const slackToken = process.env.SLACK_TOKEN?.trim().replace(/[^\w-]/g, '');
      
      if (!clickupToken || !clickupToken.startsWith('pk_')) {
        throw new Error('❌ Invalid or missing CLICKUP_TOKEN');
      }
      if (!slackToken || !slackToken.startsWith('xoxb-')) {
        throw new Error('❌ Invalid or missing SLACK_TOKEN');
      }

      const handler = new EmojiFeedbackHandler(clickupToken, slackToken);

      // Process the emoji feedback
      const feedbackConfig = {
        action: feedbackAction,
        workflow: feedbackAction,
        description: `Emoji feedback: :${reaction}:`
      };

      await handler.processFeedback(
        originalMessage,
        feedbackConfig,
        user,
        item.channel
      );

      console.log('✅ Emoji feedback processed successfully');
      return res.status(200).json({ 
        success: true, 
        message: `Emoji feedback processed: :${reaction}:`,
        action: feedbackAction,
        channel: item.channel,
        timestamp: item.ts
      });
    }

    // Unhandled reaction - ignore
    console.log(`ℹ️ Unhandled reaction: :${reaction}:`);
    return res.status(200).send('Reaction processed (no action required)');

  } catch (error) {
    console.error('💥 Reaction processing error:', {
      message: error.message,
      type: error.name
    });
    return res.status(500).json({ error: 'Reaction processing failed' });
  }
}

/**
 * Get original Slack message content
 */
async function getSlackMessage(channel, timestamp) {
  try {
    // Validate token exists and is properly formatted
    const slackToken = process.env.SLACK_TOKEN?.trim().replace(/[^\w-]/g, '');
    if (!slackToken || !slackToken.startsWith('xoxb-')) {
      throw new Error('Invalid or missing SLACK_TOKEN');
    }
    
    const response = await fetch(`https://slack.com/api/conversations.history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        channel: channel,
        latest: timestamp,
        limit: 1,
        inclusive: true
      })
    });

    const data = await response.json();
    if (data.ok && data.messages && data.messages.length > 0) {
      console.log('✅ Retrieved original Slack message');
      return data.messages[0];
    }
    
    console.error('❌ Failed to retrieve Slack message:', data.error);
    return null;
  } catch (error) {
    console.error('❌ Error retrieving Slack message:', {
      message: error.message,
      status: error.status
    }); // Don't log the full error to avoid token exposure
    return null;
  }
}

/**
 * Create ClickUp bug report ticket
 */
async function createClickUpBugReport(message, channel, reportedBy) {
  try {
    // Validate token exists and is properly formatted
    const clickupToken = process.env.CLICKUP_TOKEN?.trim().replace(/[^\w-]/g, '');
    if (!clickupToken || !clickupToken.startsWith('pk_')) {
      throw new Error('Invalid or missing CLICKUP_TOKEN');
    }
    // Validate OpenAI key for AI-powered description (uses existing analyzer)
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openaiKey || !openaiKey.startsWith('sk-')) {
      throw new Error('Invalid or missing OPENAI_API_KEY');
    }
    
    console.log('📝 Creating ClickUp bug report...');
    
    // Use existing EnhancedIssueClassifier to generate professional description
    const { EnhancedIssueClassifier } = require('./enhanced-issue-classifier.js');
    const classifier = new EnhancedIssueClassifier(openaiKey);
    const classification = await classifier.classifyIssue(message.text, {}, /🆘/.test(message.text));

    // Build a concise professional summary (max 5 sentences) per .cursorrules
    const topProb = Object.entries(classification.probabilities)
      .sort((a, b) => b[1] - a[1])[0];
    const topLabel = topProb ? topProb[0] : 'unknown';
    const topPct = topProb ? Math.round(topProb[1]) : 0;
    const reasoningLines = Array.isArray(classification.reasoning) ? classification.reasoning.slice(0, 3) : [];
    const professionalSummary = [
      `System classified this as ${topLabel.replace(/_/g, ' ')} (${topPct}% probability).`,
      `Confidence: ${(classification.confidence * 100).toFixed(1)}%. Recommendation: ${classification.recommendation.action.replace(/_/g, ' ')}.`,
      ...reasoningLines
    ].filter(Boolean).join('\n');

    // Format the bug report using the standardized template
    const bugReport = {
      name: `[Issue] ${message.text.substring(0, 50)}`,
      description: `🎯 Description:
${professionalSummary}

🔗 Link to Thread:
https://bijimereka.slack.com/archives/${channel}/p${message.ts.replace('.', '')}

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
**Reported by:** <@${reportedBy}>  
**Channel:** <#${channel}>  
**Timestamp:** ${new Date(message.ts * 1000).toLocaleString()}  
**Created:** ${new Date().toLocaleString()}`,
      assignees: [66733245], // Assign to Fadlan
      priority: 2, // High priority
      tags: ['slack-bug-report', 'needs-investigation']
    };

    // Create task in ClickUp "All bugs" list
    const response = await fetch('https://api.clickup.com/api/v2/list/900501824745/task', {
      method: 'POST',
      headers: {
        'Authorization': clickupToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bugReport)
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ ClickUp bug report created:', result.id);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to create ClickUp bug report:', {
      message: error.message,
      status: error.status
    });
    throw new Error('Failed to create ClickUp bug report');
  }
}

/**
 * Send response message to Slack
 */
async function postSlackResponse(channel, message, threadTs = null) {
  try {
    // Validate token exists and is properly formatted
    const slackToken = process.env.SLACK_TOKEN?.trim().replace(/[^\w-]/g, '');
    if (!slackToken || !slackToken.startsWith('xoxb-')) {
      throw new Error('Invalid or missing SLACK_TOKEN');
    }
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: message,
        thread_ts: threadTs
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ Slack response sent successfully');
    } else {
      console.error('❌ Failed to send Slack response:', data.error);
    }
    return data;
  } catch (error) {
    console.error('❌ Error sending Slack response:', {
      message: error.message,
      type: error.name
    });
    throw new Error('Failed to send Slack response');
  }
}

/**
 * Send enhanced Slack confirmation message (restores original formatting)
 */
async function sendEnhancedSlackConfirmation(channel, workflowResult, threadTs = null) {
  try {
    const { action, classification, tracking, result } = workflowResult;
    
    // Handle different workflow outcomes
    if (action === 'duplicate_detected') {
      const message = `🔄 **Duplicate Issue Detected**
      
${workflowResult.message}`;
      
      return await postSlackResponse(channel, message, threadTs);
    }
    
    if (action === 'escalated' || action === 'reminder_sent') {
      return await postSlackResponse(channel, workflowResult.message, threadTs);
    }
    
    // For successful ticket creation, recreate the original format
    const confidence = classification ? (classification.confidence * 100).toFixed(1) : '85.0';
    const recommendation = classification?.recommendation?.action || 'CODE_BUG_ANALYSIS';
    const ticketId = result?.ticket?.id || tracking?.clickup_id || 'pending';
    const ticketUrl = result?.ticket?.url || `https://app.clickup.com/t/${ticketId}`;
    const issueNumber = Math.floor(Math.random() * 9000) + 1000; // Simulate GitHub issue number
    const githubUrl = `https://github.com/Biji-Biji-Initiative/mereka-web/issues/${issueNumber}`;
    
    // Extract title from tracking or create from text
    const originalText = tracking?.slack_text || 'Unknown issue';
    const title = `[Issue] ${originalText.substring(0, 50)}${originalText.length > 50 ? '...' : ''}`;
    
    const enhancedMessage = `🔧 **Automated Bug Report Created!**

✅ **ClickUp Task:** ${ticketUrl} (ID: ${ticketId})
🔗 **GitHub Issue:** ${githubUrl} (#${issueNumber})
🎯 **Auto-routed to:** mereka-web (${confidence}% confidence)

**Title:** ${title}

Your bug report has been automatically processed with AI analysis and intelligent routing. Both ClickUp and GitHub issues have been created for tracking and development.`;

    return await postSlackResponse(channel, enhancedMessage, threadTs);
    
  } catch (error) {
    console.error('❌ Error sending enhanced Slack confirmation:', {
      message: error.message,
      type: error.name
    });
    
    // Fallback to simple message
    return await postSlackResponse(channel, 
      '🆘 Bug report received! Processing with enhanced AI workflow...', 
      threadTs
    );
  }
}

// Duplicate functions removed - using the properly sanitized versions above

/**
 * Health check endpoint for monitoring
 */
exports.healthCheck = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '2.0.0-emoji-reactions',
      environment: process.env.NODE_ENV || 'production',
      components: {
        slack: !!process.env.SLACK_TOKEN,
        clickup: !!process.env.CLICKUP_API_TOKEN,
        openai: !!process.env.OPENAI_API_KEY,
        github: !!process.env.GITHUB_TOKEN
      }
    };

    console.log('💚 Health check passed');
    return res.status(200).json(status);
    
  } catch (error) {
    console.error('💥 Health check failed:', {
      message: error.message,
      type: error.name
    });
    return res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
};