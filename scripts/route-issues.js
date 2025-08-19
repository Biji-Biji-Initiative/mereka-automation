const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const ORG = 'Biji-Biji-Initiative';

/**
 * Create issue in target repository
 */
async function createIssueInTargetRepo(targetRepo, originalIssue, routingInfo) {
  try {
    const title = `[Re-routed] ${originalIssue.title}`;
    
    const body = `## 🤖 Automatically Re-routed Issue

**Original Issue**: ${originalIssue.url}
**Original Repository**: ${routingInfo.currentRepo}
**Routing Confidence**: ${(routingInfo.confidence * 100).toFixed(1)}%
**Matched Keywords**: ${routingInfo.suggestedRouting.matchedKeywords.join(', ')}

---

${originalIssue.body || 'No description provided.'}

---

*This issue was automatically re-routed by AI based on content analysis. The original issue will be closed with a reference to this new issue.*`;

    const { data: newIssue } = await octokit.issues.create({
      owner: ORG,
      repo: targetRepo,
      title: title,
      body: body,
      labels: ['bug', 'auto-routed', `from-${routingInfo.currentRepo}`]
    });

    console.log(`✅ Created new issue in ${targetRepo}: #${newIssue.number}`);
    return newIssue;
    
  } catch (error) {
    console.error(`❌ Failed to create issue in ${targetRepo}:`, error.message);
    return null;
  }
}

/**
 * Close original issue with reference
 */
async function closeOriginalIssue(originalRepo, issueNumber, newIssue) {
  try {
    const comment = `🤖 **Automatically Routed**

This issue has been moved to a more appropriate repository based on AI analysis.

**New Location**: ${newIssue.html_url}
**Repository**: ${ORG}/${newIssue.html_url.split('/')[4]}
**Reason**: Content analysis indicates this issue is better suited for the target repository.

This issue will be closed to avoid duplication. Please continue the discussion in the new issue.`;

    // Add comment
    await octokit.issues.createComment({
      owner: ORG,
      repo: originalRepo,
      issue_number: issueNumber,
      body: comment
    });

    // Add labels
    await octokit.issues.addLabels({
      owner: ORG,
      repo: originalRepo,
      issue_number: issueNumber,
      labels: ['auto-routed', 'closed-duplicate']
    });

    // Close issue
    await octokit.issues.update({
      owner: ORG,
      repo: originalRepo,
      issue_number: issueNumber,
      state: 'closed'
    });

    console.log(`✅ Closed original issue #${issueNumber} in ${originalRepo}`);
    
  } catch (error) {
    console.error(`❌ Failed to close original issue:`, error.message);
  }
}

/**
 * Update ClickUp task with routing information
 */
async function updateClickUpTask(issueBody, newIssue) {
  // Extract ClickUp task ID from issue body if present
  const clickupMatch = issueBody.match(/ClickUp.*?(\w{9})/);
  if (!clickupMatch) return;

  const taskId = clickupMatch[1];
  
  try {
    const axios = require('axios');
    
    const updateData = {
      description: `${issueBody}\n\n**Updated Routing**: Issue moved to ${newIssue.html_url} based on AI analysis.`
    };

    await axios.put(
      `https://api.clickup.com/api/v2/task/${taskId}`,
      updateData,
      {
        headers: {
          'Authorization': process.env.CLICKUP_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Updated ClickUp task ${taskId} with routing info`);
    
  } catch (error) {
    console.error(`❌ Failed to update ClickUp task:`, error.message);
  }
}

/**
 * Route issues based on scan results
 */
async function routeIssues() {
  console.log('🎯 Starting issue routing...');
  
  try {
    // Load routing candidates from scan
    const candidatesData = await fs.readFile('routing-candidates.json', 'utf8');
    const candidates = JSON.parse(candidatesData);
    
    if (candidates.length === 0) {
      console.log('✅ No issues need routing at this time');
      return;
    }
    
    console.log(`📋 Found ${candidates.length} issues to route`);
    
    const routingResults = [];
    
    for (const candidate of candidates) {
      const { currentRepo, issue, suggestedRouting, confidence } = candidate;
      
      console.log(`\n🔄 Processing issue #${issue.number} from ${currentRepo}`);
      console.log(`   Title: ${issue.title}`);
      console.log(`   Target: ${suggestedRouting.repo} (${(confidence * 100).toFixed(1)}% confidence)`);
      
      // Only route if confidence is high enough
      if (confidence < 0.75) {
        console.log(`   ⚠️  Confidence too low, skipping automatic routing`);
        continue;
      }
      
      // Don't route to the same repository
      if (suggestedRouting.repo === currentRepo) {
        console.log(`   ℹ️  Already in correct repository`);
        continue;
      }
      
      // Create new issue in target repository
      const newIssue = await createIssueInTargetRepo(
        suggestedRouting.repo,
        issue,
        candidate
      );
      
      if (newIssue) {
        // Close original issue
        await closeOriginalIssue(currentRepo, issue.number, newIssue);
        
        // Update ClickUp if linked
        await updateClickUpTask(issue.body, newIssue);
        
        routingResults.push({
          original: {
            repo: currentRepo,
            issue: issue.number,
            title: issue.title
          },
          routed: {
            repo: suggestedRouting.repo,
            issue: newIssue.number,
            url: newIssue.html_url
          },
          confidence: confidence,
          keywords: suggestedRouting.matchedKeywords
        });
        
        console.log(`   ✅ Successfully routed to ${suggestedRouting.repo}#${newIssue.number}`);
      }
      
      // Rate limiting - wait between operations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate routing report
    const report = {
      timestamp: new Date().toISOString(),
      total_candidates: candidates.length,
      successfully_routed: routingResults.length,
      results: routingResults
    };
    
    await fs.writeFile('routing-report.json', JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Routing Summary:`);
    console.log(`   Candidates processed: ${candidates.length}`);
    console.log(`   Successfully routed: ${routingResults.length}`);
    console.log(`   📄 Report saved to routing-report.json`);
    
    // Set outputs for GitHub Actions
    console.log(`::set-output name=routed_count::${routingResults.length}`);
    
    return routingResults;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📋 No routing candidates file found - run scan first');
      return [];
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  routeIssues()
    .then((results) => {
      console.log('🎉 Issue routing completed successfully!');
      if (results.length > 0) {
        console.log(`🎯 Routed ${results.length} issues to better repositories`);
      }
    })
    .catch(error => {
      console.error('❌ Issue routing failed:', error);
      process.exit(1);
    });
}

module.exports = { routeIssues };
