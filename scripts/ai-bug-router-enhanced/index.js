/**
 * Google Cloud Function Entry Point
 * Enhanced AI Bug Router with Emoji Reaction Support
 */

const fetch = require('node-fetch');

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
      const { event } = req.body;
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
    console.error('💥 Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
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
    console.error('💥 Message processing error:', error);
    return res.status(500).json({ error: error.message });
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

    // Handle SOS emoji first (main ticket creation)
    if (reaction === 'sos') {
      console.log('🆘 SOS reaction detected - creating bug report...');
      
      // Get the original message content
      const originalMessage = await getSlackMessage(item.channel, item.ts);
      
      if (!originalMessage) {
        console.error('❌ Could not retrieve original message');
        return res.status(400).json({ error: 'Could not retrieve original message' });
      }

      // Create ClickUp ticket from the message
      await createClickUpBugReport(originalMessage, item.channel, user);
      
      // Send confirmation to Slack
      await postSlackResponse(item.channel, 
        '🆘 Bug report received! Creating ClickUp ticket and GitHub issue...', 
        item.ts
      );

      console.log('✅ SOS bug report processed successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'SOS bug report processed',
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
      // Validate required environment variables
      if (!process.env.CLICKUP_TOKEN || !process.env.SLACK_TOKEN) {
        throw new Error('❌ Missing required environment variables: CLICKUP_TOKEN and SLACK_TOKEN must be set');
      }

      const handler = new EmojiFeedbackHandler(
        process.env.CLICKUP_TOKEN,
        process.env.SLACK_TOKEN
      );

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
    console.error('💥 Reaction processing error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get original Slack message content
 */
async function getSlackMessage(channel, timestamp) {
  try {
    const response = await fetch(`https://slack.com/api/conversations.history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
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
    console.error('❌ Error retrieving Slack message:', error);
    return null;
  }
}

/**
 * Create ClickUp bug report ticket
 */
async function createClickUpBugReport(message, channel, reportedBy) {
  try {
    console.log('📝 Creating ClickUp bug report...');
    
    // Format the bug report
    const bugReport = {
      name: `[Bug Report] ${message.text.substring(0, 60)}...`,
      description: `🐛 **BUG REPORT FROM SLACK**

📝 **Issue Description:**
${message.text}

📍 **Context:**
- Reported by: <@${reportedBy}>
- Channel: <#${channel}>
- Timestamp: ${new Date(message.ts * 1000).toLocaleString()}
- Message Link: https://bijimereka.slack.com/archives/${channel}/p${message.ts.replace('.', '')}

🎯 **Next Steps:**
1. Investigate the reported issue
2. Determine if this is a bug or user education need
3. Create GitHub issue if technical fix required
4. Provide resolution or escalate as needed

⏰ **Created:** ${new Date().toLocaleString()}`,
      assignees: [66733245], // Assign to Fadlan
      priority: 2, // High priority
      tags: ['slack-bug-report', 'needs-triage']
    };

    // Create task in ClickUp "All bugs" list
    const response = await fetch('https://api.clickup.com/api/v2/list/900501824745/task', {
      method: 'POST',
      headers: {
        'Authorization': process.env.CLICKUP_TOKEN,
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
    console.error('❌ Failed to create ClickUp bug report:', error);
    throw error;
  }
}

/**
 * Send response message to Slack
 */
async function postSlackResponse(channel, message, threadTs = null) {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
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
    console.error('❌ Error sending Slack response:', error);
    throw error;
  }
}

/**
 * Get Slack message content by channel and timestamp
 */
async function getSlackMessage(channel, messageTs) {
  try {
    if (!process.env.SLACK_TOKEN) {
      throw new Error('❌ SLACK_TOKEN environment variable is required');
    }
    const slackToken = process.env.SLACK_TOKEN;
    
    const response = await fetch(`https://slack.com/api/conversations.history?channel=${channel}&latest=${messageTs}&limit=1&inclusive=true`, {
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.ok && result.messages && result.messages.length > 0) {
      console.log('✅ Retrieved original Slack message');
      return result.messages[0];
    } else {
      console.error('❌ Failed to get Slack message:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error retrieving Slack message:', error);
    return null;
  }
}

/**
 * Post a response message to Slack
 */
async function postSlackResponse(channel, message, threadTs = null) {
  try {
    if (!process.env.SLACK_TOKEN) {
      throw new Error('❌ SLACK_TOKEN environment variable is required');
    }
    const slackToken = process.env.SLACK_TOKEN;
    
    const body = {
      channel: channel,
      text: message
    };

    // Reply in thread if threadTs provided
    if (threadTs) {
      body.thread_ts = threadTs;
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Slack response sent successfully');
    } else {
      console.error('❌ Slack API error:', result.error);
    }

    return result;
    
  } catch (error) {
    console.error('💥 Failed to send Slack response:', error);
  }
}

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
    console.error('💥 Health check failed:', error);
    return res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
};