const axios = require('axios');
const fs = require('fs').promises;

const SLACK_CHANNEL = 'C02GDJUE8LW'; // Main channel for notifications

/**
 * Send message to Slack
 */
async function sendSlackMessage(message) {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.log('⚠️  SLACK_BOT_TOKEN not configured, skipping notification');
      return false;
    }
    
    const response = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: SLACK_CHANNEL,
      text: message,
      unfurl_links: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.ok) {
      console.log('✅ Slack notification sent successfully');
      return true;
    } else {
      console.error('❌ Slack notification failed:', response.data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
    return false;
  }
}

/**
 * Load and parse report files
 */
async function loadReports() {
  const reports = {
    scan: null,
    routing: null,
    health: null
  };
  
  try {
    const scanData = await fs.readFile('scan-report.json', 'utf8');
    reports.scan = JSON.parse(scanData);
  } catch (error) {
    console.log('📄 No scan report found');
  }
  
  try {
    const routingData = await fs.readFile('routing-report.json', 'utf8');
    reports.routing = JSON.parse(routingData);
  } catch (error) {
    console.log('📄 No routing report found');
  }
  
  try {
    const healthData = await fs.readFile('health-report.json', 'utf8');
    reports.health = JSON.parse(healthData);
  } catch (error) {
    console.log('📄 No health report found');
  }
  
  return reports;
}

/**
 * Generate activity summary message
 */
function generateSummary(reports) {
  const { scan, routing, health } = reports;
  const timestamp = new Date().toLocaleString();
  
  let message = `🤖 AI Bug Router - Activity Summary

📅 ${timestamp}

`;

  // Health status
  if (health) {
    const healthEmoji = health.overall.healthy ? '✅' : '⚠️';
    message += `${healthEmoji} System Health: ${health.overall.healthy ? 'All systems operational' : 'Some issues detected'}
`;
    
    if (!health.overall.healthy) {
      const issues = Object.entries(health.overall.services)
        .filter(([_, healthy]) => !healthy)
        .map(([service, _]) => service);
      message += `   Issues: ${issues.join(', ')}
`;
    }
    message += `   Response time: ${health.duration}

`;
  }
  
  // Scanning results
  if (scan) {
    message += `🔍 Repository Scan Results:
   Repositories scanned: ${scan.total_repositories}
   Issues needing routing: ${scan.issues_needing_routing}
`;
    
    if (scan.issues_needing_routing > 0) {
      message += `   
   📋 Issues requiring attention:
`;
      scan.routing_opportunities.slice(0, 5).forEach(item => {
        message += `   • ${item.repo}#${item.issue}: ${item.title.substring(0, 50)}...
     Suggested: ${item.suggested_repo} (${(item.confidence * 100).toFixed(1)}%)
`;
      });
      
      if (scan.routing_opportunities.length > 5) {
        message += `   ... and ${scan.routing_opportunities.length - 5} more
`;
      }
    }
    message += `
`;
  }
  
  // Routing results
  if (routing) {
    message += `🎯 Automatic Routing Results:
   Issues processed: ${routing.total_candidates}
   Successfully routed: ${routing.successfully_routed}
`;
    
    if (routing.successfully_routed > 0) {
      message += `   
   ✅ Recent routing actions:
`;
      routing.results.slice(0, 3).forEach(result => {
        message += `   • ${result.original.repo}#${result.original.issue} → ${result.routed.repo}#${result.routed.issue}
     Confidence: ${(result.confidence * 100).toFixed(1)}%
`;
      });
      
      if (routing.results.length > 3) {
        message += `   ... and ${routing.results.length - 3} more
`;
      }
    }
    message += `
`;
  }
  
  // Add monitoring links
  message += `📊 Monitoring Links:
   GitHub Actions: https://github.com/Biji-Biji-Initiative/mereka-automation/actions
   Cloud Function: https://console.cloud.google.com/functions/details/us-central1/bugReportPipeline?project=mereka-dev
   ClickUp: https://app.clickup.com/900501824745/

🚀 AI Bug Router is continuously monitoring and improving issue routing across all repositories!`;

  return message;
}

/**
 * Send activity summary to Slack
 */
async function sendActivitySummary() {
  console.log('📢 Preparing activity summary...');
  
  try {
    const reports = await loadReports();
    const summary = generateSummary(reports);
    
    console.log('📝 Generated summary message');
    console.log('📤 Sending to Slack...');
    
    const success = await sendSlackMessage(summary);
    
    if (success) {
      console.log('🎉 Activity summary sent successfully!');
    } else {
      console.log('⚠️  Failed to send activity summary');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Error generating activity summary:', error);
    return false;
  }
}

/**
 * Send alert for critical issues
 */
async function sendCriticalAlert(message) {
  const alertMessage = `🚨 CRITICAL ALERT - AI Bug Router

${message}

📊 Check the monitoring dashboard for details:
https://github.com/Biji-Biji-Initiative/mereka-automation/actions`;

  return await sendSlackMessage(alertMessage);
}

// Run if called directly
if (require.main === module) {
  sendActivitySummary()
    .then((success) => {
      if (success) {
        console.log('✅ Summary notification completed');
        process.exit(0);
      } else {
        console.log('⚠️  Summary notification had issues');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Summary notification failed:', error);
      process.exit(1);
    });
}

module.exports = { sendActivitySummary, sendCriticalAlert };
