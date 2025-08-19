/**
 * AI Bug Router - Webhook Handler
 * Handles real-time webhooks from GitHub and ClickUp for instant synchronization
 */

const express = require('express');
const crypto = require('crypto');
const { TwoWaySyncEngine } = require('./two-way-sync-engine');

class WebhookHandler {
  constructor() {
    this.app = express();
    this.syncEngine = new TwoWaySyncEngine();
    this.port = process.env.WEBHOOK_PORT || 3000;
    this.githubSecret = process.env.GITHUB_WEBHOOK_SECRET;
    this.clickupSecret = process.env.CLICKUP_WEBHOOK_SECRET;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Raw body parser for webhook signature verification
    this.app.use('/webhook', express.raw({ type: 'application/json' }));
    this.app.use(express.json());
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'AI Bug Router Webhook Handler'
      });
    });

    // GitHub webhook endpoint
    this.app.post('/webhook/github', (req, res) => {
      this.handleGitHubWebhook(req, res);
    });

    // ClickUp webhook endpoint
    this.app.post('/webhook/clickup', (req, res) => {
      this.handleClickUpWebhook(req, res);
    });

    // Manual sync trigger endpoint
    this.app.post('/sync/trigger', async (req, res) => {
      try {
        console.log('🔄 Manual sync triggered via API');
        const result = await this.syncEngine.runFullSync();
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Sync status endpoint
    this.app.get('/sync/status', async (req, res) => {
      try {
        const stats = await this.syncEngine.getSyncStats();
        res.json({ success: true, stats });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  /**
   * Handle GitHub webhook events
   */
  async handleGitHubWebhook(req, res) {
    try {
      // Verify GitHub webhook signature
      if (!this.verifyGitHubSignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.headers['x-github-event'];
      const payload = JSON.parse(req.body);

      console.log(`📥 GitHub webhook: ${event} event received`);

      // Process different GitHub events
      switch (event) {
        case 'issues':
          await this.handleGitHubIssueEvent(payload);
          break;
          
        case 'issue_comment':
          await this.handleGitHubCommentEvent(payload);
          break;
          
        case 'pull_request':
          await this.handleGitHubPullRequestEvent(payload);
          break;
          
        default:
          console.log(`ℹ️ Ignoring GitHub event: ${event}`);
      }

      res.json({ success: true, event, processed: true });

    } catch (error) {
      console.error('❌ GitHub webhook error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Handle ClickUp webhook events
   */
  async handleClickUpWebhook(req, res) {
    try {
      // Verify ClickUp webhook signature if configured
      if (this.clickupSecret && !this.verifyClickUpSignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const payload = req.body;
      const event = payload.event;

      console.log(`📥 ClickUp webhook: ${event} event received`);

      // Process different ClickUp events
      switch (event) {
        case 'taskStatusUpdated':
          await this.handleClickUpTaskStatusEvent(payload);
          break;
          
        case 'taskUpdated':
          await this.handleClickUpTaskUpdateEvent(payload);
          break;
          
        case 'taskCreated':
          await this.handleClickUpTaskCreateEvent(payload);
          break;
          
        default:
          console.log(`ℹ️ Ignoring ClickUp event: ${event}`);
      }

      res.json({ success: true, event, processed: true });

    } catch (error) {
      console.error('❌ ClickUp webhook error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Handle GitHub issue events (opened, closed, edited)
   */
  async handleGitHubIssueEvent(payload) {
    const { action, issue, repository } = payload;
    
    console.log(`🐙 Processing GitHub issue ${action}: ${repository.name}#${issue.number}`);

    try {
      await this.syncEngine.initialize();
      
      const mappingKey = `${repository.name}#${issue.number}`;
      const clickupTaskId = this.syncEngine.syncMappings.githubToClickup[mappingKey];

      if (clickupTaskId) {
        // Update existing ClickUp task
        await this.syncEngine.updateClickUpTaskFromGitHub(clickupTaskId, issue);
        
        await this.syncEngine.logSyncEvent({
          type: 'real_time_sync',
          direction: 'github_to_clickup',
          trigger: 'webhook',
          action: action,
          githubIssue: mappingKey,
          clickupTask: clickupTaskId,
          success: true
        });

      } else if (action === 'opened' && this.syncEngine.shouldCreateClickUpTask(issue)) {
        // Create new ClickUp task for new GitHub issue
        const result = await this.syncEngine.createClickUpTaskFromGitHub(issue, repository.name);
        
        if (result.success) {
          await this.syncEngine.createMapping(issue.number, repository.name, result.taskId);
          
          await this.syncEngine.logSyncEvent({
            type: 'real_time_sync',
            direction: 'github_to_clickup',
            trigger: 'webhook',
            action: 'created',
            githubIssue: mappingKey,
            clickupTask: result.taskId,
            success: true
          });
        }
      }

    } catch (error) {
      console.error(`❌ Error processing GitHub issue event:`, error.message);
      
      await this.syncEngine.logSyncEvent({
        type: 'real_time_sync',
        direction: 'github_to_clickup',
        trigger: 'webhook',
        action: action,
        githubIssue: `${repository.name}#${issue.number}`,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle ClickUp task status updates
   */
  async handleClickUpTaskStatusEvent(payload) {
    const { task_id, history_items } = payload;
    
    console.log(`📋 Processing ClickUp task status update: ${task_id}`);

    try {
      await this.syncEngine.initialize();
      
      const githubMapping = this.syncEngine.syncMappings.clickupToGithub[task_id];
      
      if (githubMapping) {
        // Get the task details to determine new status
        const taskResponse = await fetch(`https://api.clickup.com/api/v2/task/${task_id}`, {
          headers: {
            'Authorization': this.syncEngine.clickupToken,
            'Content-Type': 'application/json'
          }
        });

        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          
          // Update GitHub issue based on ClickUp task status
          await this.syncEngine.updateGitHubIssueFromClickUp(
            githubMapping.repo,
            githubMapping.issueId,
            taskData
          );
          
          await this.syncEngine.logSyncEvent({
            type: 'real_time_sync',
            direction: 'clickup_to_github',
            trigger: 'webhook',
            action: 'status_updated',
            clickupTask: task_id,
            githubIssue: `${githubMapping.repo}#${githubMapping.issueId}`,
            newStatus: taskData.status?.status,
            success: true
          });
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ClickUp task status event:`, error.message);
      
      await this.syncEngine.logSyncEvent({
        type: 'real_time_sync',
        direction: 'clickup_to_github',
        trigger: 'webhook',
        action: 'status_updated',
        clickupTask: task_id,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle ClickUp task updates
   */
  async handleClickUpTaskUpdateEvent(payload) {
    // Similar to status update but for general task changes
    console.log(`📋 Processing ClickUp task update: ${payload.task_id}`);
    
    // For now, treat as status update
    await this.handleClickUpTaskStatusEvent(payload);
  }

  /**
   * Handle ClickUp task creation
   */
  async handleClickUpTaskCreateEvent(payload) {
    console.log(`📋 Processing ClickUp task creation: ${payload.task_id}`);
    
    // Log the event but don't sync back to GitHub (to avoid loops)
    await this.syncEngine.logSyncEvent({
      type: 'task_created',
      direction: 'clickup',
      trigger: 'webhook',
      clickupTask: payload.task_id,
      success: true,
      note: 'Task creation logged, no reverse sync to avoid loops'
    });
  }

  /**
   * Handle GitHub comment events
   */
  async handleGitHubCommentEvent(payload) {
    const { action, issue, comment, repository } = payload;
    
    if (action === 'created') {
      console.log(`💬 GitHub comment added to ${repository.name}#${issue.number}`);
      
      // Check if comment contains sync commands
      const commentBody = comment.body.toLowerCase();
      
      if (commentBody.includes('/sync-to-clickup')) {
        console.log('🔄 Manual sync command detected in comment');
        
        try {
          await this.syncEngine.initialize();
          const mappingKey = `${repository.name}#${issue.number}`;
          const clickupTaskId = this.syncEngine.syncMappings.githubToClickup[mappingKey];
          
          if (clickupTaskId) {
            await this.syncEngine.updateClickUpTaskFromGitHub(clickupTaskId, issue);
            
            // Add confirmation comment
            await this.syncEngine.octokit.issues.createComment({
              owner: this.syncEngine.owner,
              repo: repository.name,
              issue_number: issue.number,
              body: `✅ **Sync Command Executed**\n\nClickUp task has been updated with latest GitHub issue data.\n\n*Triggered by: @${comment.user.login}*`
            });
          }
          
        } catch (error) {
          console.error('❌ Manual sync command failed:', error.message);
        }
      }
    }
  }

  /**
   * Handle GitHub pull request events
   */
  async handleGitHubPullRequestEvent(payload) {
    const { action, pull_request, repository } = payload;
    
    console.log(`🔀 GitHub PR ${action}: ${repository.name}#${pull_request.number}`);
    
    // Log PR events for analytics but don't sync (PRs are different from issues)
    await this.syncEngine.logSyncEvent({
      type: 'pull_request_event',
      action: action,
      repo: repository.name,
      prNumber: pull_request.number,
      success: true,
      note: 'PR event logged for analytics'
    });
  }

  /**
   * Verify GitHub webhook signature
   */
  verifyGitHubSignature(req) {
    if (!this.githubSecret) {
      console.log('⚠️ GitHub webhook secret not configured, skipping signature verification');
      return true; // Allow if no secret configured
    }

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
      return false;
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', this.githubSecret)
      .update(req.body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify ClickUp webhook signature
   */
  verifyClickUpSignature(req) {
    if (!this.clickupSecret) {
      console.log('⚠️ ClickUp webhook secret not configured, skipping signature verification');
      return true; // Allow if no secret configured
    }

    const signature = req.headers['x-signature'];
    if (!signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.clickupSecret)
      .update(req.body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Start the webhook server
   */
  async start() {
    try {
      await this.syncEngine.initialize();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 Webhook handler started on port ${this.port}`);
        console.log(`📥 GitHub webhooks: http://localhost:${this.port}/webhook/github`);
        console.log(`📥 ClickUp webhooks: http://localhost:${this.port}/webhook/clickup`);
        console.log(`🏥 Health check: http://localhost:${this.port}/health`);
        console.log(`🔄 Manual sync: POST http://localhost:${this.port}/sync/trigger`);
      });

    } catch (error) {
      console.error('❌ Failed to start webhook handler:', error.message);
      process.exit(1);
    }
  }

  /**
   * Stop the webhook server gracefully
   */
  stop() {
    console.log('🛑 Stopping webhook handler...');
    process.exit(0);
  }
}

// CLI interface and server startup
async function main() {
  const command = process.argv[2] || 'start';

  switch (command) {
    case 'start':
      const handler = new WebhookHandler();
      
      // Graceful shutdown
      process.on('SIGINT', () => handler.stop());
      process.on('SIGTERM', () => handler.stop());
      
      await handler.start();
      break;

    case 'test':
      console.log('🧪 Testing webhook handler setup...');
      const testHandler = new WebhookHandler();
      console.log('✅ Webhook handler initialized successfully');
      break;

    default:
      console.log('Usage: node webhook-handler.js [start|test]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { WebhookHandler };

