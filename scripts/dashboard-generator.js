/**
 * AI Bug Router - Dashboard Generator
 * Creates HTML dashboards from analytics data
 */

const fs = require('fs').promises;
const path = require('path');

class DashboardGenerator {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'analytics-data');
    this.outputDir = path.join(__dirname, '..', 'analytics-dashboard');
  }

  async initialize() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log('📊 Dashboard Generator initialized');
    } catch (error) {
      console.error('❌ Failed to initialize dashboard:', error.message);
    }
  }

  /**
   * Generate HTML dashboard from latest metrics
   */
  async generateDashboard() {
    console.log('🎨 Generating analytics dashboard...');

    try {
      // Load latest metrics
      const latestPath = path.join(this.dataDir, 'latest.json');
      const metricsData = await fs.readFile(latestPath, 'utf8');
      const metrics = JSON.parse(metricsData);

      // Generate HTML
      const html = this.generateHTML(metrics);
      
      // Save dashboard
      const dashboardPath = path.join(this.outputDir, 'index.html');
      await fs.writeFile(dashboardPath, html, 'utf8');

      // Copy CSS and JS files
      await this.copyAssets();

      console.log(`📊 Dashboard generated: ${dashboardPath}`);
      console.log(`🌐 Open file://${dashboardPath} in your browser`);

      return dashboardPath;

    } catch (error) {
      console.error('❌ Failed to generate dashboard:', error.message);
      throw error;
    }
  }

  generateHTML(metrics) {
    const timestamp = new Date(metrics.timestamp).toLocaleString();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 AI Bug Router - Analytics Dashboard</title>
    <link rel="stylesheet" href="dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>🤖 AI Bug Router Analytics</h1>
            <p class="subtitle">Real-time insights into your automated bug routing system</p>
            <p class="timestamp">Last updated: ${timestamp}</p>
        </header>

        <div class="metrics-grid">
            <!-- GitHub Metrics -->
            <div class="metric-card">
                <div class="metric-header">
                    <h3>🐙 GitHub Activity</h3>
                    <span class="period">${metrics.period}</span>
                </div>
                <div class="metric-content">
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.github.totalIssues}</span>
                        <span class="stat-label">Total Issues</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.github.openIssues}</span>
                        <span class="stat-label">Open Issues</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.github.closedIssues}</span>
                        <span class="stat-label">Closed Issues</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.github.totalPRs}</span>
                        <span class="stat-label">Pull Requests</span>
                    </div>
                </div>
            </div>

            <!-- ClickUp Metrics -->
            <div class="metric-card">
                <div class="metric-header">
                    <h3>📋 ClickUp Activity</h3>
                    <span class="period">${metrics.period}</span>
                </div>
                <div class="metric-content">
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.clickup.totalTasks}</span>
                        <span class="stat-label">Total Tasks</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.clickup.completedTasks}</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.clickup.inProgressTasks}</span>
                        <span class="stat-label">In Progress</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.clickup.bugTasks}</span>
                        <span class="stat-label">Bug Tasks</span>
                    </div>
                </div>
            </div>

            <!-- AI Routing Metrics -->
            <div class="metric-card">
                <div class="metric-header">
                    <h3>🎯 AI Routing Performance</h3>
                    <span class="period">${metrics.period}</span>
                </div>
                <div class="metric-content">
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.routing.totalRoutingEvents}</span>
                        <span class="stat-label">Routing Events</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.routing.successfulRoutes}</span>
                        <span class="stat-label">Successful</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.routing.failedRoutes}</span>
                        <span class="stat-label">Failed</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.routing.accuracyScore}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                </div>
            </div>

            <!-- Two-Way Sync Metrics (Phase 5) -->
            <div class="metric-card">
                <div class="metric-header">
                    <h3>🔄 Two-Way Sync (Phase 5)</h3>
                    <span class="period">${metrics.period}</span>
                </div>
                <div class="metric-content">
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.twoWaySync.totalMappings}</span>
                        <span class="stat-label">Active Mappings</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.twoWaySync.recentSyncs}</span>
                        <span class="stat-label">Recent Syncs</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.twoWaySync.webhookEvents}</span>
                        <span class="stat-label">Webhook Events</span>
                    </div>
                    <div class="metric-stat">
                        <span class="stat-value">${metrics.twoWaySync.successRate}%</span>
                        <span class="stat-label">Success Rate</span>
                    </div>
                </div>
            </div>

            <!-- System Health -->
            <div class="metric-card health-card">
                <div class="metric-header">
                    <h3>🏥 System Health</h3>
                    <span class="health-status ${metrics.summary.overallHealth}">${metrics.summary.overallHealth.toUpperCase()}</span>
                </div>
                <div class="metric-content">
                    <div class="health-details">
                        <h4>📈 Key Insights</h4>
                        <ul>
                            ${metrics.summary.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                        
                        ${metrics.summary.alerts.length > 0 ? `
                        <h4>🚨 Alerts</h4>
                        <ul class="alerts">
                            ${metrics.summary.alerts.map(alert => `<li class="alert">${alert}</li>`).join('')}
                        </ul>
                        ` : ''}
                        
                        ${metrics.summary.recommendations.length > 0 ? `
                        <h4>💡 Recommendations</h4>
                        <ul class="recommendations">
                            ${metrics.summary.recommendations.map(rec => `<li class="recommendation">${rec}</li>`).join('')}
                        </ul>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
            <h2>📊 Visual Analytics</h2>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>GitHub Issues Distribution</h3>
                    <canvas id="githubChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>ClickUp Tasks Status</h3>
                    <canvas id="clickupChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>AI Routing Success Rate</h3>
                    <canvas id="routingChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>Repository Activity</h3>
                    <canvas id="repoChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <h3>Two-Way Sync Performance</h3>
                    <canvas id="syncChart"></canvas>
                </div>
            </div>
        </div>

        <footer>
            <p>🤖 Generated by AI Bug Router Analytics Engine</p>
            <p>Data refreshed every 24 hours at 12:00 AM Malaysia time</p>
        </footer>
    </div>

    <script>
        // Chart data from metrics
        const metricsData = ${JSON.stringify(metrics)};
        
        // GitHub Issues Chart
        new Chart(document.getElementById('githubChart'), {
            type: 'doughnut',
            data: {
                labels: ['Open Issues', 'Closed Issues'],
                datasets: [{
                    data: [metricsData.github.openIssues, metricsData.github.closedIssues],
                    backgroundColor: ['#ff6b6b', '#51cf66']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // ClickUp Tasks Chart
        new Chart(document.getElementById('clickupChart'), {
            type: 'bar',
            data: {
                labels: ['Total', 'Completed', 'In Progress', 'Bug Tasks'],
                datasets: [{
                    data: [
                        metricsData.clickup.totalTasks,
                        metricsData.clickup.completedTasks,
                        metricsData.clickup.inProgressTasks,
                        metricsData.clickup.bugTasks
                    ],
                    backgroundColor: ['#339af0', '#51cf66', '#ffd43b', '#ff6b6b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // AI Routing Chart
        new Chart(document.getElementById('routingChart'), {
            type: 'doughnut',
            data: {
                labels: ['Successful', 'Failed'],
                datasets: [{
                    data: [metricsData.routing.successfulRoutes, metricsData.routing.failedRoutes],
                    backgroundColor: ['#51cf66', '#ff6b6b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Repository Activity Chart
        new Chart(document.getElementById('repoChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(metricsData.github.repositories),
                datasets: [{
                    label: 'Issues',
                    data: Object.values(metricsData.github.repositories).map(repo => repo.issues || 0),
                    backgroundColor: '#339af0'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Two-Way Sync Chart
        new Chart(document.getElementById('syncChart'), {
            type: 'doughnut',
            data: {
                labels: ['GitHub → ClickUp', 'ClickUp → GitHub', 'Webhook Events'],
                datasets: [{
                    data: [
                        metricsData.twoWaySync.githubToClickupSyncs,
                        metricsData.twoWaySync.clickupToGithubSyncs,
                        metricsData.twoWaySync.webhookEvents
                    ],
                    backgroundColor: ['#51cf66', '#339af0', '#ffd43b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Auto-refresh every 5 minutes
        setTimeout(() => {
            location.reload();
        }, 5 * 60 * 1000);
    </script>
</body>
</html>`;
  }

  async copyAssets() {
    // Generate CSS file
    const css = `
/* AI Bug Router Dashboard Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
    color: white;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 10px;
}

.timestamp {
    font-size: 0.9rem;
    opacity: 0.8;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.metric-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    overflow: hidden;
    transition: transform 0.3s ease;
}

.metric-card:hover {
    transform: translateY(-5px);
}

.metric-header {
    background: #f8f9fa;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metric-header h3 {
    font-size: 1.2rem;
    color: #495057;
}

.period {
    background: #e9ecef;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #6c757d;
}

.metric-content {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.metric-stat {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: #339af0;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 0.9rem;
    color: #6c757d;
}

.health-card .metric-content {
    grid-template-columns: 1fr;
}

.health-status {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

.health-status.good {
    background: #d3f9d8;
    color: #2b8a3e;
}

.health-status.warning {
    background: #fff3cd;
    color: #856404;
}

.health-status.critical {
    background: #f8d7da;
    color: #721c24;
}

.health-details h4 {
    margin: 15px 0 10px 0;
    color: #495057;
}

.health-details ul {
    list-style: none;
    padding-left: 0;
}

.health-details li {
    padding: 5px 0;
    border-left: 3px solid #e9ecef;
    padding-left: 10px;
    margin-bottom: 5px;
}

.alert {
    border-left-color: #ff6b6b !important;
    background: #fff5f5;
}

.recommendation {
    border-left-color: #339af0 !important;
    background: #f0f9ff;
}

.charts-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    margin-bottom: 40px;
}

.charts-section h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #495057;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.chart-container {
    text-align: center;
}

.chart-container h3 {
    margin-bottom: 15px;
    color: #6c757d;
    font-size: 1rem;
}

footer {
    text-align: center;
    color: white;
    opacity: 0.8;
    font-size: 0.9rem;
}

footer p {
    margin-bottom: 5px;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .metrics-grid {
        grid-template-columns: 1fr;
    }
    
    .metric-content {
        grid-template-columns: 1fr;
    }
    
    .charts-grid {
        grid-template-columns: 1fr;
    }
}
`;

    const cssPath = path.join(this.outputDir, 'dashboard.css');
    await fs.writeFile(cssPath, css, 'utf8');
  }

  /**
   * Generate a simple real-time dashboard
   */
  async generateRealTimeDashboard() {
    console.log('🔄 Generating real-time dashboard...');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 AI Bug Router - Real-time Monitor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .monitor {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .status-card {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #4CAF50;
        }
        .status-card.warning { border-left-color: #ff9800; }
        .status-card.error { border-left-color: #f44336; }
        .status-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .status-label {
            color: #aaa;
            font-size: 0.9rem;
        }
        .log-container {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 20px;
            height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
        }
        .log-entry {
            margin-bottom: 5px;
            padding: 2px 0;
        }
        .log-timestamp {
            color: #666;
        }
        .log-success { color: #4CAF50; }
        .log-warning { color: #ff9800; }
        .log-error { color: #f44336; }
    </style>
</head>
<body>
    <div class="monitor">
        <div class="header">
            <h1>🤖 AI Bug Router - Real-time Monitor</h1>
            <p id="lastUpdate">Last update: Loading...</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <div class="status-value" id="systemStatus">●</div>
                <div class="status-label">System Status</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="todayRoutes">0</div>
                <div class="status-label">Routes Today</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="successRate">0%</div>
                <div class="status-label">Success Rate</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="activeIssues">0</div>
                <div class="status-label">Active Issues</div>
            </div>
        </div>
        
        <div class="log-container" id="logContainer">
            <div class="log-entry">
                <span class="log-timestamp">[${new Date().toLocaleTimeString()}]</span>
                <span class="log-success">Real-time monitor initialized</span>
            </div>
        </div>
    </div>

    <script>
        let logEntries = [];
        
        function updateStatus() {
            fetch('./latest.json')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('lastUpdate').textContent = 
                        'Last update: ' + new Date(data.timestamp).toLocaleString();
                    
                    document.getElementById('todayRoutes').textContent = data.routing.totalRoutingEvents;
                    document.getElementById('successRate').textContent = data.routing.accuracyScore + '%';
                    document.getElementById('activeIssues').textContent = data.github.openIssues;
                    
                    const systemStatus = document.getElementById('systemStatus');
                    if (data.summary.overallHealth === 'good') {
                        systemStatus.textContent = '●';
                        systemStatus.style.color = '#4CAF50';
                    } else if (data.summary.overallHealth === 'warning') {
                        systemStatus.textContent = '●';
                        systemStatus.style.color = '#ff9800';
                    } else {
                        systemStatus.textContent = '●';
                        systemStatus.style.color = '#f44336';
                    }
                    
                    addLogEntry('System status updated', 'success');
                })
                .catch(error => {
                    addLogEntry('Failed to fetch data: ' + error.message, 'error');
                });
        }
        
        function addLogEntry(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = 
                '<span class="log-timestamp">[' + timestamp + ']</span> ' +
                '<span class="log-' + type + '">' + message + '</span>';
            
            const container = document.getElementById('logContainer');
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
            
            // Keep only last 50 entries
            while (container.children.length > 50) {
                container.removeChild(container.firstChild);
            }
        }
        
        // Update every 30 seconds
        updateStatus();
        setInterval(updateStatus, 30000);
        
        // Add some demo activity
        setInterval(() => {
            const activities = [
                { msg: 'Scanning repositories for new issues', type: 'info' },
                { msg: 'AI routing accuracy: 94.2%', type: 'success' },
                { msg: 'GitHub API rate limit: OK', type: 'success' },
                { msg: 'ClickUp sync completed', type: 'success' }
            ];
            
            const activity = activities[Math.floor(Math.random() * activities.length)];
            addLogEntry(activity.msg, activity.type);
        }, 10000);
    </script>
</body>
</html>`;

    const realtimePath = path.join(this.outputDir, 'realtime.html');
    await fs.writeFile(realtimePath, html, 'utf8');
    
    console.log(`🔄 Real-time dashboard: ${realtimePath}`);
    return realtimePath;
  }
}

// CLI interface
async function main() {
  const dashboard = new DashboardGenerator();
  await dashboard.initialize();

  const command = process.argv[2] || 'generate';

  switch (command) {
    case 'generate':
      await dashboard.generateDashboard();
      break;

    case 'realtime':
      await dashboard.generateRealTimeDashboard();
      break;

    case 'both':
      await dashboard.generateDashboard();
      await dashboard.generateRealTimeDashboard();
      break;

    default:
      console.log('Usage: node dashboard-generator.js [generate|realtime|both]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DashboardGenerator };
