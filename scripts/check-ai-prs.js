const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function checkForAIPRs() {
  try {
    console.log('🔍 Checking for AI-generated PRs...\n');
    
    // Check mereka-web repository
    const { data: prs } = await octokit.pulls.list({
      owner: 'Biji-Biji-Initiative',
      repo: 'mereka-web',
      state: 'all',
      sort: 'created',
      direction: 'desc',
      per_page: 10
    });
    
    console.log(`📋 Found ${prs.length} recent PRs in mereka-web:`);
    console.log('');
    
    let foundAIPR = false;
    
    prs.forEach((pr, index) => {
      const isAI = pr.title.includes('🤖') || pr.title.includes('AI Fix') || pr.title.includes('[NEEDS REVIEW]');
      const icon = isAI ? '🤖' : '👤';
      const status = pr.draft ? 'DRAFT' : pr.state.toUpperCase();
      
      console.log(`${icon} #${pr.number}: ${pr.title}`);
      console.log(`   📍 Status: ${status} | Created: ${pr.created_at.split('T')[0]}`);
      console.log(`   🔗 URL: ${pr.html_url}`);
      
      if (isAI) {
        foundAIPR = true;
        console.log(`   ⚠️ AI-GENERATED PR - Requires @merekahira review`);
        
        // Check if it's related to issue #2690
        if (pr.body && pr.body.includes('#2690')) {
          console.log(`   🎯 THIS IS YOUR JOB APPLICATION FIX!`);
        }
      }
      
      console.log('');
    });
    
    if (foundAIPR) {
      console.log('✅ AI-generated PR(s) found!');
      console.log('🔒 Remember: All AI PRs require @merekahira approval before merge');
    } else {
      console.log('⚠️ No AI-generated PRs found yet.');
      console.log('🔄 The AI code fix might still be processing or may not have triggered...');
    }
    
    // Also check for recent issues to see our created issue
    console.log('\n📋 Recent GitHub Issues:');
    const { data: issues } = await octokit.issues.list({
      owner: 'Biji-Biji-Initiative',
      repo: 'mereka-web',
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 5
    });
    
    issues.forEach(issue => {
      const hasLabels = issue.labels.map(l => l.name).join(', ') || 'none';
      console.log(`🐛 #${issue.number}: ${issue.title}`);
      console.log(`   🏷️ Labels: ${hasLabels}`);
      
      if (issue.number === 2690) {
        console.log(`   🎯 THIS IS YOUR ISSUE!`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking PRs:', error.message);
  }
}

checkForAIPRs();

