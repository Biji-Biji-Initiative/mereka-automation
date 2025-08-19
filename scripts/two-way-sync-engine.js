/**
 * AI Bug Router - Two-Way Status Sync Engine
 * Implements bidirectional synchronization between GitHub and ClickUp
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

class TwoWaySyncEngine {
  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.clickupToken = process.env.CLICKUP_TOKEN;
    this.clickupTeamId = process.env.CLICKUP_TEAM_ID;
    this.slackToken = process.env.SLACK_BOT_TOKEN;
    this.owner = 'Biji-Biji-Initiative';
    this.repositories = [
      'mereka-web',
      'mereka-web-ssr', 
      'mereka-cloudfunctions',
      'mereka-automation'
    ];
    this.syncDataPath = path.join(__dirname, '..', 'analytics-data', 'sync-mappings.json');
    this.syncLogPath = path.join(__dirname, '..', 'analytics-data', 'sync-logs.json');
  }

  /**
   * Initialize the sync engine
   */
  async initialize() {
    console.log('🔄 Initializing Two-Way Sync Engine...');
    
    try {
      // Load existing sync mappings
      await this.loadSyncMappings();
      console.log('✅ Sync engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize sync engine:', error.message);
      throw error;
    }
  }

  /**
   * Load or create sync mappings file
   */
  async loadSyncMappings() {
    try {
      const data = await fs.readFile(this.syncDataPath, 'utf8');
      this.syncMappings = JSON.parse(data);
    } catch (error) {
      // Create empty mappings if file doesn't exist
      this.syncMappings = {
        githubToClickup: {},  // GitHub issue ID -> ClickUp task ID
        clickupToGithub: {},  // ClickUp task ID -> GitHub issue ID
        statusMappings: {
          github: {
            open: 'to do',
            closed: 'complete'
          },
          clickup: {
            'to do': 'open',
            'in progress': 'open',
            'complete': 'closed',
            'closed': 'closed'
          }
        },
        lastSync: null
      };
      await this.saveSyncMappings();
    }
  }

  /**
   * Save sync mappings to file
   */
  async saveSyncMappings() {
    await fs.writeFile(this.syncDataPath, JSON.stringify(this.syncMappings, null, 2), 'utf8');
  }

  /**
   * Log sync events for analytics
   */
  async logSyncEvent(event) {
    try {
      let logs = [];
      try {
        const data = await fs.readFile(this.syncLogPath, 'utf8');
        logs = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet
      }

      logs.push({
        timestamp: new Date().toISOString(),
        ...event
      });

      // Keep only last 1000 events
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      await fs.writeFile(this.syncLogPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Failed to log sync event:', error.message);
    }
  }

  /**
   * Create a mapping between GitHub issue and ClickUp task
   */
  async createMapping(githubIssueId, githubRepo, clickupTaskId) {
    const mappingKey = `${githubRepo}#${githubIssueId}`;
    
    this.syncMappings.githubToClickup[mappingKey] = clickupTaskId;
    this.syncMappings.clickupToGithub[clickupTaskId] = {
      issueId: githubIssueId,
      repo: githubRepo
    };

    await this.saveSyncMappings();
    
    await this.logSyncEvent({
      type: 'mapping_created',
      githubIssue: mappingKey,
      clickupTask: clickupTaskId,
      success: true
    });

    console.log(`🔗 Created mapping: ${mappingKey} ↔ ${clickupTaskId}`);
  }

  /**
   * Sync GitHub issues to ClickUp (GitHub → ClickUp)
   */
  async syncGitHubToClickUp() {
    console.log('📤 Syncing GitHub issues to ClickUp...');
    
    const syncResults = {
      processed: 0,
      synced: 0,
      errors: 0,
      details: []
    };

    for (const repo of this.repositories) {
      try {
        // Get recent GitHub issues
        const { data: issues } = await this.octokit.issues.listForRepo({
          owner: this.owner,
          repo: repo,
          state: 'all',
          since: this.getLastSyncTime(),
          per_page: 50
        });

        for (const issue of issues) {
          syncResults.processed++;
          
          try {
            const mappingKey = `${repo}#${issue.number}`;
            const clickupTaskId = this.syncMappings.githubToClickup[mappingKey];

            if (clickupTaskId) {
              // Update existing ClickUp task
              const syncResult = await this.updateClickUpTaskFromGitHub(clickupTaskId, issue);
              if (syncResult.success) {
                syncResults.synced++;
                syncResults.details.push({
                  action: 'updated',
                  github: mappingKey,
                  clickup: clickupTaskId,
                  status: issue.state
                });
              }
            } else if (this.shouldCreateClickUpTask(issue)) {
              // Create new ClickUp task for GitHub issue
              const taskResult = await this.createClickUpTaskFromGitHub(issue, repo);
              if (taskResult.success) {
                await this.createMapping(issue.number, repo, taskResult.taskId);
                syncResults.synced++;
                syncResults.details.push({
                  action: 'created',
                  github: mappingKey,
                  clickup: taskResult.taskId,
                  status: issue.state
                });
              }
            }

          } catch (itemError) {
            syncResults.errors++;
            console.error(`❌ Error syncing ${repo}#${issue.number}:`, itemError.message);
          }
        }

      } catch (repoError) {
        console.error(`❌ Error processing repository ${repo}:`, repoError.message);
        syncResults.errors++;
      }
    }

    await this.logSyncEvent({
      type: 'github_to_clickup_sync',
      ...syncResults,
      success: syncResults.errors === 0
    });

    console.log(`📤 GitHub→ClickUp sync complete: ${syncResults.synced}/${syncResults.processed} synced`);
    return syncResults;
  }

  /**
   * Sync ClickUp tasks to GitHub (ClickUp → GitHub)
   */
  async syncClickUpToGitHub() {
    console.log('📥 Syncing ClickUp tasks to GitHub...');
    
    const syncResults = {
      processed: 0,
      synced: 0,
      errors: 0,
      details: []
    };

    try {
      // Get recent ClickUp tasks
      const response = await fetch(`https://api.clickup.com/api/v2/team/${this.clickupTeamId}/task`, {
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const recentTasks = data.tasks?.filter(task => 
          new Date(task.date_updated || task.date_created).getTime() >= this.getLastSyncTime()
        ) || [];

        for (const task of recentTasks) {
          syncResults.processed++;

          try {
            const githubMapping = this.syncMappings.clickupToGithub[task.id];
            
            if (githubMapping) {
              // Update existing GitHub issue
              const syncResult = await this.updateGitHubIssueFromClickUp(
                githubMapping.repo, 
                githubMapping.issueId, 
                task
              );
              
              if (syncResult.success) {
                syncResults.synced++;
                syncResults.details.push({
                  action: 'updated',
                  clickup: task.id,
                  github: `${githubMapping.repo}#${githubMapping.issueId}`,
                  status: task.status?.status
                });
              }
            }

          } catch (itemError) {
            syncResults.errors++;
            console.error(`❌ Error syncing ClickUp task ${task.id}:`, itemError.message);
          }
        }

      } else {
        throw new Error(`ClickUp API error: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Error fetching ClickUp tasks:', error.message);
      syncResults.errors++;
    }

    await this.logSyncEvent({
      type: 'clickup_to_github_sync',
      ...syncResults,
      success: syncResults.errors === 0
    });

    console.log(`📥 ClickUp→GitHub sync complete: ${syncResults.synced}/${syncResults.processed} synced`);
    return syncResults;
  }

  /**
   * Update ClickUp task based on GitHub issue changes
   */
  async updateClickUpTaskFromGitHub(clickupTaskId, githubIssue) {
    try {
      const clickupStatus = this.syncMappings.statusMappings.github[githubIssue.state];
      
      const updateData = {
        name: githubIssue.title,
        description: this.formatGitHubDescription(githubIssue),
        status: clickupStatus
      };

      const response = await fetch(`https://api.clickup.com/api/v2/task/${clickupTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        console.log(`✅ Updated ClickUp task ${clickupTaskId} from GitHub issue`);
        return { success: true };
      } else {
        throw new Error(`ClickUp API error: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Failed to update ClickUp task ${clickupTaskId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update GitHub issue based on ClickUp task changes
   */
  async updateGitHubIssueFromClickUp(repo, issueNumber, clickupTask) {
    try {
      const githubState = this.syncMappings.statusMappings.clickup[clickupTask.status?.status];
      
      if (!githubState) {
        // Unknown status, skip update
        return { success: true, skipped: true };
      }

      // Update GitHub issue
      await this.octokit.issues.update({
        owner: this.owner,
        repo: repo,
        issue_number: issueNumber,
        state: githubState,
        title: clickupTask.name || undefined
      });

      // Add comment about ClickUp sync
      await this.octokit.issues.createComment({
        owner: this.owner,
        repo: repo,
        issue_number: issueNumber,
        body: `🔄 **Status synced from ClickUp**\n\n` +
              `ClickUp Status: \`${clickupTask.status?.status}\` → GitHub Status: \`${githubState}\`\n` +
              `Updated automatically by AI Bug Router`
      });

      console.log(`✅ Updated GitHub issue ${repo}#${issueNumber} from ClickUp task`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to update GitHub issue ${repo}#${issueNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create ClickUp task from GitHub issue
   */
  async createClickUpTaskFromGitHub(githubIssue, repo) {
    try {
      const taskData = {
        name: `[${repo}] ${githubIssue.title}`,
        description: this.formatGitHubDescription(githubIssue),
        status: this.syncMappings.statusMappings.github[githubIssue.state],
        priority: this.getIssuePriority(githubIssue),
        tags: this.getIssueTags(githubIssue, repo),
        custom_fields: [
          {
            id: 'github_issue_url',
            value: githubIssue.html_url
          },
          {
            id: 'github_repo',
            value: repo
          },
          {
            id: 'github_issue_number',
            value: githubIssue.number.toString()
          }
        ]
      };

      // Get the main bug list ID
      const listId = process.env.CLICKUP_LIST_ID || '900501824745';

      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created ClickUp task ${result.id} from GitHub issue ${repo}#${githubIssue.number}`);
        return { success: true, taskId: result.id };
      } else {
        throw new Error(`ClickUp API error: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Failed to create ClickUp task from GitHub issue:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format GitHub issue description for ClickUp
   */
  formatGitHubDescription(issue) {
    return `🐙 **GitHub Issue Sync**

**Repository**: ${issue.repository?.name || 'Unknown'}
**Issue Number**: #${issue.number}
**Created**: ${new Date(issue.created_at).toLocaleDateString()}
**Author**: ${issue.user?.login}

**Description**:
${issue.body || 'No description provided'}

**GitHub URL**: ${issue.html_url}

---
*Automatically synced from GitHub by AI Bug Router*`;
  }

  /**
   * Determine if GitHub issue should create ClickUp task
   */
  shouldCreateClickUpTask(issue) {
    // Only create ClickUp tasks for:
    // 1. Issues with specific labels (bug, enhancement, etc.)
    // 2. Issues that are not pull requests
    // 3. Issues that are recent (within last 30 days)
    
    if (issue.pull_request) {
      return false; // Skip pull requests
    }

    const relevantLabels = ['bug', 'enhancement', 'feature', 'issue', 'priority'];
    const hasRelevantLabel = issue.labels?.some(label => 
      relevantLabels.some(relevant => 
        label.name.toLowerCase().includes(relevant)
      )
    );

    const isRecent = new Date(issue.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return hasRelevantLabel || isRecent;
  }

  /**
   * Get issue priority for ClickUp
   */
  getIssuePriority(issue) {
    const labels = issue.labels?.map(l => l.name.toLowerCase()) || [];
    
    if (labels.some(l => l.includes('critical') || l.includes('urgent'))) {
      return 1; // Urgent
    } else if (labels.some(l => l.includes('high') || l.includes('important'))) {
      return 2; // High  
    } else if (labels.some(l => l.includes('low'))) {
      return 4; // Low
    }
    
    return 3; // Normal
  }

  /**
   * Get issue tags for ClickUp
   */
  getIssueTags(issue, repo) {
    const tags = [repo, 'github-sync'];
    
    // Add label-based tags
    if (issue.labels) {
      issue.labels.forEach(label => {
        tags.push(label.name.toLowerCase());
      });
    }

    return tags;
  }

  /**
   * Get last sync time (24 hours ago if no previous sync)
   */
  getLastSyncTime() {
    if (this.syncMappings.lastSync) {
      return this.syncMappings.lastSync;
    }
    
    // Default to 24 hours ago for first sync in ISO 8601 format
    const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    return twentyFourHoursAgo.toISOString();
  }

  /**
   * Run complete bidirectional sync
   */
  async runFullSync() {
    console.log('🔄 Starting full bidirectional sync...\n');
    
    try {
      const startTime = Date.now();
      
      // Run both sync directions
      const githubResults = await this.syncGitHubToClickUp();
      const clickupResults = await this.syncClickUpToGitHub();
      
      // Update last sync time
      this.syncMappings.lastSync = new Date().toISOString();
      await this.saveSyncMappings();
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      const summary = {
        duration: `${duration}s`,
        githubToClickup: {
          processed: githubResults.processed,
          synced: githubResults.synced,
          errors: githubResults.errors
        },
        clickupToGithub: {
          processed: clickupResults.processed,
          synced: clickupResults.synced,
          errors: clickupResults.errors
        },
        totalSynced: githubResults.synced + clickupResults.synced,
        totalErrors: githubResults.errors + clickupResults.errors
      };

      await this.logSyncEvent({
        type: 'full_bidirectional_sync',
        ...summary,
        success: summary.totalErrors === 0
      });

      console.log('\n✅ Full bidirectional sync completed!');
      console.log(`📊 Summary: ${summary.totalSynced} items synced in ${summary.duration}`);
      
      // Send notification to Slack if configured
      await this.sendSyncNotification(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ Full sync failed:', error.message);
      
      await this.logSyncEvent({
        type: 'full_bidirectional_sync',
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Send sync notification to Slack
   */
  async sendSyncNotification(summary) {
    if (!this.slackToken) {
      return; // Skip if no Slack token
    }

    try {
      const message = {
        channel: 'C02GDJUE8LW',
        text: `🔄 Two-Way Sync Complete`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔄 GitHub ↔ ClickUp Sync Report'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Duration:* ${summary.duration}`
              },
              {
                type: 'mrkdwn',
                text: `*Total Synced:* ${summary.totalSynced} items`
              },
              {
                type: 'mrkdwn',
                text: `*GitHub → ClickUp:* ${summary.githubToClickup.synced}/${summary.githubToClickup.processed}`
              },
              {
                type: 'mrkdwn',
                text: `*ClickUp → GitHub:* ${summary.clickupToGithub.synced}/${summary.clickupToGithub.processed}`
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${summary.totalErrors === 0 ? '✅ All syncs successful' : `⚠️ ${summary.totalErrors} errors occurred`}`
              }
            ]
          }
        ]
      };

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.slackToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        console.log('📢 Sync notification sent to Slack');
      }

    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    try {
      const logs = JSON.parse(await fs.readFile(this.syncLogPath, 'utf8'));
      const last24h = logs.filter(log => 
        new Date(log.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
      );

      return {
        totalMappings: Object.keys(this.syncMappings.githubToClickup).length,
        last24hSyncs: last24h.length,
        successRate: last24h.length > 0 ? 
          (last24h.filter(log => log.success).length / last24h.length * 100).toFixed(1) + '%' : 
          'N/A',
        lastSync: this.syncMappings.lastSync
      };

    } catch (error) {
      return {
        totalMappings: 0,
        last24hSyncs: 0,
        successRate: 'N/A',
        lastSync: null
      };
    }
  }
}

// CLI interface
async function main() {
  const syncEngine = new TwoWaySyncEngine();
  await syncEngine.initialize();

  const command = process.argv[2] || 'sync';

  switch (command) {
    case 'sync':
      await syncEngine.runFullSync();
      break;

    case 'github-to-clickup':
      await syncEngine.syncGitHubToClickUp();
      break;

    case 'clickup-to-github':
      await syncEngine.syncClickUpToGitHub();
      break;

    case 'stats':
      const stats = await syncEngine.getSyncStats();
      console.log('📊 Sync Statistics:', JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('Usage: node two-way-sync-engine.js [sync|github-to-clickup|clickup-to-github|stats]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TwoWaySyncEngine };
