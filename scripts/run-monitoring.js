#!/usr/bin/env node
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
