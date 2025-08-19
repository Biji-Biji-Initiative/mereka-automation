const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');

// Initialize clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Repository routing registry (same as Cloud Function)
const REPO_REGISTRY = {
  'mereka-frontend': ['ui', 'react', 'web', 'frontend', 'login', 'experience', 'dashboard', 'component'],
  'mereka-backend': ['api', 'server', 'database', 'auth', 'payment', 'stripe', 'authentication'],
  'mereka-mobile': ['android', 'ios', 'mobile', 'app'],
  'mereka-documentation': ['docs', 'readme', 'guide', 'documentation']
};

const GITHUB_ORG = 'Biji-Biji-Initiative'; // Production organization
const TRIAGE_REPO = `${GITHUB_ORG}/triage`;

/**
 * Enhanced AI analysis for better repository routing
 */
async function analyzeIssueForRouting(issueContent) {
  try {
    const prompt = `
You are a senior software engineer analyzing a bug report to determine which repository/codebase it belongs to.

Bug Report Content:
${issueContent}

Available Repositories:
- mereka-frontend: React/Next.js frontend, UI components, user interfaces, login pages, dashboards
- mereka-backend: Node.js/Express API, databases, authentication, payments, server-side logic
- mereka-mobile: Android/iOS mobile applications
- mereka-documentation: Documentation, guides, README files

Analyze the bug report and provide a JSON response with:
{
  "analysis": "Brief analysis of the issue",
  "repositories": [
    {"name": "repo-name", "confidence": 0.0-1.0, "reasoning": "why this repo"}
  ],
  "recommended_action": "auto-route" | "manual-review" | "needs-info",
  "keywords": ["extracted", "technical", "keywords"],
  "issue_type": "bug" | "feature" | "docs" | "enhancement",
  "severity": "low" | "medium" | "high" | "critical"
}

Focus on technical indicators, error messages, file paths, and component names mentioned.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });

    let analysisResult;
    try {
      const content = response.choices[0].message.content;
      // Clean up markdown formatting if present
      const cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      return null;
    }

    return analysisResult;
  } catch (error) {
    console.error('❌ Error in AI analysis:', error);
    return null;
  }
}

/**
 * Get issues that need routing from triage repository
 */
async function getTriageIssues() {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner: GITHUB_ORG,
      repo: 'triage',
      labels: 'needs-routing',
      state: 'open'
    });
    
    console.log(`📋 Found ${issues.length} issues needing routing`);
    return issues;
  } catch (error) {
    console.error('❌ Error fetching triage issues:', error);
    return [];
  }
}

/**
 * Create issue in target repository
 */
async function createTargetIssue(repo, title, body, labels = []) {
  try {
    const { data: issue } = await octokit.issues.create({
      owner: GITHUB_ORG,
      repo: repo,
      title: title,
      body: body,
      labels: [...labels, 'auto-routed']
    });
    
    console.log(`✅ Created issue #${issue.number} in ${GITHUB_ORG}/${repo}`);
    return issue;
  } catch (error) {
    console.error(`❌ Error creating issue in ${repo}:`, error);
    return null;
  }
}

/**
 * Update triage issue with routing information
 */
async function updateTriageIssue(issueNumber, targetRepo, targetIssue, analysis) {
  try {
    // Add comment with routing information
    await octokit.issues.createComment({
      owner: GITHUB_ORG,
      repo: 'triage',
      issue_number: issueNumber,
      body: `🤖 **Automated Routing Completed**

**Target Repository**: ${GITHUB_ORG}/${targetRepo}
**New Issue**: #${targetIssue.number} - ${targetIssue.html_url}
**Confidence**: ${(analysis.repositories[0]?.confidence * 100).toFixed(1)}%
**Reasoning**: ${analysis.repositories[0]?.reasoning}

This issue has been automatically routed based on AI analysis of the content.`
    });

    // Update labels
    await octokit.issues.removeLabel({
      owner: GITHUB_ORG,
      repo: 'triage',
      issue_number: issueNumber,
      name: 'needs-routing'
    });

    await octokit.issues.addLabels({
      owner: GITHUB_ORG,
      repo: 'triage',
      issue_number: issueNumber,
      labels: ['routed', `routed-to-${targetRepo}`]
    });

    console.log(`✅ Updated triage issue #${issueNumber} with routing information`);
  } catch (error) {
    console.error(`❌ Error updating triage issue #${issueNumber}:`, error);
  }
}

/**
 * Notify developers about new issues
 */
