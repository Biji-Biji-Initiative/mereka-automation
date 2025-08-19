#!/usr/bin/env node

/**
 * Enhanced AI Bug Router - Main Entry Point
 * Comprehensive issue classification and workflow automation
 */

const { EnhancedDailyWorkflow } = require('./enhanced-daily-workflow.js');
const { EmojiFeedbackHandler } = require('./emoji-feedback-handler.js');

class EnhancedAIBugRouter {
  constructor() {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      clickupApiKey: process.env.CLICKUP_API_TOKEN,
      slackToken: process.env.SLACK_TOKEN,
      slackChannel: process.env.SLACK_CHANNEL || 'C02GDJUE8LW',
      githubToken: process.env.GITHUB_TOKEN,
      environment: process.env.NODE_ENV || 'development'
    };

    this.validateConfiguration();
    
    this.dailyWorkflow = new EnhancedDailyWorkflow(this.config);
    this.feedbackHandler = new EmojiFeedbackHandler(this.config.clickupApiKey, this.config.slackToken);
  }

  validateConfiguration() {
    const required = ['openaiApiKey', 'clickupApiKey', 'slackToken'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required configuration:', missing.join(', '));
      console.error('Please set the following environment variables:');
      missing.forEach(key => {
        console.error(`   - ${key.toUpperCase()}`);
      });
      process.exit(1);
    }

    console.log('✅ Configuration validated');
  }

  /**
   * Run daily workflow (scheduled execution)
   */
  async runDaily() {
    console.log('🌅 Enhanced AI Bug Router - Daily Execution');
    console.log('⏰ Started at:', new Date().toISOString());

    try {
      const summary = await this.dailyWorkflow.runDailyCheck();
      
      console.log('✅ Daily workflow completed successfully');
      console.log('📊 Summary:', JSON.stringify(summary, null, 2));
      
      return summary;
    } catch (error) {
      console.error('❌ Daily workflow failed:', error);
      throw error;
    }
  }

  /**
   * Handle Slack emoji reaction (webhook)
   */
  async handleSlackReaction(event) {
    console.log('👆 Handling Slack reaction:', event.reaction);
    
    try {
      const result = await this.feedbackHandler.handleReactionAdded(event);
      console.log('✅ Reaction processed successfully');
      return result;
    } catch (error) {
      console.error('❌ Reaction processing failed:', error);
      throw error;
    }
  }

  /**
   * Process single issue (manual trigger)
   */
  async processSingleIssue(slackMessage) {
    console.log('🔍 Processing single issue manually');
    
    try {
      const result = await this.dailyWorkflow.processIssueWithEnhancedClassification(slackMessage);
      console.log('✅ Issue processed successfully');
      return result;
    } catch (error) {
      console.error('❌ Issue processing failed:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-enhanced',
      components: {
        classifier: 'ok',
        tracker: 'ok',
        education: 'ok',
        feedback: 'ok'
      },
      config: {
        environment: this.config.environment,
        hasOpenAI: !!this.config.openaiApiKey,
        hasClickUp: !!this.config.clickupApiKey,
        hasSlack: !!this.config.slackToken
      }
    };

    console.log('💚 Health check:', health);
    return health;
  }
}

// CLI Interface
async function main() {
  const router = new EnhancedAIBugRouter();
  const command = process.argv[2];

  switch (command) {
    case 'daily':
      await router.runDaily();
      break;
      
    case 'health':
      await router.healthCheck();
      break;
      
    case 'test':
      await testWithSampleIssue(router);
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function testWithSampleIssue(router) {
  console.log('🧪 Testing with sample issue...');
  
  const sampleIssue = {
    text: "🆘 Experience cancellation email - Suddenly got the email saying the experience is cancelled. The event is live and is going to happen next week, we didn't cancel it",
    user: "U12345TEST",
    channel: "C12345TEST",
    ts: Date.now() / 1000
  };

  const result = await router.processSingleIssue(sampleIssue);
  console.log('📊 Test result:', JSON.stringify(result, null, 2));
}

function showHelp() {
  console.log(`
🤖 Enhanced AI Bug Router v2.0.0

USAGE:
  node main.js <command>

COMMANDS:
  daily     Run daily workflow (process new issues)
  health    Check system health and configuration
  test      Test with sample issue
  help      Show this help message

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY     - OpenAI API key for classification
  CLICKUP_API_TOKEN  - ClickUp API token for ticket creation
  SLACK_TOKEN        - Slack bot token for notifications
  SLACK_CHANNEL      - Default Slack channel ID
  GITHUB_TOKEN       - GitHub token for PR creation (optional)
  NODE_ENV           - Environment (development/production)

EXAMPLES:
  # Run daily workflow
  node main.js daily
  
  # Check health
  node main.js health
  
  # Test classification
  node main.js test

FEATURES:
  ✅ Smart issue classification (human error vs real bugs)
  ✅ Confidence scoring and validation
  ✅ Duplicate detection and deduplication
  ✅ User education response system
  ✅ Emoji-based feedback controls (🚨, 🙋, 🤖)
  ✅ Multi-workflow routing
  ✅ Comprehensive tracking and reporting

EMOJI CONTROLS:
  🆘 - Add to Slack message to trigger AI Bug Router
  🚨 - React to escalate issue (override AI decision)
  🙋 - React to mark as user education issue
  🤖 - React to add to AI training dataset
`);
}

// Export for use as module
module.exports = { EnhancedAIBugRouter };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
