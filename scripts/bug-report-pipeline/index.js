const express = require('express');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Create an Express app 
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Function to get secrets from Google Secret Manager
async function getSecret(secretName) {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/mereka-dev/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString();
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}

// Function to get Slack message content
async function getSlackMessage(channel, timestamp) {
  try {
    const token = await getSecret('SLACK_BOT_TOKEN');
    if (!token) throw new Error('Slack token not found');
    
    // Clean the token of any invisible characters or newlines
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    
    const response = await axios.get(`https://slack.com/api/conversations.replies`, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        channel: channel,
        ts: timestamp,
        limit: 1
      }
    });
    
    if (response.data.ok && response.data.messages && response.data.messages.length > 0) {
      return response.data.messages[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching Slack message:', error);
    return null;
  }
}

// Function to create ClickUp task
async function createClickUpTask(title, description, priority = 2) {
  try {
    const apiKey = await getSecret('CLICKUP_API_KEY');
    if (!apiKey) throw new Error('ClickUp API key not found');
    
    // Clean the API key of any invisible characters or newlines
    const cleanApiKey = apiKey.trim().replace(/[\r\n\t]/g, '');
    
    const taskData = {
      name: title,
      description: description,
      priority: priority,
      status: 'to do',
      assignees: [25514528, 66733245] // Hiramani Upadhyay and Fadlan (for notifications)
    };
    
    const response = await axios.post(
      'https://api.clickup.com/api/v2/list/900501824745/task',
      taskData,
      {
        headers: {
          'Authorization': cleanApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating ClickUp task:', error);
    throw error;
  }
}

// Function to generate enhanced bug report from Slack message
async function generateBugReport(slackMessage, channel, user) {
  const messageText = slackMessage.text || 'No message text available';
  const messageLink = `https://bijimereka.slack.com/archives/${channel}/p${slackMessage.ts.replace('.', '')}`;

  // Clean up Slack user mentions and extract meaningful information
  const cleanedText = messageText.replace(/<@[A-Z0-9]+>/g, '').replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();

  // Extract key information for better categorization
  const isMobileIssue = messageText.toLowerCase().includes('mobile') || messageText.toLowerCase().includes('phone') || messageText.toLowerCase().includes('responsive');
  const isJobIssue = messageText.toLowerCase().includes('job') || messageText.toLowerCase().includes('hire') || messageText.toLowerCase().includes('application');
  const isClickabilityIssue = messageText.toLowerCase().includes('unclickable') || messageText.toLowerCase().includes('not clickable') || messageText.toLowerCase().includes('button not working');
  const isPaymentIssue = messageText.toLowerCase().includes('subscription') || messageText.toLowerCase().includes('stripe') || messageText.toLowerCase().includes('payment');
  const isAuthIssue = messageText.toLowerCase().includes('login') || messageText.toLowerCase().includes('auth') || messageText.toLowerCase().includes('sign in');

  // Generate specific expected and actual results based on content analysis
  let expectedResult = 'System should function as designed for optimal user experience';
  let actualResult = cleanedText;
  let specificPreconditions = ['Issue identified during normal platform usage', 'Reported via SOS emoji reaction system'];
  let reproductionSteps = ['Review the original Slack message for detailed context', 'Investigate the specific functionality mentioned'];

  // Customize based on issue type
  if (isMobileIssue && isJobIssue && isClickabilityIssue) {
    expectedResult = 'Job listings should be fully clickable and interactive on mobile devices, allowing users to view job details, milestones, and submissions easily';
    specificPreconditions.push('User accessing job section on mobile device', 'Job listings are displayed but interactive elements are not functioning');
    reproductionSteps = [
      'Open Mereka platform on mobile device (iOS/Android)',
      'Navigate to job listings or job hires section',
      'Attempt to click on job items, milestones, or submission links',
      'Verify that clicks register and navigate to appropriate details'
    ];
  } else if (isJobIssue) {
    expectedResult = 'Job-related functionality should work seamlessly across all devices and user types';
    specificPreconditions.push('User accessing job-related features', 'Jobs are visible but functionality is impaired');
    reproductionSteps = [
      'Navigate to the job section mentioned in the report',
      'Attempt the specific actions described in the issue',
      'Test on both desktop and mobile if applicable'
    ];
  } else if (isMobileIssue) {
    expectedResult = 'All platform features should be fully functional and responsive on mobile devices';
    specificPreconditions.push('User accessing platform via mobile device', 'Mobile responsiveness or functionality issue present');
    reproductionSteps = [
      'Access the platform on mobile device',
      'Navigate to the specific feature mentioned',
      'Test functionality and responsiveness'
    ];
  }

  if (isPaymentIssue) {
    expectedResult = 'Payment and subscription features should work reliably to ensure revenue flow and user satisfaction';
    specificPreconditions.push('Payment/subscription system involvement', 'Potential revenue impact');
  }

  if (isAuthIssue) {
    expectedResult = 'Authentication should allow seamless access to platform features for authorized users';
    specificPreconditions.push('User authentication required', 'Access control systems involved');
  }

  // Generate enhanced description with business context
  const description = `🎯 Description:
${cleanedText}

Issue reported via SOS emoji reaction requiring immediate attention. ${isMobileIssue ? 'This is a mobile responsiveness/functionality issue affecting user experience on mobile devices. ' : ''}${isJobIssue ? 'This affects job-related functionality which is core to platform value. ' : ''}${isPaymentIssue ? 'This is a payment/subscription issue that may impact revenue. ' : ''}${isAuthIssue ? 'This is an authentication issue that may prevent user access. ' : ''}

🔗 Link to Thread:
${messageLink}

📋 Preconditions:
${specificPreconditions.map(condition => `- ${condition}`).join('\n')}

🔧 Steps to Reproduce:
${reproductionSteps.map((step, index) => `• ${step}`).join('\n')}

✅ Expected Result:
${expectedResult}

❌ Actual Result:
${actualResult}

🎨 Figma Link:
[To be added - check mobile designs for job listings if UI/UX related]

📎 Attachments:
[Screenshots mentioned in Slack thread to be referenced for visual context]`;

  return description;
}

// Function to send confirmation message to Slack
async function sendSlackConfirmation(channel, threadTimestamp, taskId, taskUrl, title) {
  try {
    const token = await getSecret('SLACK_BOT_TOKEN');
    if (!token) throw new Error('Slack token not found');

    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    
    const confirmationMessage = `✅ Bug report created successfully!
    
Ticket ID: ${taskId}
Title: ${title.length > 80 ? title.substring(0, 80) + '...' : title}
ClickUp Link: ${taskUrl}

Your bug report has been automatically processed and assigned to the development team. You can track the progress using the ClickUp link above.`;

    const response = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channel,
      thread_ts: threadTimestamp,
      text: confirmationMessage,
      unfurl_links: false
    }, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.ok) {
      console.log('✅ Slack confirmation sent successfully');
    } else {
      console.error('❌ Failed to send Slack confirmation:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error sending Slack confirmation:', error);
  }
}

// Function to process SOS reaction and create ClickUp task
async function processSOSReaction(event) {
  try {
    console.log('Processing SOS reaction...');

    // Get the original message that was reacted to
    const slackMessage = await getSlackMessage(event.item.channel, event.item.ts);
    if (!slackMessage) {
      console.error('Could not fetch original Slack message');
      return;
    }

    console.log('Retrieved Slack message:', slackMessage.text);

    // Generate the bug report description
    const description = await generateBugReport(slackMessage, event.item.channel, event.user);

    // Create enhanced title based on message content analysis
    const messageText = slackMessage.text || 'SOS Bug Report';
    let title = '[Issue]';

    // Determine priority based on content
    const isHotfix = messageText.toLowerCase().includes('production') || 
                     messageText.toLowerCase().includes('stripe') || 
                     messageText.toLowerCase().includes('payment') || 
                     messageText.toLowerCase().includes('subscription') ||
                     messageText.toLowerCase().includes('crash') ||
                     messageText.toLowerCase().includes('broken');

    if (isHotfix) {
      title = '[Issue][Hotfix]';
    }

    // Generate descriptive title based on content analysis
    let descriptiveTitle = 'SOS Bug Report';

    // Analyze message content for specific patterns
    const lowerText = messageText.toLowerCase();

    if (lowerText.includes('mobile') && lowerText.includes('job') && lowerText.includes('unclickable')) {
      descriptiveTitle = 'Mobile job listings unclickable - preventing user interaction';
    } else if (lowerText.includes('subscription') && lowerText.includes('profile')) {
      descriptiveTitle = 'Subscription user receiving profile creation prompts';
    } else if (lowerText.includes('mobile') && lowerText.includes('unclickable')) {
      descriptiveTitle = 'Mobile interface elements unclickable';
    } else if (lowerText.includes('job') && lowerText.includes('mobile')) {
      descriptiveTitle = 'Job functionality issues on mobile device';
    } else if (lowerText.includes('login') || lowerText.includes('sign in')) {
      descriptiveTitle = 'Login functionality issue';
    } else if (lowerText.includes('payment') || lowerText.includes('stripe')) {
      descriptiveTitle = 'Payment processing issue';
    } else if (lowerText.includes('profile')) {
      descriptiveTitle = 'User profile related issue';
    } else if (lowerText.includes('mobile')) {
      descriptiveTitle = 'Mobile platform functionality issue';
    } else if (lowerText.includes('job')) {
      descriptiveTitle = 'Job platform functionality issue';
    } else {
      // Extract meaningful keywords for generic issues
      const cleanText = messageText.replace(/<@[A-Z0-9]+>/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      const words = cleanText.split(' ').filter(word => word.length > 3 && !['last', 'night', 'tried', 'they', 'were', 'with', 'that', 'this', 'have', 'been'].includes(word.toLowerCase()));
      if (words.length >= 3) {
        descriptiveTitle = words.slice(0, 8).join(' ');
      } else {
        descriptiveTitle = cleanText.substring(0, 60);
      }
      if (descriptiveTitle.length > 60) descriptiveTitle = descriptiveTitle.substring(0, 60) + '...';
    }

    title += ` ${descriptiveTitle}`;

    // Create ClickUp task
    console.log('Creating ClickUp task...');
    const clickUpTask = await createClickUpTask(title, description, 2); // Priority 2 = High

    console.log('✅ Bug report created successfully:', {
      taskId: clickUpTask.id,
      title: title.substring(0, 80) + (title.length > 80 ? '...' : ''),
      url: clickUpTask.url
    });

    // Send confirmation message to Slack thread
    await sendSlackConfirmation(
      event.item.channel, 
      event.item.ts, 
      clickUpTask.id, 
      clickUpTask.url, 
      title
    );

  } catch (error) {
    console.error('❌ Error processing SOS reaction:', error);
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Bug Report Pipeline is running!',
    timestamp: new Date().toISOString() 
  });
});

// Basic endpoint to receive Slack events (for testing)
app.post('/slack/events', (req, res) => {
  // Handle Slack challenge for URL verification
  if (req.body.challenge) {
    return res.json({ challenge: req.body.challenge });
  }
  
  // Handle actual events
  if (req.body.event && req.body.event.type === 'reaction_added') {
    if (req.body.event.reaction === 'sos') {
      console.log('🆘 SOS reaction detected - Creating bug report...', {
        user: req.body.event.user,
        channel: req.body.event.item.channel,
        timestamp: req.body.event.item.ts
      });
      
      // Process the SOS reaction asynchronously
      processSOSReaction(req.body.event).catch(error => {
        console.error('❌ Error processing SOS reaction:', error);
      });
    }
  }
  
  res.json({ ok: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Export the express app as the Cloud Function
exports.bugReportPipeline = app;