async function notifyDevelopers(targetRepo, targetIssue, analysis) {
  try {
    // Create a comment with analysis and suggestions
    const notificationComment = `🤖 **AI Analysis & Recommendations**

**Issue Type**: ${analysis.issue_type}
**Severity**: ${analysis.severity}
**Keywords**: ${analysis.keywords.join(', ')}

**Analysis**: ${analysis.analysis}

**Suggested Actions**:
- Review the issue description and reproduce the problem
- Check if this relates to any recent changes
- Consider the severity level for prioritization
${analysis.severity === 'critical' ? '⚠️ **CRITICAL ISSUE** - Immediate attention required!' : ''}

This issue was automatically analyzed and routed. Please review and update labels/assignees as needed.`;

    await octokit.issues.createComment({
      owner: GITHUB_ORG,
      repo: targetRepo,
      issue_number: targetIssue.number,
      body: notificationComment
    });

    // Add appropriate labels
    const labels = ['ai-analyzed'];
    if (analysis.severity === 'critical') labels.push('priority-critical');
    if (analysis.severity === 'high') labels.push('priority-high');
    
    await octokit.issues.addLabels({
      owner: GITHUB_ORG,
      repo: targetRepo,
      issue_number: targetIssue.number,
      labels: labels
    });

    console.log(`📢 Notified developers about issue #${targetIssue.number} in ${targetRepo}`);
  } catch (error) {
    console.error('❌ Error notifying developers:', error);
  }
}

/**
 * Main routing function
 */
async function routeIssues() {
  console.log('🤖 Starting AI Bug Router Agent...');
  
  const triageIssues = await getTriageIssues();
  
  if (triageIssues.length === 0) {
    console.log('✅ No issues need routing at this time');
    return;
  }

  for (const issue of triageIssues) {
    console.log(`\n🔍 Analyzing issue #${issue.number}: ${issue.title}`);
    
    // Analyze issue with AI
    const analysis = await analyzeIssueForRouting(issue.body);
    
    if (!analysis) {
      console.log(`⚠️ Could not analyze issue #${issue.number}, skipping`);
      continue;
    }

    console.log(`📊 Analysis result:`, analysis);

    // Check if we should auto-route
    const topChoice = analysis.repositories[0];
    if (!topChoice || topChoice.confidence < 0.7) {
      console.log(`⏸️ Issue #${issue.number} needs manual review (confidence: ${topChoice?.confidence || 0})`);
      
      // Add comment indicating why it needs manual review
      await octokit.issues.createComment({
        owner: GITHUB_ORG,
        repo: 'triage',
        issue_number: issue.number,
        body: `🤖 **AI Routing Analysis - Manual Review Required**

**Confidence too low for auto-routing** (${(topChoice?.confidence * 100 || 0).toFixed(1)}%)

**Repository Candidates**:
${analysis.repositories.map(r => `- **${r.name}** (${(r.confidence * 100).toFixed(1)}%): ${r.reasoning}`).join('\n')}

**Recommendation**: ${analysis.recommended_action}

Please manually review and route this issue to the appropriate repository.`
      });
      
      continue;
    }

    // Auto-route to the best matching repository
    const targetRepo = topChoice.name;
    console.log(`🎯 Auto-routing to ${targetRepo} with ${(topChoice.confidence * 100).toFixed(1)}% confidence`);

    // Create issue in target repository
    const routedIssueBody = `## Auto-routed from Triage

**Original Issue**: ${issue.html_url}
**Auto-routed by**: AI Bug Router Agent
**Confidence**: ${(topChoice.confidence * 100).toFixed(1)}%
**Reasoning**: ${topChoice.reasoning}

---

${issue.body}`;

    const targetIssue = await createTargetIssue(
      targetRepo,
      issue.title,
      routedIssueBody,
      ['bug', analysis.issue_type, `severity-${analysis.severity}`]
    );

    if (targetIssue) {
      // Update triage issue
      await updateTriageIssue(issue.number, targetRepo, targetIssue, analysis);
      
      // Notify developers
      await notifyDevelopers(targetRepo, targetIssue, analysis);
      
      console.log(`✅ Successfully routed issue #${issue.number} to ${targetRepo}#${targetIssue.number}`);
    }
  }

  console.log('\n🎉 AI Bug Router Agent completed successfully!');
}

// Run the agent
if (require.main === module) {
  routeIssues().catch(error => {
    console.error('❌ Bug Router Agent failed:', error);
    process.exit(1);
  });
}

module.exports = { routeIssues, analyzeIssueForRouting };
