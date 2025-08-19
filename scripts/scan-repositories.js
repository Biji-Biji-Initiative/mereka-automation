const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const ORG = 'Biji-Biji-Initiative';
const REPOSITORIES = ['mereka-web', 'mereka-web-ssr', 'mereka-cloudfunctions', 'Fadlan-Personal'];

/**
 * Repository routing registry (same as Cloud Function)
 */
const REPO_REGISTRY = {
  'mereka-web': ['frontend', 'ui', 'web', 'client', 'react', 'nextjs', 'typescript', 'component', 'interface', 'login', 'dashboard', 'experience', 'expert', 'job', 'user', 'mobile', 'responsive', 'css', 'styling', 'form', 'validation', 'routing', 'navigation'],
  'mereka-web-ssr': ['ssr', 'server-side', 'rendering', 'nextjs', 'seo', 'performance', 'hydration', 'static', 'generation', 'pre-rendering', 'meta', 'og', 'sitemap'],
  'mereka-cloudfunctions': ['backend', 'api', 'server', 'cloud', 'functions', 'firebase', 'google-cloud', 'serverless', 'authentication', 'auth', 'database', 'firestore', 'payment', 'stripe', 'webhook', 'cron', 'scheduled', 'email', 'notification', 'push'],
  'Fadlan-Personal': ['automation', 'test', 'qa', 'playwright', 'testing', 'triage', 'routing', 'bug-routing', 'ci-cd', 'deployment']
};

/**
 * Analyze issue content for better routing
 */
function analyzeIssueForRouting(title, body) {
  const content = `${title} ${body}`.toLowerCase();
  const candidates = [];
  
  Object.entries(REPO_REGISTRY).forEach(([repo, keywords]) => {
    const matches = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
    if (matches.length > 0) {
      candidates.push({
        repo,
        score: matches.length,
        confidence: matches.length / keywords.length,
        matchedKeywords: matches
      });
    }
  });
  
  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Check if issue needs routing
 */
function needsRouting(issue, currentRepo) {
  // Check for routing labels
  const hasRoutingLabel = issue.labels.some(label => 
    ['needs-routing', 'auto-routed', 'manual-routing'].includes(label.name)
  );
  
  // Check if issue was created by automation
  const isAutoCreated = issue.body && issue.body.includes('automatically created');
  
  // Analyze content for better routing
  const routing = analyzeIssueForRouting(issue.title, issue.body || '');
  
  if (routing.length === 0) return false;
  
  const bestMatch = routing[0];
  
  // Need routing if:
  // 1. High confidence match for different repo
  // 2. No routing labels and low confidence in current repo
  return (
    (bestMatch.confidence > 0.7 && bestMatch.repo !== currentRepo) ||
    (!hasRoutingLabel && bestMatch.confidence > 0.5 && bestMatch.repo !== currentRepo)
  );
}

/**
 * Scan all repositories for issues needing routing
 */
async function scanRepositories() {
  console.log('🔍 Starting repository scan...');
  
  const issuesNeedingRouting = [];
  let totalIssuesScanned = 0;
  
  for (const repo of REPOSITORIES) {
    try {
      console.log(`📂 Scanning ${ORG}/${repo}...`);
      
      const { data: issues } = await octokit.issues.listForRepo({
        owner: ORG,
        repo: repo,
        state: 'open',
        per_page: 50,
        sort: 'created',
        direction: 'desc'
      });
      
      totalIssuesScanned += issues.length;
      console.log(`   Found ${issues.length} open issues`);
      
      for (const issue of issues) {
        if (needsRouting(issue, repo)) {
          const routing = analyzeIssueForRouting(issue.title, issue.body || '');
          
          issuesNeedingRouting.push({
            currentRepo: repo,
            issue: {
              number: issue.number,
              title: issue.title,
              body: issue.body,
              url: issue.html_url,
              labels: issue.labels.map(l => l.name),
              created_at: issue.created_at
            },
            suggestedRouting: routing[0] || null,
            confidence: routing[0]?.confidence || 0
          });
          
          console.log(`   ⚠️  Issue #${issue.number} needs routing: ${issue.title}`);
          console.log(`       Current: ${repo} → Suggested: ${routing[0]?.repo} (${(routing[0]?.confidence * 100).toFixed(1)}%)`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error scanning ${repo}:`, error.message);
    }
  }
  
  console.log(`\n📊 Scan Summary:`);
  console.log(`   Total issues scanned: ${totalIssuesScanned}`);
  console.log(`   Issues needing routing: ${issuesNeedingRouting.length}`);
  
  // Save results for routing script
  if (issuesNeedingRouting.length > 0) {
    await fs.writeFile(
      'routing-candidates.json',
      JSON.stringify(issuesNeedingRouting, null, 2)
    );
    console.log(`   📁 Saved routing candidates to routing-candidates.json`);
    
    // Set output for GitHub Actions
    console.log('::set-output name=issues_found::true');
    console.log(`::set-output name=issues_count::${issuesNeedingRouting.length}`);
  } else {
    console.log('   ✅ All issues are correctly routed!');
    console.log('::set-output name=issues_found::false');
  }
  
  return issuesNeedingRouting;
}

/**
 * Generate scan report
 */
async function generateScanReport(issues) {
  const report = {
    timestamp: new Date().toISOString(),
    total_repositories: REPOSITORIES.length,
    issues_needing_routing: issues.length,
    repositories: REPOSITORIES,
    routing_opportunities: issues.map(item => ({
      repo: item.currentRepo,
      issue: `#${item.issue.number}`,
      title: item.issue.title,
      suggested_repo: item.suggestedRouting?.repo,
      confidence: item.confidence,
      matched_keywords: item.suggestedRouting?.matchedKeywords
    }))
  };
  
  await fs.writeFile('scan-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Generated scan-report.json');
  
  return report;
}

// Run if called directly
if (require.main === module) {
  scanRepositories()
    .then(generateScanReport)
    .then(() => {
      console.log('🎉 Repository scan completed successfully!');
    })
    .catch(error => {
      console.error('❌ Repository scan failed:', error);
      process.exit(1);
    });
}

module.exports = { scanRepositories, analyzeIssueForRouting };
