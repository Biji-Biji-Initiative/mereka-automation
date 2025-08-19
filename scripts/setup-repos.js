const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const GITHUB_ORG = 'Biji-Biji-Initiative'; // Production organization

/**
 * Setup script to create necessary repositories and configurations
 */
async function setupRepositories() {
  console.log('🚀 Setting up AI Bug Router repositories...');
  
  // List of repositories to create/configure
  const repos = [
    {
      name: 'triage',
      description: 'Triage repository for bug routing and analysis',
      private: false,
      labels: [
        { name: 'needs-routing', color: 'FFA500', description: 'Issue needs to be routed to appropriate repository' },
        { name: 'routed', color: '00FF00', description: 'Issue has been routed successfully' },
        { name: 'auto-routed', color: '0066CC', description: 'Automatically routed by AI' },
        { name: 'manual-review', color: 'FF0000', description: 'Requires human review for routing' },
        { name: 'has-auto-pr', color: '9966CC', description: 'Has an automatically generated PR' }
      ]
    }
  ];
  
  for (const repoConfig of repos) {
    try {
      // Check if repository exists
      let repo;
      try {
        const { data } = await octokit.repos.get({
          owner: GITHUB_ORG,
          repo: repoConfig.name
        });
        repo = data;
        console.log(`✅ Repository ${GITHUB_ORG}/${repoConfig.name} already exists`);
      } catch (error) {
        if (error.status === 404) {
          // Create repository
          const { data } = await octokit.repos.createInOrg({
            org: GITHUB_ORG,
            name: repoConfig.name,
            description: repoConfig.description,
            private: repoConfig.private,
            has_issues: true,
            has_projects: true,
            has_wiki: false
          });
          repo = data;
          console.log(`✅ Created repository ${GITHUB_ORG}/${repoConfig.name}`);
        } else {
          throw error;
        }
      }
      
      // Setup labels
      console.log(`🏷️  Setting up labels for ${repoConfig.name}...`);
      for (const label of repoConfig.labels) {
        try {
          await octokit.issues.createLabel({
            owner: GITHUB_ORG,
            repo: repoConfig.name,
            name: label.name,
            color: label.color,
            description: label.description
          });
          console.log(`  ✅ Created label: ${label.name}`);
        } catch (error) {
          if (error.status === 422) {
            // Label already exists, update it
            await octokit.issues.updateLabel({
              owner: GITHUB_ORG,
              repo: repoConfig.name,
              name: label.name,
              color: label.color,
              description: label.description
            });
            console.log(`  ✅ Updated label: ${label.name}`);
          } else {
            console.error(`  ❌ Error with label ${label.name}:`, error.message);
          }
        }
      }
      
      // Create initial README if it's a new repository
      try {
        await octokit.repos.getContent({
          owner: GITHUB_ORG,
          repo: repoConfig.name,
          path: 'README.md'
        });
      } catch (error) {
        if (error.status === 404) {
          // Create README
          const readmeContent = repoConfig.name === 'triage' ? `# Triage Repository

This repository is used for automated bug routing and analysis.

## How it works

1. Bug reports are initially created here with the \`needs-routing\` label
2. AI agents analyze the content and route issues to appropriate repositories
3. Successfully routed issues get the \`routed\` label and link to the target issue

## Labels

- \`needs-routing\`: Issue needs to be routed to appropriate repository
- \`routed\`: Issue has been routed successfully  
- \`auto-routed\`: Automatically routed by AI
- \`manual-review\`: Requires human review for routing
- \`has-auto-pr\`: Has an automatically generated PR

## Automation

This repository is managed by AI agents that run every 5 minutes to:
- Analyze new issues
- Route them to appropriate repositories
- Generate code fixes when possible
- Notify development teams
` : `# ${repoConfig.name}

Repository description: ${repoConfig.description}
`;
          
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_ORG,
            repo: repoConfig.name,
            path: 'README.md',
            message: 'Initial README',
            content: Buffer.from(readmeContent).toString('base64')
          });
          console.log(`  ✅ Created README.md`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error setting up repository ${repoConfig.name}:`, error);
    }
  }
  
  console.log('\n🎉 Repository setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Update the GITHUB_ORG variable in your scripts with your actual organization name');
  console.log('2. Add the following secrets to your GitHub repository:');
  console.log('   - GITHUB_TOKEN (with repo and issues permissions)');
  console.log('   - OPENAI_API_KEY');
  console.log('   - CLICKUP_TOKEN');
  console.log('   - CLICKUP_LIST_ID');
  console.log('   - SLACK_BOT_TOKEN');
  console.log('3. Deploy your enhanced Cloud Function');
  console.log('4. Test the workflow by reacting with :sos: to a Slack message');
}

if (require.main === module) {
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  setupRepositories().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupRepositories };
