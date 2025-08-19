const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Initialize clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GITHUB_ORG = 'Biji-Biji-Initiative'; // Production organization

/**
 * Get recently routed issues that might need code fixes
 */
async function getIssuesForCodeFix() {
  try {
    const repos = ['mereka-frontend', 'mereka-backend', 'mereka-mobile'];
    const issues = [];
    
    for (const repo of repos) {
      try {
        const { data: repoIssues } = await octokit.issues.listForRepo({
          owner: GITHUB_ORG,
          repo: repo,
          labels: 'auto-routed,bug',
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 5 // Limit to recent issues
        });
        
        // Filter for issues without existing PRs
        for (const issue of repoIssues) {
          const hasAutoPR = issue.labels.some(label => label.name === 'has-auto-pr');
          if (!hasAutoPR) {
            issues.push({ ...issue, repo });
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not access ${repo}, skipping...`);
      }
    }
    
    console.log(`🔍 Found ${issues.length} issues that might benefit from automated fixes`);
    return issues;
  } catch (error) {
    console.error('❌ Error fetching issues for code fix:', error);
    return [];
  }
}

/**
 * Analyze if an issue can be automatically fixed
 */
async function analyzeForAutoFix(issue) {
  try {
    const prompt = `
You are a senior software engineer analyzing a bug report to determine if it can be automatically fixed.

Bug Report:
Title: ${issue.title}
Description: ${issue.body}

Repository: ${issue.repo}

Analyze this bug report and determine:
1. Can this be automatically fixed with high confidence?
2. What type of fix is needed?
3. What files might need to be modified?
4. What is the complexity level?

Provide a JSON response:
{
  "can_auto_fix": true/false,
  "confidence": 0.0-1.0,
  "fix_type": "typo" | "logic" | "config" | "dependency" | "style" | "validation" | "other",
  "complexity": "trivial" | "simple" | "moderate" | "complex",
  "likely_files": ["file1.js", "file2.css"],
  "fix_description": "What needs to be changed",
  "suggested_solution": "Specific code changes needed",
  "risk_assessment": "low" | "medium" | "high",
  "requires_testing": true/false
}

Only suggest auto-fixes for:
- Simple typos or text corrections
- Basic validation fixes
- Simple CSS/styling issues
- Configuration updates
- Adding missing error handling
- Basic null checks

Avoid auto-fixes for:
- Complex business logic changes
- Database schema changes
- Security-related issues
- Major architectural changes
- Issues requiring user research
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000
    });

    let analysis;
    try {
      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing AI fix analysis:', parseError);
      return null;
    }

    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing issue for auto-fix:', error);
    return null;
  }
}

/**
 * Generate code fix for an issue
 */
async function generateCodeFix(issue, analysis) {
  try {
    const prompt = `
You are a software engineer creating a code fix for this bug:

Title: ${issue.title}
Description: ${issue.body}
Repository: ${issue.repo}

Fix Analysis: ${JSON.stringify(analysis, null, 2)}

Generate the exact code changes needed. Provide a JSON response with:
{
  "branch_name": "fix/descriptive-name",
  "commit_message": "Fix: descriptive commit message",
  "files": [
    {
      "path": "relative/path/to/file.js",
      "action": "modify" | "create" | "delete",
      "content": "full file content with fix applied",
      "description": "what was changed in this file"
    }
  ],
  "pr_title": "🤖 Auto-fix: Brief description",
  "pr_description": "Detailed PR description with explanation",
  "testing_notes": "How to test this fix"
}

Rules:
- Only provide changes for files that actually need modification
- Include complete file content, not just diffs
- Keep changes minimal and focused
- Add proper error handling where needed
- Follow the existing code style
- Include comments explaining the fix
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000
    });

    let codefix;
    try {
      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      codefix = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing AI code fix:', parseError);
      return null;
    }

    return codefix;
  } catch (error) {
    console.error('❌ Error generating code fix:', error);
    return null;
  }
}

/**
 * Create a pull request with the fix
 */
async function createFixPR(issue, codefix) {
  try {
    console.log(`🔧 Creating fix PR for issue #${issue.number} in ${issue.repo}`);
    
    // Get default branch
    const { data: repo } = await octokit.repos.get({
      owner: GITHUB_ORG,
      repo: issue.repo
    });
    const defaultBranch = repo.default_branch;
    
    // Get reference to default branch
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_ORG,
      repo: issue.repo,
      ref: `heads/${defaultBranch}`
    });
    
    // Create new branch
    await octokit.git.createRef({
      owner: GITHUB_ORG,
      repo: issue.repo,
      ref: `refs/heads/${codefix.branch_name}`,
      sha: ref.object.sha
    });
    
    // Apply file changes
    for (const file of codefix.files) {
      if (file.action === 'modify' || file.action === 'create') {
        try {
          // Try to get existing file
          let existingFile = null;
          try {
            const { data } = await octokit.repos.getContent({
              owner: GITHUB_ORG,
              repo: issue.repo,
              path: file.path,
              ref: defaultBranch
            });
            existingFile = data;
          } catch (error) {
            // File doesn't exist, that's okay for create action
          }
          
          // Update or create file
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_ORG,
            repo: issue.repo,
            path: file.path,
            message: `${codefix.commit_message} - ${file.description}`,
            content: Buffer.from(file.content).toString('base64'),
            branch: codefix.branch_name,
            sha: existingFile?.sha
          });
          
          console.log(`✅ Updated file: ${file.path}`);
        } catch (error) {
          console.error(`❌ Error updating file ${file.path}:`, error);
        }
      }
    }
    
    // Create pull request
    const prBody = `${codefix.pr_description}

## 🤖 Automated Fix Details

**Related Issue**: #${issue.number}
**Fix Type**: ${analysis.fix_type}
**Complexity**: ${analysis.complexity}
**Risk Assessment**: ${analysis.risk_assessment}

## 🧪 Testing Notes
${codefix.testing_notes}

## 📋 Files Changed
${codefix.files.map(f => `- \`${f.path}\`: ${f.description}`).join('\n')}

