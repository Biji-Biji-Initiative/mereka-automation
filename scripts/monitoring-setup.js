/**
 * AI Bug Router - Monitoring Setup
 * Sets up continuous monitoring and alerting
 */

const { AnalyticsEngine } = require('./analytics-engine');
const { DashboardGenerator } = require('./dashboard-generator');
const fs = require('fs').promises;
const path = require('path');

class MonitoringSetup {
  constructor() {
    this.analytics = new AnalyticsEngine();
    this.dashboard = new DashboardGenerator();
    this.configPath = path.join(__dirname, '..', 'config', 'monitoring.json');
  }

  /**
   * Initialize monitoring system
   */
  async setup() {
    console.log('⚙️ Setting up AI Bug Router monitoring system...\n');

    try {
      // Initialize components
      await this.analytics.initialize();
      await this.dashboard.initialize();

      // Create monitoring configuration
      const config = await this.createMonitoringConfig();
      
      // Run initial metrics collection
      console.log('📊 Collecting initial metrics...');
      await this.analytics.collectPerformanceMetrics();

      // Generate initial dashboards
      console.log('🎨 Generating initial dashboards...');
      await this.dashboard.generateDashboard();
      await this.dashboard.generateRealTimeDashboard();

      // Set up automated tasks
      await this.setupAutomatedTasks();

      console.log('\n✅ Monitoring system setup complete!');
      console.log('📊 Analytics: Collecting data every 24 hours');
      console.log('🎨 Dashboard: Auto-refreshing every 5 minutes');
      console.log('📈 Reports: Generated daily with insights');

      return config;

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  async createMonitoringConfig() {
    const config = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      monitoring: {
        enabled: true,
        dataRetentionDays: 30,
        collectInterval: '24h',
        alertThresholds: {
          openIssues: 20,
          routingAccuracy: 80,
          failureRate: 0.2
        }
      },
      dashboards: {
        enabled: true,
        autoRefresh: true,
        refreshInterval: '5m'
      },
      notifications: {
        slack: {
          enabled: true,
          channel: 'C02GDJUE8LW',
          dailyReport: true,
          alertsOnly: false
        },
        email: {
          enabled: false
        }
      },
      repositories: [
        'mereka-web',
        'mereka-web-ssr',
        'mereka-cloudfunctions',
        'mereka-automation'
      ],
      features: {
        aiRouting: true,
        codeowners: true,
        semanticSearch: true,
        autoFixGeneration: true,
        performanceTracking: true
      }
    };

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('⚙️ Monitoring configuration saved');
    
    return config;
  }

  async setupAutomatedTasks() {
    console.log('🤖 Setting up automated monitoring tasks...');

    // Create package.json for scripts if it doesn't exist
    const scriptsPackageJson = {
      "name": "ai-bug-router-scripts",
      "version": "1.0.0",
      "description": "AI Bug Router monitoring and analytics scripts",
      "main": "index.js",
      "scripts": {
        "collect-metrics": "node analytics-engine.js metrics",
        "generate-report": "node analytics-engine.js report",
        "update-dashboard": "node dashboard-generator.js generate",
        "monitor": "node monitoring-setup.js monitor",
        "health-check": "node health-check.js"
      },
      "dependencies": {
        "@octokit/rest": "^20.0.2",
        "node-fetch": "^3.3.2"
      }
    };

    const scriptsDir = path.join(__dirname);
    const packageJsonPath = path.join(scriptsDir, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      console.log('📦 Scripts package.json already exists');
    } catch {
      await fs.writeFile(packageJsonPath, JSON.stringify(scriptsPackageJson, null, 2), 'utf8');
      console.log('📦 Created scripts package.json');
    }

    // Create monitoring task script
    const monitoringScript = `#!/usr/bin/env node
/**
 * Continuous monitoring task
 */

const { AnalyticsEngine } = require('./analytics-engine');
const { DashboardGenerator } = require('./dashboard-generator');

async function runMonitoring() {
  console.log('🔄 Running monitoring cycle...');
  
  try {
    const analytics = new AnalyticsEngine();
    const dashboard = new DashboardGenerator();
    
    // Collect metrics
    await analytics.collectPerformanceMetrics();
    
    // Update dashboards
    await dashboard.generateDashboard();
    
    // Log success
    await analytics.logRoutingEvent({
      type: 'monitoring',
      success: true,
      action: 'daily-cycle-completed'
    });
    
    console.log('✅ Monitoring cycle completed successfully');
    
  } catch (error) {
    console.error('❌ Monitoring cycle failed:', error.message);
    
    // Log failure
    const analytics = new AnalyticsEngine();
    await analytics.logRoutingEvent({
      type: 'monitoring',
      success: false,
      action: 'daily-cycle-failed',
      error: error.message
    });
  }
}

if (require.main === module) {
  runMonitoring();
}

module.exports = { runMonitoring };
`;

    const monitoringScriptPath = path.join(scriptsDir, 'run-monitoring.js');
    await fs.writeFile(monitoringScriptPath, monitoringScript, 'utf8');
    console.log('📝 Created monitoring task script');
  }

  /**
   * Check system health and generate alerts
   */
  async checkSystemHealth() {
    console.log('🏥 Checking system health...');

    try {
      const metrics = await this.analytics.collectPerformanceMetrics();
      const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
      
      const alerts = [];
      
      // Check thresholds
      if (metrics.github.openIssues > config.monitoring.alertThresholds.openIssues) {
        alerts.push({
          level: 'warning',
          message: `High number of open issues: ${metrics.github.openIssues}`,
          recommendation: 'Consider prioritizing issue resolution'
        });
      }

      if (metrics.routing.accuracyScore < config.monitoring.alertThresholds.routingAccuracy) {
        alerts.push({
          level: 'warning',
          message: `Low routing accuracy: ${metrics.routing.accuracyScore}%`,
          recommendation: 'Review AI routing logic and training data'
        });
      }

      const failureRate = metrics.routing.totalRoutingEvents > 0 ? 
        (metrics.routing.failedRoutes / metrics.routing.totalRoutingEvents) : 0;
      
      if (failureRate > config.monitoring.alertThresholds.failureRate) {
        alerts.push({
          level: 'critical',
          message: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
          recommendation: 'Check system logs and investigate root causes'
        });
      }

      // Generate health report
      const healthReport = {
        timestamp: new Date().toISOString(),
        status: alerts.some(a => a.level === 'critical') ? 'critical' : 
                alerts.some(a => a.level === 'warning') ? 'warning' : 'healthy',
        alerts: alerts,
        metrics: metrics.summary,
        uptime: this.calculateUptime(),
        recommendations: alerts.map(a => a.recommendation)
      };

      // Save health report
      const healthPath = path.join(this.analytics.dataDir, 'health-report.json');
      await fs.writeFile(healthPath, JSON.stringify(healthReport, null, 2), 'utf8');

      console.log(`🏥 Health check complete: ${healthReport.status}`);
      if (alerts.length > 0) {
        console.log('🚨 Alerts detected:');
        alerts.forEach(alert => {
          console.log(`   ${alert.level.toUpperCase()}: ${alert.message}`);
        });
      }

      return healthReport;

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  calculateUptime() {
    // Simple uptime calculation based on when monitoring was set up
    try {
      const configData = require(this.configPath);
      const startTime = new Date(configData.createdAt);
      const now = new Date();
      const uptimeMs = now - startTime;
      const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
      return `${uptimeHours}h`;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Generate monitoring summary
   */
  async generateMonitoringSummary() {
    console.log('📋 Generating monitoring summary...');

    try {
      const metrics = await this.analytics.collectPerformanceMetrics();
      const healthReport = await this.checkSystemHealth();

      const summary = {
        title: '🤖 AI Bug Router - Monitoring Summary',
        generatedAt: new Date().toISOString(),
        period: 'Last 7 days',
        systemHealth: healthReport.status,
        keyMetrics: {
          totalIssues: metrics.github.totalIssues,
          routingAccuracy: metrics.routing.accuracyScore + '%',
          tasksCompleted: metrics.clickup.completedTasks,
          systemUptime: healthReport.uptime
        },
        insights: metrics.summary.keyInsights,
        alerts: healthReport.alerts,
        recommendations: healthReport.recommendations,
        nextSteps: [
          'Continue monitoring daily performance',
          'Review and optimize routing accuracy',
          'Address any critical alerts promptly',
          'Update team on system performance'
        ]
      };

      // Save summary
      const summaryPath = path.join(this.analytics.dataDir, 'monitoring-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

      console.log('📊 Monitoring summary generated');
      return summary;

    } catch (error) {
      console.error('❌ Failed to generate summary:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const monitoring = new MonitoringSetup();
  const command = process.argv[2] || 'setup';

  switch (command) {
    case 'setup':
      await monitoring.setup();
      break;

    case 'health':
      const health = await monitoring.checkSystemHealth();
      console.log('Health Status:', health.status);
      break;

    case 'summary':
      const summary = await monitoring.generateMonitoringSummary();
      console.log('Generated monitoring summary');
      break;

    case 'monitor':
      // Run continuous monitoring
      await monitoring.generateMonitoringSummary();
      break;

    default:
      console.log('Usage: node monitoring-setup.js [setup|health|summary|monitor]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MonitoringSetup };

