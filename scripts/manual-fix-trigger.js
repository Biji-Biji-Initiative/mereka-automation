const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Import the advanced code fix generator functions
const fs = require('fs');

// Read and execute the advanced code fix generator
const codeFixContent = fs.readFileSync('./advanced-code-fix-generator.js', 'utf8');

// Extract the necessary functions (simplified version for testing)
async function testIssueFixability() {
  try {
    console.log('🔍 MANUAL AI CODE FIX TRIGGER');
    console.log('🎯 Testing your Job Application chronological ordering issue...\n');
    
    // Get the specific issue #2690
    const { data: issue } = await octokit.issues.get({
      owner: 'Biji-Biji-Initiative',
      repo: 'mereka-web',
      issue_number: 2690
    });
    
    console.log(`📋 Found Issue #${issue.number}: ${issue.title}`);
    console.log(`📝 Body: ${issue.body || 'No description'}`);
    console.log(`🏷️ Labels: ${issue.labels.map(l => l.name).join(', ') || 'none'}`);
    console.log('');
    
    // Check if this issue has the auto-routed and bug labels
    const hasAutoRouted = issue.labels.some(l => l.name === 'auto-routed');
    const hasBugLabel = issue.labels.some(l => l.name === 'bug');
    
    console.log('🔍 AI TRIGGER CONDITIONS:');
    console.log(`   ✅ Has 'auto-routed' label: ${hasAutoRouted}`);
    console.log(`   ✅ Has 'bug' label: ${hasBugLabel}`);
    console.log(`   ✅ Issue is open: ${issue.state === 'open'}`);
    console.log('');
    
    if (!hasAutoRouted || !hasBugLabel) {
      console.log('⚠️ ISSUE NOT MEETING AI TRIGGER CONDITIONS!');
      console.log('');
      console.log('🔧 SOLUTION: The AI code fix generator only processes issues with:');
      console.log('   - "auto-routed" label (✅ from Slack → GitHub routing)');
      console.log('   - "bug" label (✅ indicating it\'s a fixable issue)');
      console.log('');
      
      if (!hasAutoRouted) {
        console.log('❌ Missing "auto-routed" label');
        console.log('   This indicates the issue wasn\'t created by the AI router');
      }
      
      if (!hasBugLabel) {
        console.log('❌ Missing "bug" label'); 
        console.log('   This indicates the issue isn\'t marked as a bug to fix');
      }
      
      console.log('');
      console.log('🎯 FIXING THE LABELS NOW...');
      
      // Add the missing labels
      const labelsToAdd = [];
      if (!hasAutoRouted) labelsToAdd.push('auto-routed');
      if (!hasBugLabel) labelsToAdd.push('bug');
      
      if (labelsToAdd.length > 0) {
        await octokit.issues.addLabels({
          owner: 'Biji-Biji-Initiative',
          repo: 'mereka-web',
          issue_number: 2690,
          labels: labelsToAdd
        });
        
        console.log(`✅ Added labels: ${labelsToAdd.join(', ')}`);
        console.log('');
        console.log('🤖 NOW the AI will process this issue in the next run!');
        console.log('🔄 You can trigger the advanced-code-fix-generator.js again');
      }
      
    } else {
      console.log('✅ Issue meets all AI trigger conditions!');
      console.log('🤖 The AI should process this issue...');
      console.log('');
      console.log('🔄 Let\'s check why the AI didn\'t create a PR...');
      
      // Check for existing AI PR
      console.log('🔍 Checking for existing AI PRs...');
      const { data: prs } = await octokit.pulls.list({
        owner: 'Biji-Biji-Initiative',
        repo: 'mereka-web',
        state: 'all',
        head: 'Biji-Biji-Initiative:ai-fix-2690',
        per_page: 1
      });
      
      if (prs.length > 0) {
        console.log('✅ Found existing AI PR!');
        console.log(`🔗 PR #${prs[0].number}: ${prs[0].html_url}`);
      } else {
        console.log('❌ No AI PR found with expected branch name');
        console.log('🔄 The AI fix generation may have failed or not triggered');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testIssueFixability();

