const { Octokit } = require('@octokit/rest');
const axios = require('axios');

// Initialize clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const ORG = 'Biji-Biji-Initiative';
const REPOSITORIES = ['mereka-web', 'mereka-web-ssr', 'mereka-cloudfunctions', 'Fadlan-Personal'];
const CLOUD_FUNCTION_URL = 'https://us-central1-mereka-dev.cloudfunctions.net/bugReportPipeline';

/**
 * Check Cloud Function health
 */
async function checkCloudFunction() {
  try {
    console.log('🔍 Checking Cloud Function health...');
    
    const response = await axios.get(CLOUD_FUNCTION_URL, {
      timeout: 10000
    });
    
    const isHealthy = response.status === 200 && response.data.status;
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    
    return {
      healthy: isHealthy,
      status: response.status,
      response: response.data,
      responseTime: response.headers['x-response-time'] || 'unknown'
    };
    
  } catch (error) {
    console.error(`   ❌ Cloud Function health check failed:`, error.message);
    return {
      healthy: false,
      error: error.message,
      status: error.response?.status || 'unknown'
    };
  }
}

/**
 * Check GitHub API access and repository permissions
 */
async function checkGitHubAccess() {
  try {
    console.log('🔍 Checking GitHub API access...');
    
    // Check API authentication
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`   ✅ Authenticated as: ${user.login}`);
    
    // Check rate limits
    const { data: rateLimit } = await octokit.rateLimit.get();
    const remaining = rateLimit.rate.remaining;
    const total = rateLimit.rate.limit;
    
    console.log(`   📊 Rate limit: ${remaining}/${total} remaining`);
    
    // Check repository access
    const repoAccess = [];
    
    for (const repo of REPOSITORIES) {
      try {
        const { data: repoData } = await octokit.repos.get({
          owner: ORG,
          repo: repo
        });
        
        repoAccess.push({
          repo: repo,
          accessible: true,
          permissions: repoData.permissions || {}
        });
        
        console.log(`   ✅ ${ORG}/${repo}: Accessible`);
        
      } catch (error) {
        repoAccess.push({
          repo: repo,
          accessible: false,
          error: error.message
        });
        
        console.log(`   ❌ ${ORG}/${repo}: ${error.message}`);
      }
    }
    
    return {
      healthy: true,
      user: user.login,
      rateLimit: {
        remaining: remaining,
        total: total,
        resetTime: new Date(rateLimit.rate.reset * 1000).toISOString()
      },
      repositories: repoAccess
    };
    
  } catch (error) {
    console.error(`   ❌ GitHub access check failed:`, error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Check OpenAI API access
 */
async function checkOpenAI() {
  try {
    console.log('🔍 Checking OpenAI API access...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      timeout: 10000
    });
    
    const models = response.data.data || [];
    const hasGPT4 = models.some(model => model.id.includes('gpt-4'));
    
    console.log(`   ✅ API accessible`);
    console.log(`   📊 Available models: ${models.length}`);
    console.log(`   🤖 GPT-4 available: ${hasGPT4 ? 'Yes' : 'No'}`);
    
    return {
      healthy: true,
      modelsCount: models.length,
      hasGPT4: hasGPT4,
      models: models.slice(0, 5).map(m => m.id) // First 5 models
    };
    
  } catch (error) {
    console.error(`   ❌ OpenAI API check failed:`, error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Check ClickUp API access
 */
async function checkClickUp() {
  try {
    console.log('🔍 Checking ClickUp API access...');
    
    if (!process.env.CLICKUP_TOKEN) {
      throw new Error('CLICKUP_TOKEN environment variable not set');
    }
    
    const response = await axios.get('https://api.clickup.com/api/v2/user', {
      headers: {
        'Authorization': process.env.CLICKUP_TOKEN
      },
      timeout: 10000
    });
    
    const user = response.data.user;
    
    console.log(`   ✅ Authenticated as: ${user.username}`);
    console.log(`   📧 Email: ${user.email}`);
    
    // Check list access
    const listId = process.env.CLICKUP_LIST_ID;
    if (listId) {
      try {
        const listResponse = await axios.get(`https://api.clickup.com/api/v2/list/${listId}`, {
          headers: {
            'Authorization': process.env.CLICKUP_TOKEN
          }
        });
        
        console.log(`   ✅ List access: ${listResponse.data.name}`);
        
      } catch (listError) {
        console.log(`   ⚠️  List access: ${listError.message}`);
      }
    }
    
    return {
      healthy: true,
      user: {
        username: user.username,
        email: user.email
      },
      listAccess: !!listId
    };
    
  } catch (error) {
    console.error(`   ❌ ClickUp API check failed:`, error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Run comprehensive health check
 */
async function runHealthCheck() {
  console.log('🏥 Starting system health check...\n');
  
  const startTime = Date.now();
  
  // Run all checks
  const [cloudFunction, github, openai, clickup] = await Promise.all([
    checkCloudFunction(),
    checkGitHubAccess(),
    checkOpenAI(),
    checkClickUp()
  ]);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Generate health report
  const healthReport = {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    overall: {
      healthy: cloudFunction.healthy && github.healthy && openai.healthy && clickup.healthy,
      services: {
        cloudFunction: cloudFunction.healthy,
        github: github.healthy,
        openai: openai.healthy,
        clickup: clickup.healthy
      }
    },
    details: {
      cloudFunction,
      github,
      openai,
      clickup
    }
  };
  
  // Save report
  const fs = require('fs').promises;
  await fs.writeFile('health-report.json', JSON.stringify(healthReport, null, 2));
  
  // Summary
  console.log(`\n📊 Health Check Summary:`);
  console.log(`   Overall Status: ${healthReport.overall.healthy ? '✅ Healthy' : '❌ Issues Found'}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   Cloud Function: ${cloudFunction.healthy ? '✅' : '❌'}`);
  console.log(`   GitHub API: ${github.healthy ? '✅' : '❌'}`);
  console.log(`   OpenAI API: ${openai.healthy ? '✅' : '❌'}`);
  console.log(`   ClickUp API: ${clickup.healthy ? '✅' : '❌'}`);
  console.log(`   📄 Report saved to health-report.json`);
  
  // Set GitHub Actions outputs
  console.log(`::set-output name=healthy::${healthReport.overall.healthy}`);
  console.log(`::set-output name=duration::${duration}`);
  
  return healthReport;
}

// Run if called directly
if (require.main === module) {
  runHealthCheck()
    .then((report) => {
      if (report.overall.healthy) {
        console.log('\n🎉 All systems healthy!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some systems have issues - check the report for details');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Health check failed:', error);
      process.exit(1);
    });
}

module.exports = { runHealthCheck };
