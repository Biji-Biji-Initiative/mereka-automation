const { Octokit } = require('@octokit/rest');
const { enhanceIssueWithSemanticSearch } = require('./semantic-search-engine.js');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const ORG = 'Biji-Biji-Initiative';

// Team configuration for lean team
const TEAM_CONFIG = {
  coreTeam: ['merekahira', 'teoeugene'],
  defaultAssignees: ['merekahira', 'teoeugene'],
  
  // Repository-specific preferences (optional)
  repositoryPreferences: {
    'mereka-web': ['merekahira', 'teoeugene'], // Frontend focus
    'mereka-web-ssr': ['merekahira', 'teoeugene'], // SSR focus  
    'mereka-cloudfunctions': ['merekahira', 'teoeugene'], // Backend focus
    'Fadlan-Personal': ['merekahira', 'teoeugene'] // Testing focus
  }
};

/**
 * Enhanced routing with CODEOWNERS + Semantic Search + AI
 * Handles conflicts intelligently for lean teams
 */
async function enhancedRouting(issue, aiAnalysis) {
  try {
    console.log(`🎯 Enhanced routing for issue #${issue.number}...`);
    
    // Step 1: Get AI routing recommendation
    const aiRouting = await getAIRouting(aiAnalysis);
    console.log(`   🤖 AI suggests: ${aiRouting.repository} (${(aiRouting.confidence * 100).toFixed(1)}%)`);
    
    // Step 2: Get CODEOWNERS-based routing
    const codeownersRouting = await getCodeOwnersRouting(issue, aiRouting.repository);
    console.log(`   👥 CODEOWNERS: ${codeownersRouting.assignees.join(', ')}`);
    
    // Step 3: Enhance with semantic search
    const semanticEnhancement = await enhanceIssueWithSemanticSearch(issue, aiRouting.repository);
    console.log(`   🔍 Semantic search: ${semanticEnhancement.hasSimilarSolutions ? 'Found similar solutions' : 'No similar solutions'}`);
    
    // Step 4: Resolve conflicts and make final decision
    const finalRouting = resolveRoutingConflicts({
      ai: aiRouting,
      codeowners: codeownersRouting,
      semantic: semanticEnhancement,
      issue: issue
    });
    
    console.log(`   ✅ Final decision: ${finalRouting.repository} → ${finalRouting.assignees.join(', ')}`);
    
    return finalRouting;
    
  } catch (error) {
    console.error('❌ Enhanced routing error:', error.message);
    
    // Fallback to safe defaults for lean team
    return {
      repository: 'Fadlan-Personal', // Triage repository
      assignees: TEAM_CONFIG.defaultAssignees,
      confidence: 0.5,
      method: 'fallback',
      reasoning: 'Error occurred, using safe defaults'
    };
  }
}

/**
 * Get AI routing recommendation
 */
async function getAIRouting(aiAnalysis) {
  // Use existing AI routing logic from Phase 2
  if (aiAnalysis.repositoryHints && aiAnalysis.repositoryHints.primary) {
    return {
      repository: aiAnalysis.repositoryHints.primary,
      confidence: aiAnalysis.confidence || 0.8,
      reasoning: aiAnalysis.repositoryHints.reasoning || 'AI analysis'
    };
  }
  
  // Fallback keyword-based routing
  const keywords = [
    ...(aiAnalysis.component_keywords || []),
    ...(aiAnalysis.technicalDetails || []),
    aiAnalysis.title || '',
    aiAnalysis.bugType || ''
  ].join(' ').toLowerCase();
  
  if (keywords.includes('frontend') || keywords.includes('ui') || keywords.includes('react')) {
    return { repository: 'mereka-web', confidence: 0.7, reasoning: 'Frontend keywords detected' };
  } else if (keywords.includes('ssr') || keywords.includes('seo')) {
    return { repository: 'mereka-web-ssr', confidence: 0.7, reasoning: 'SSR keywords detected' };
  } else if (keywords.includes('backend') || keywords.includes('api') || keywords.includes('functions')) {
    return { repository: 'mereka-cloudfunctions', confidence: 0.7, reasoning: 'Backend keywords detected' };
  } else {
    return { repository: 'Fadlan-Personal', confidence: 0.5, reasoning: 'Default triage repository' };
  }
}

/**
 * Get CODEOWNERS-based routing and assignment
 */
async function getCodeOwnersRouting(issue, targetRepository) {
  try {
    // For lean team, everyone owns everything, but we can still be smart about it
    const baseAssignees = TEAM_CONFIG.coreTeam;
    
    // Check if repository has specific preferences
    const repoPreferences = TEAM_CONFIG.repositoryPreferences[targetRepository];
    const assignees = repoPreferences || baseAssignees;
    
    // Analyze issue content for specialty assignment
    const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const specialtyAssignees = analyzeForSpecialty(issueText, assignees);
    
    return {
      assignees: specialtyAssignees,
      repository: targetRepository,
      reasoning: `CODEOWNERS assignment for ${targetRepository}`
    };
    
  } catch (error) {
    console.error('❌ CODEOWNERS routing error:', error.message);
    return {
      assignees: TEAM_CONFIG.defaultAssignees,
      repository: targetRepository,
      reasoning: 'Fallback to default assignees'
    };
  }
}