---
*This PR was automatically generated by AI. Please review carefully before merging.*

**⚠️ Important**: This is a draft PR for review. Please:
1. Test the changes thoroughly
2. Review the code for correctness
3. Ensure it follows project standards
4. Update tests if necessary`;

    const { data: pr } = await octokit.pulls.create({
      owner: GITHUB_ORG,
      repo: issue.repo,
      title: codefix.pr_title,
      head: codefix.branch_name,
      base: defaultBranch,
      body: prBody,
      draft: true // Create as draft for human review
    });
    
    // Add labels to the PR
    await octokit.issues.addLabels({
      owner: GITHUB_ORG,
      repo: issue.repo,
      issue_number: pr.number,
      labels: ['auto-generated', 'needs-review', `fix-${analysis.fix_type}`]
    });
    
    // Comment on original issue
    await octokit.issues.createComment({
      owner: GITHUB_ORG,
      repo: issue.repo,
      issue_number: issue.number,
      body: `🤖 **Automated Fix Generated**

I've analyzed this issue and created a potential fix:

**Pull Request**: #${pr.number} - ${pr.html_url}
**Fix Type**: ${analysis.fix_type}
**Confidence**: ${(analysis.confidence * 100).toFixed(1)}%
**Risk Level**: ${analysis.risk_assessment}

**What was changed**:
${codefix.files.map(f => `- \`${f.path}\`: ${f.description}`).join('\n')}

⚠️ **Please review carefully** - This is an AI-generated fix and should be tested before merging.`
    });
    
    // Add label to original issue
    await octokit.issues.addLabels({
      owner: GITHUB_ORG,
      repo: issue.repo,
      issue_number: issue.number,
      labels: ['has-auto-pr']
    });
    
    console.log(`✅ Created draft PR #${pr.number} for issue #${issue.number}`);
    return pr;
    
  } catch (error) {
    console.error('❌ Error creating fix PR:', error);
    return null;
  }
}

/**
 * Main code fix generation function
 */
async function generateCodeFixes() {
  console.log('🤖 Starting Code Fix Generator...');
  
  const issues = await getIssuesForCodeFix();
  
  if (issues.length === 0) {
    console.log('✅ No issues need automated fixes at this time');
    return;
  }

  for (const issue of issues) {
    console.log(`\n🔍 Analyzing issue #${issue.number} for auto-fix: ${issue.title}`);
    
    // Analyze if it can be auto-fixed
    const analysis = await analyzeForAutoFix(issue);
    
    if (!analysis || !analysis.can_auto_fix || analysis.confidence < 0.8) {
      console.log(`⏸️ Issue #${issue.number} not suitable for auto-fix (confidence: ${analysis?.confidence || 0})`);
      continue;
    }

    if (analysis.risk_assessment === 'high' || analysis.complexity === 'complex') {
      console.log(`⚠️ Issue #${issue.number} deemed too risky or complex for auto-fix`);
      continue;
    }

    console.log(`🔧 Generating code fix for issue #${issue.number}...`);
    
    // Generate the actual fix
    const codefix = await generateCodeFix(issue, analysis);
    
    if (!codefix) {
      console.log(`❌ Could not generate code fix for issue #${issue.number}`);
      continue;
    }

    // Create the PR
    const pr = await createFixPR(issue, codefix);
    
    if (pr) {
      console.log(`✅ Successfully created auto-fix PR #${pr.number} for issue #${issue.number}`);
    }
  }

  console.log('\n🎉 Code Fix Generator completed successfully!');
}

// Run the generator
if (require.main === module) {
  generateCodeFixes().catch(error => {
    console.error('❌ Code Fix Generator failed:', error);
    process.exit(1);
  });
}

module.exports = { generateCodeFixes, analyzeForAutoFix };
