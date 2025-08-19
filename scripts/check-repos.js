const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function checkRepositories() {
  try {
    console.log('🔍 Checking available repositories...\n');
    
    const { data: repos } = await octokit.repos.listForOrg({
      org: 'Biji-Biji-Initiative',
      type: 'all',
      per_page: 20
    });
    
    console.log(`📂 Found ${repos.length} repositories in Biji-Biji-Initiative:`);
    console.log('');
    
    repos.forEach(repo => {
      console.log(`   📁 ${repo.name} (${repo.visibility})`);
      console.log(`      Default branch: ${repo.default_branch}`);
      console.log(`      Issues: ${repo.has_issues ? 'Enabled' : 'Disabled'}`);
      console.log('');
    });
    
    // Check specifically for issue #2690
    console.log('🔍 Checking for your job application issue...');
    
    try {
      const { data: issue } = await octokit.issues.get({
        owner: 'Biji-Biji-Initiative',
        repo: 'mereka-web',
        issue_number: 2690
      });
      
      console.log(`✅ Issue #2690 found in mereka-web!`);
      console.log(`   Title: ${issue.title}`);
      console.log(`   State: ${issue.state}`);
      console.log(`   Labels: ${issue.labels.map(l => l.name).join(', ')}`);
      
    } catch (issueError) {
      console.log(`❌ Issue #2690 not found in mereka-web: ${issueError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRepositories();