/**
 * Analyze issue for specialty assignment (can be customized)
 */
function analyzeForSpecialty(issueText, availableAssignees) {
  // For now, assign to all core team members
  // This can be extended later with specific expertise mapping
  return availableAssignees;
}

/**
 * Intelligent conflict resolution for lean teams
 */
function resolveRoutingConflicts({ ai, codeowners, semantic, issue }) {
  const resolution = {
    repository: ai.repository,
    assignees: codeowners.assignees,
    confidence: ai.confidence,
    method: 'enhanced-routing',
    reasoning: '',
    semanticInsights: null
  };
  
  // For lean teams, conflicts are simpler to resolve
  // Priority: AI Repository Selection + CODEOWNERS Assignment + Semantic Enhancement
  
  // 1. Repository decision (AI wins, it's usually more accurate)
  resolution.repository = ai.repository;
  resolution.reasoning = `Repository: ${ai.reasoning}`;
  
  // 2. Assignment decision (CODEOWNERS wins, team structure is fixed)
  resolution.assignees = codeowners.assignees;
  resolution.reasoning += ` | Assignment: ${codeowners.reasoning}`;
  
  // 3. Confidence adjustment based on agreement
  if (semantic.hasSimilarSolutions) {
    resolution.confidence = Math.min(resolution.confidence + 0.1, 1.0);
    resolution.reasoning += ` | Semantic: Similar solutions found`;
    resolution.semanticInsights = semantic;
  }
  
  // 4. Handle edge cases for lean team
  if (ai.confidence < 0.6) {
    resolution.repository = 'Fadlan-Personal'; // Use triage for low confidence
    resolution.reasoning += ` | Low confidence → Triage`;
  }
  
  return resolution;
}

/**
 * Apply enhanced routing to GitHub issue
 */
async function applyEnhancedRouting(issue, routing) {
  try {
    console.log(`📋 Applying enhanced routing to issue #${issue.number}...`);
    
    // Update issue with assignments
    await octokit.issues.update({
      owner: ORG,
      repo: routing.repository,
      issue_number: issue.number,
      assignees: routing.assignees
    });
    
    // Add enhanced labels
    const labels = ['auto-routed', `confidence-${Math.round(routing.confidence * 100)}`];
    
    if (routing.semanticInsights && routing.semanticInsights.hasSimilarSolutions) {
      labels.push('has-similar-solutions');
    }
    
    await octokit.issues.addLabels({
      owner: ORG,
      repo: routing.repository,
      issue_number: issue.number,
      labels: labels
    });
    
    // Add comment with routing explanation
    const commentBody = generateRoutingComment(routing);
    
    await octokit.issues.createComment({
      owner: ORG,
      repo: routing.repository,
      issue_number: issue.number,
      body: commentBody
    });
    
    console.log(`   ✅ Enhanced routing applied successfully`);
    return true;
    
  } catch (error) {
    console.error('❌ Error applying enhanced routing:', error.message);
    return false;
  }
}

/**
 * Generate informative routing comment
 */
function generateRoutingComment(routing) {
  let comment = `🤖 **Enhanced AI Routing Applied**

**Repository**: ${routing.repository}
**Assigned to**: ${routing.assignees.map(a => `@${a}`).join(', ')}
**Confidence**: ${(routing.confidence * 100).toFixed(1)}%
**Method**: ${routing.method}
**Reasoning**: ${routing.reasoning}`;

  if (routing.semanticInsights && routing.semanticInsights.hasSimilarSolutions) {
    comment += `

🔍 **Similar Solutions Found**:
${routing.semanticInsights.similarPRs.map(pr => 
  `- [PR #${pr.number}](${pr.url}): ${pr.title} (${pr.relevanceScore}% similarity)`
).join('\n')}

💡 **Recommendations**:
${routing.semanticInsights.recommendations.join('\n')}`;
  }

  comment += `

---
*This routing was generated by the Enhanced AI System combining AI analysis, CODEOWNERS, and semantic search.*`;

  return comment;
}

// Export functions
module.exports = {
  enhancedRouting,
  applyEnhancedRouting,
  resolveRoutingConflicts,
  TEAM_CONFIG
};

// Run test if called directly
if (require.main === module) {
  console.log('🎯 Enhanced Routing with CODEOWNERS + Semantic Search');
  console.log('Team Configuration:', TEAM_CONFIG);
}

