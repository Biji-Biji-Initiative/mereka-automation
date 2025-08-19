/**
 * AI Bug Router - Analytics Engine
 * Monitors system performance and generates insights
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsEngine {
  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.clickupToken = process.env.CLICKUP_TOKEN;
    this.slackToken = process.env.SLACK_BOT_TOKEN;
    this.dataDir = path.join(__dirname, '..', 'analytics-data');
    this.repositories = [
      'mereka-web',
      'mereka-web-ssr', 
      'mereka-cloudfunctions',
      'mereka-automation'
    ];
    this.owner = 'Biji-Biji-Initiative';
  }

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('📊 Analytics Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error.message);
    }
  }

  /**
   * Collect performance metrics from the last 7 days
   */
  async collectPerformanceMetrics() {
    console.log('📈 Collecting system performance metrics...');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      period: '7d',
      github: {},
      clickup: {},
      slack: {},
      routing: {},
      summary: {}
    };

    // GitHub metrics
    metrics.github = await this.collectGitHubMetrics();
    
    // ClickUp metrics
    metrics.clickup = await this.collectClickUpMetrics();
    
    // Slack metrics (if available)
    metrics.slack = await this.collectSlackMetrics();
    
    // AI Routing metrics
    metrics.routing = await this.collectRoutingMetrics();
    
    // Two-way sync metrics (Phase 5)
    metrics.twoWaySync = await this.collectTwoWaySyncMetrics();
    
    // Generate summary
    metrics.summary = this.generateSummary(metrics);

    // Save metrics
    await this.saveMetrics(metrics);
    
    return metrics;
  }

  async collectGitHubMetrics() {
    console.log('🐙 Analyzing GitHub activity...');
    
    const metrics = {
      totalIssues: 0,
      openIssues: 0,
      closedIssues: 0,
      totalPRs: 0,
      mergedPRs: 0,
      avgCloseTime: 0,
      repositories: {}
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const repo of this.repositories) {
      try {
        // Get recent issues
        const { data: issues } = await this.octokit.issues.listForRepo({
          owner: this.owner,
          repo: repo,
          state: 'all',
          since: sevenDaysAgo.toISOString(),
          per_page: 100
        });

        // Get recent PRs
        const { data: prs } = await this.octokit.pulls.list({
          owner: this.owner,
          repo: repo,
          state: 'all',
          per_page: 100
        });

        const recentPRs = prs.filter(pr => new Date(pr.created_at) >= sevenDaysAgo);

        metrics.repositories[repo] = {
          issues: issues.length,
          openIssues: issues.filter(i => i.state === 'open').length,
          closedIssues: issues.filter(i => i.state === 'closed').length,
          prs: recentPRs.length,
          mergedPRs: recentPRs.filter(pr => pr.merged_at).length
        };

        metrics.totalIssues += issues.length;
        metrics.openIssues += metrics.repositories[repo].openIssues;
        metrics.closedIssues += metrics.repositories[repo].closedIssues;
        metrics.totalPRs += recentPRs.length;
        metrics.mergedPRs += metrics.repositories[repo].mergedPRs;

      } catch (error) {
        console.log(`⚠️ Could not collect metrics for ${repo}: ${error.message}`);
        metrics.repositories[repo] = { error: error.message };
      }
    }

    return metrics;
  }

  async collectClickUpMetrics() {
    console.log('📋 Analyzing ClickUp activity...');
    
    const metrics = {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      bugTasks: 0,
      avgCompletionTime: 0
    };

    try {
      // Get team tasks from last 7 days
      const response = await fetch(`https://api.clickup.com/api/v2/team/${process.env.CLICKUP_TEAM_ID}/task`, {
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentTasks = data.tasks?.filter(task => 
          new Date(task.date_created).getTime() >= sevenDaysAgo
        ) || [];

        metrics.totalTasks = recentTasks.length;
        metrics.completedTasks = recentTasks.filter(t => t.status?.status === 'complete').length;
        metrics.inProgressTasks = recentTasks.filter(t => t.status?.status === 'in progress').length;
        metrics.bugTasks = recentTasks.filter(t => 
          t.name?.toLowerCase().includes('[issue]') || 
          t.name?.toLowerCase().includes('bug')
        ).length;

      } else {
        console.log('⚠️ Could not fetch ClickUp metrics');
      }

    } catch (error) {
      console.log(`⚠️ ClickUp metrics error: ${error.message}`);
    }

    return metrics;
  }

  async collectSlackMetrics() {
    console.log('💬 Analyzing Slack activity...');
    
    const metrics = {
      sosReactions: 0,
      messagesProcessed: 0,
      channelActivity: {}
    };

    try {
      // This would require Slack API integration
      // For now, we'll track what we can from other sources
      metrics.note = 'Slack metrics require additional API setup';
    } catch (error) {
      console.log(`⚠️ Slack metrics error: ${error.message}`);
    }

    return metrics;
  }

  async collectRoutingMetrics() {
    console.log('🎯 Analyzing AI routing performance...');
    
    const metrics = {
      totalRoutingEvents: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      avgRoutingTime: 0,
      accuracyScore: 0
    };

    try {
      // Check for routing logs
      const logsPath = path.join(this.dataDir, 'routing-logs.json');
      
      try {
        const logsData = await fs.readFile(logsPath, 'utf8');
        const logs = JSON.parse(logsData);
        
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentLogs = logs.filter(log => 
          new Date(log.timestamp).getTime() >= sevenDaysAgo
        );

        metrics.totalRoutingEvents = recentLogs.length;
        metrics.successfulRoutes = recentLogs.filter(log => log.success).length;
        metrics.failedRoutes = recentLogs.filter(log => !log.success).length;
        
        if (metrics.totalRoutingEvents > 0) {
          metrics.accuracyScore = (metrics.successfulRoutes / metrics.totalRoutingEvents * 100).toFixed(1);
        }

      } catch (fileError) {
        // No logs file yet, create empty structure
        await fs.writeFile(logsPath, JSON.stringify([]), 'utf8');
      }

    } catch (error) {
      console.log(`⚠️ Routing metrics error: ${error.message}`);
    }

    return metrics;
  }

  async collectTwoWaySyncMetrics() {
    console.log('🔄 Analyzing two-way sync performance...');
    
    const metrics = {
      totalMappings: 0,
      recentSyncs: 0,
      githubToClickupSyncs: 0,
      clickupToGithubSyncs: 0,
      successRate: 0,
      lastSyncTime: null,
      webhookEvents: 0
    };

    try {
      // Check for sync mappings
      const syncMappingsPath = path.join(this.dataDir, 'sync-mappings.json');
      
      try {
        const mappingsData = await fs.readFile(syncMappingsPath, 'utf8');
        const mappings = JSON.parse(mappingsData);
        
        metrics.totalMappings = Object.keys(mappings.githubToClickup || {}).length;
        metrics.lastSyncTime = mappings.lastSync;
        
      } catch (fileError) {
        // No mappings file yet
      }

      // Check for sync logs
      const syncLogsPath = path.join(this.dataDir, 'sync-logs.json');
      
      try {
        const logsData = await fs.readFile(syncLogsPath, 'utf8');
        const logs = JSON.parse(logsData);
        
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentLogs = logs.filter(log => 
          new Date(log.timestamp).getTime() >= sevenDaysAgo
        );

        metrics.recentSyncs = recentLogs.length;
        metrics.githubToClickupSyncs = recentLogs.filter(log => 
          log.direction === 'github_to_clickup'
        ).length;
        metrics.clickupToGithubSyncs = recentLogs.filter(log => 
          log.direction === 'clickup_to_github'
        ).length;
        metrics.webhookEvents = recentLogs.filter(log => 
          log.trigger === 'webhook'
        ).length;
        
        if (recentLogs.length > 0) {
          const successfulSyncs = recentLogs.filter(log => log.success).length;
          metrics.successRate = (successfulSyncs / recentLogs.length * 100).toFixed(1);
        }

      } catch (fileError) {
        // No logs file yet, create empty structure
        await fs.writeFile(syncLogsPath, JSON.stringify([]), 'utf8');
      }

    } catch (error) {
      console.log(`⚠️ Two-way sync metrics error: ${error.message}`);
    }

    return metrics;
  }

  generateSummary(metrics) {
    const summary = {
      overallHealth: 'good',
      keyInsights: [],
      recommendations: [],
      alerts: []
    };

    // Generate insights based on metrics
    if (metrics.github.totalIssues > 0) {
      const issueResolutionRate = (metrics.github.closedIssues / metrics.github.totalIssues * 100).toFixed(1);
      summary.keyInsights.push(`Issue resolution rate: ${issueResolutionRate}%`);
    }

    if (metrics.github.totalPRs > 0) {
      const prMergeRate = (metrics.github.mergedPRs / metrics.github.totalPRs * 100).toFixed(1);
      summary.keyInsights.push(`PR merge rate: ${prMergeRate}%`);
    }

    if (metrics.clickup.totalTasks > 0) {
      const taskCompletionRate = (metrics.clickup.completedTasks / metrics.clickup.totalTasks * 100).toFixed(1);
      summary.keyInsights.push(`Task completion rate: ${taskCompletionRate}%`);
    }

    if (metrics.twoWaySync.totalMappings > 0) {
      summary.keyInsights.push(`Two-way sync mappings: ${metrics.twoWaySync.totalMappings} active`);
      summary.keyInsights.push(`Sync success rate: ${metrics.twoWaySync.successRate}%`);
    }

    // Generate recommendations
    if (metrics.github.openIssues > 10) {
      summary.recommendations.push('Consider prioritizing issue resolution - high open issue count');
    }

    if (metrics.routing.accuracyScore < 80) {
      summary.recommendations.push('AI routing accuracy could be improved - review routing logic');
    }

    // Generate alerts
    if (metrics.github.openIssues > 20) {
      summary.alerts.push('High number of open issues detected');
    }

    if (metrics.routing.failedRoutes > metrics.routing.successfulRoutes) {
      summary.alerts.push('Routing failure rate is concerning');
    }

    return summary;
  }

  async saveMetrics(metrics) {
    const filename = `metrics-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(metrics, null, 2), 'utf8');
    console.log(`💾 Metrics saved to ${filename}`);

    // Also save to latest.json for easy access
    const latestPath = path.join(this.dataDir, 'latest.json');
    await fs.writeFile(latestPath, JSON.stringify(metrics, null, 2), 'utf8');
    
    return filepath;
  }

  /**
   * Generate a performance report
   */
  async generatePerformanceReport() {
    console.log('📊 Generating performance report...');
    
    const metrics = await this.collectPerformanceMetrics();
    
    const report = {
      title: '🤖 AI Bug Router - Weekly Performance Report',
      generatedAt: new Date().toISOString(),
      period: 'Last 7 days',
      metrics: metrics,
      recommendations: this.generateRecommendations(metrics)
    };

    // Save report
    const reportFilename = `report-${new Date().toISOString().split('T')[0]}.json`;
    const reportPath = path.join(this.dataDir, reportFilename);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const mdPath = path.join(this.dataDir, `report-${new Date().toISOString().split('T')[0]}.md`);
    await fs.writeFile(mdPath, markdownReport, 'utf8');

    console.log(`📋 Performance report generated: ${reportFilename}`);
    return report;
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    // GitHub recommendations
    if (metrics.github.openIssues > metrics.github.closedIssues) {
      recommendations.push({
        category: 'GitHub',
        priority: 'high',
        message: 'More issues are being opened than closed. Consider increasing issue resolution efforts.',
        action: 'Review open issues and prioritize critical ones'
      });
    }

    // ClickUp recommendations
    if (metrics.clickup.inProgressTasks > metrics.clickup.completedTasks) {
      recommendations.push({
        category: 'ClickUp',
        priority: 'medium',
        message: 'Many tasks are in progress but not being completed.',
        action: 'Review task assignments and completion workflows'
      });
    }

    // Routing recommendations
    if (metrics.routing.accuracyScore < 85) {
      recommendations.push({
        category: 'AI Routing',
        priority: 'medium',
        message: 'AI routing accuracy could be improved.',
        action: 'Review routing logic and train with more examples'
      });
    }

    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# ${report.title}

**Generated**: ${new Date(report.generatedAt).toLocaleString()}  
**Period**: ${report.period}

## 📊 Key Metrics

### GitHub Activity
- **Total Issues**: ${report.metrics.github.totalIssues}
- **Open Issues**: ${report.metrics.github.openIssues}
- **Closed Issues**: ${report.metrics.github.closedIssues}
- **Total PRs**: ${report.metrics.github.totalPRs}
- **Merged PRs**: ${report.metrics.github.mergedPRs}

### ClickUp Activity
- **Total Tasks**: ${report.metrics.clickup.totalTasks}
- **Completed Tasks**: ${report.metrics.clickup.completedTasks}
- **In Progress**: ${report.metrics.clickup.inProgressTasks}
- **Bug Tasks**: ${report.metrics.clickup.bugTasks}

### AI Routing Performance
- **Total Routing Events**: ${report.metrics.routing.totalRoutingEvents}
- **Successful Routes**: ${report.metrics.routing.successfulRoutes}
- **Failed Routes**: ${report.metrics.routing.failedRoutes}
- **Accuracy Score**: ${report.metrics.routing.accuracyScore}%

## 💡 Key Insights

${report.metrics.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

## 🎯 Recommendations

${report.recommendations.map(rec => 
  `### ${rec.category} (${rec.priority.toUpperCase()})
**Issue**: ${rec.message}  
**Action**: ${rec.action}`
).join('\n\n')}

## 🚨 Alerts

${report.metrics.summary.alerts.map(alert => `- ⚠️ ${alert}`).join('\n') || 'No alerts detected'}

---
*Report generated by AI Bug Router Analytics Engine*
`;
  }

  /**
   * Log a routing event for analytics
   */
  async logRoutingEvent(event) {
    try {
      const logsPath = path.join(this.dataDir, 'routing-logs.json');
      
      let logs = [];
      try {
        const logsData = await fs.readFile(logsPath, 'utf8');
        logs = JSON.parse(logsData);
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

      await fs.writeFile(logsPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Failed to log routing event:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const analytics = new AnalyticsEngine();
  await analytics.initialize();

  const command = process.argv[2] || 'report';

  switch (command) {
    case 'metrics':
      const metrics = await analytics.collectPerformanceMetrics();
      console.log('📊 Current Metrics:', JSON.stringify(metrics.summary, null, 2));
      break;

    case 'report':
      const report = await analytics.generatePerformanceReport();
      console.log('📋 Report generated successfully');
      console.log('📄 Key insights:', report.metrics.summary.keyInsights.join(', '));
      break;

    case 'log':
      // Example: node analytics-engine.js log '{"type":"routing","success":true,"duration":1200}'
      const eventData = JSON.parse(process.argv[3] || '{}');
      await analytics.logRoutingEvent(eventData);
      console.log('📝 Event logged successfully');
      break;

    default:
      console.log('Usage: node analytics-engine.js [metrics|report|log]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AnalyticsEngine };
