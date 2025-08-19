const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');

// Initialize clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Unified GPT-4o strategy for consistent high-quality analysis and code generation
const MODELS = {
  // GPT-4o for comprehensive analysis with better context understanding
  ANALYSIS: 'gpt-4o',  // Higher quality analysis and better reasoning
  
  // GPT-4o for advanced code generation and PR creation  
  CODE_GENERATION: 'gpt-4o'  // Consistent model for reliable code quality
};

const ORG = 'Biji-Biji-Initiative';
const REPOSITORIES = ['mereka-web'];

/**
 * Comprehensive issue patterns for AI code fixes - handles ALL types of issues
 */
const FIXABLE_ISSUE_PATTERNS = {
  // UI & Styling Issues
  'ui-styling-fixes': {
    keywords: ['button', 'link', 'css', 'style', 'color', 'font', 'spacing', 'margin', 'padding', 'layout', 'design', 'responsive', 'mobile', 'desktop'],
    confidence: 0.8,
    complexity: 'simple'
  },
  
  // Content & Text Issues
  'content-text-fixes': {
    keywords: ['typo', 'spelling', 'text', 'label', 'message', 'wording', 'content', 'copy', 'title', 'description'],
    confidence: 0.9,
    complexity: 'simple'
  },
  
  // Form & Validation Issues
  'form-validation-fixes': {
    keywords: ['validation', 'required field', 'form error', 'input validation', 'form', 'submit', 'field', 'input', 'textarea', 'select'],
    confidence: 0.7,
    complexity: 'moderate'
  },
  
  // Data Sorting & Display Issues
  'data-sorting-fixes': {
    keywords: ['chronological', 'sorted', 'ordering', 'sort by date', 'chronologically', 'order by', 'latest first', 'sorting algorithm', 'list', 'displayed', 'showing', 'appears', 'table', 'grid', 'appears random', 'not ordered'],
    confidence: 0.8,
    complexity: 'moderate'
  },
  
  // Navigation & Routing Issues
  'navigation-routing-fixes': {
    keywords: ['navigation', 'routing', 'redirect', 'link', 'page', 'route', 'menu', 'navbar', 'sidebar', 'breadcrumb'],
    confidence: 0.7,
    complexity: 'moderate'
  },
  
  // API & Backend Integration Issues
  'api-integration-fixes': {
    keywords: ['api', 'endpoint', 'request', 'response', 'fetch', 'axios', 'http', 'rest', 'graphql', 'backend', 'server'],
    confidence: 0.6,
    complexity: 'complex'
  },
  
  // Authentication & Security Issues
  'auth-security-fixes': {
    keywords: ['authentication', 'login', 'logout', 'auth', 'token', 'session', 'security', 'permission', 'authorization'],
    confidence: 0.6,
    complexity: 'complex'
  },
  
  // Performance & Optimization Issues
  'performance-fixes': {
    keywords: ['performance', 'slow', 'loading', 'optimization', 'speed', 'lag', 'delay', 'memory', 'cpu'],
    confidence: 0.5,
    complexity: 'complex'
  },
  
  // Database & Storage Issues
  'database-storage-fixes': {
    keywords: ['database', 'storage', 'save', 'persist', 'data', 'model', 'schema', 'query', 'sql'],
    confidence: 0.5,
    complexity: 'complex'
  },
  
  // Component & Feature Issues
  'component-feature-fixes': {
    keywords: ['component', 'feature', 'functionality', 'behavior', 'interaction', 'click', 'hover', 'event'],
    confidence: 0.6,
    complexity: 'moderate'
  },
  
  // Error Handling & Exception Issues
  'error-handling-fixes': {
    keywords: ['error message', 'try catch', 'error handling', 'exception', 'crash', 'bug', 'failure', 'issue'],
    confidence: 0.6,
    complexity: 'moderate'
  },
  
  // State Management Issues
  'state-management-fixes': {
    keywords: ['state', 'redux', 'context', 'store', 'useState', 'useEffect', 'props', 'state management'],
    confidence: 0.5,
    complexity: 'complex'
  },
  
  // Accessibility Issues
  'accessibility-fixes': {
    keywords: ['accessibility', 'a11y', 'alt text', 'aria-label', 'screen reader', 'keyboard', 'focus', 'contrast'],
    confidence: 0.8,
    complexity: 'simple'
  },
  
  // Loading & Async Issues
  'loading-async-fixes': {
    keywords: ['loading', 'spinner', 'skeleton', 'placeholder', 'async', 'await', 'promise', 'asynchronous'],
    confidence: 0.7,
    complexity: 'moderate'
  },
  
  // Mobile & Responsive Issues
  'mobile-responsive-fixes': {
    keywords: ['mobile', 'responsive', 'tablet', 'phone', 'screen size', 'breakpoint', 'media query'],
    confidence: 0.7,
    complexity: 'moderate'
  },
  
  // Business Logic Issues
  'business-logic-fixes': {
    keywords: ['logic', 'calculation', 'algorithm', 'process', 'workflow', 'rule', 'condition'],
    confidence: 0.5,
    complexity: 'complex'
  },
  
  // Integration & Third-party Issues
  'integration-fixes': {
    keywords: ['integration', 'third-party', 'plugin', 'library', 'dependency', 'external'],
    confidence: 0.4,
    complexity: 'complex'
  },
  
  // General Issues (catch-all for any issue)
  'general-fixes': {
    keywords: ['bug', 'issue', 'problem', 'broken', 'not working', 'fix', 'solve', 'resolve'],
    confidence: 0.4,
    complexity: 'variable'
  }
};

/**
 * Analyze if an issue is suitable for AI code generation
 */
async function analyzeFixability(issue) {
  try {
    console.log(`🔍 Analyzing fixability for issue #${issue.number}: ${issue.title}`);
    
    const issueText = `${issue.title} ${issue.body || ''}`.toLowerCase();
    
    // Quick keyword screening
    let bestMatch = null;
    let maxScore = 0;
    
    Object.entries(FIXABLE_ISSUE_PATTERNS).forEach(([category, pattern]) => {
      const score = pattern.keywords.reduce((acc, keyword) => {
        return acc + (issueText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = { category, pattern, score };
      }
    });
    
    // AI analysis for deeper understanding
    console.log(`   🤖 Running AI analysis...`);
    const aiAnalysis = await analyzeWithAI(issue);
    
    // ATTEMPT TO FIX ALL ISSUES - Never return null
    let category, complexity, confidence, reasoning;
    
    if (bestMatch && maxScore > 0) {
      // Pattern-based approach
      category = bestMatch.category;
      complexity = bestMatch.pattern.complexity;
      confidence = bestMatch.pattern.confidence;
      reasoning = `Pattern: ${category} (${maxScore} keywords matched)`;
      
      if (aiAnalysis && aiAnalysis.canBeAutomated) {
        confidence = Math.max(confidence, aiAnalysis.confidence);
        reasoning += ` + AI confirmed`;
      } else if (aiAnalysis) {
        confidence = Math.max(0.3, confidence * 0.8); // Reduce but don't eliminate
        reasoning += ` (AI uncertain but proceeding)`;
      }
      
    } else if (aiAnalysis && aiAnalysis.canBeAutomated) {
      // AI-only approach
      category = 'ai-general-fix';
      complexity = aiAnalysis.riskLevel || 'moderate';
      confidence = Math.max(0.3, aiAnalysis.confidence);
      reasoning = `AI-only analysis (confidence: ${aiAnalysis.confidence})`;
      
    } else {
      // Force attempt approach - try to fix everything
      category = 'experimental-fix';
      complexity = 'complex';
      confidence = 0.25; // Low but still attempt
      reasoning = `Experimental attempt (no clear patterns)`;
    }
    
    console.log(`   ✅ ATTEMPTING FIX: ${reasoning}, Confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      category: category,
      complexity: complexity,
      confidence: confidence,
      aiAnalysis: aiAnalysis,
      suggestedApproach: aiAnalysis?.suggestedApproach || 'General AI-powered code analysis and fix',
      reasoning: reasoning,
      forceAttempt: maxScore === 0 && (!aiAnalysis || !aiAnalysis.canBeAutomated)
    };
    
  } catch (error) {
    console.error(`❌ Error analyzing fixability, but attempting anyway:`, error.message);
    
    // Even on error, attempt a fix
    return {
      category: 'error-recovery-fix',
      complexity: 'unknown',
      confidence: 0.2,
      aiAnalysis: null,
      suggestedApproach: 'Error recovery - basic AI analysis attempt',
      reasoning: 'Analysis failed but attempting fix anyway',
      errorRecovery: true
    };
  }
}

/**
 * AI analysis for code fix suitability
 */
async function analyzeWithAI(issue) {
  try {
    const prompt = `You are an expert AI software engineer that SPECIALIZES in automated code fix generation. Your mission is to attempt fixing ANY issue, regardless of complexity.

Issue Title: "${issue.title}"
Issue Body: "${issue.body || 'No description'}"

IMPORTANT: You should be optimistic and attempt to fix this issue. Consider all possible approaches:
- Frontend UI fixes (React, CSS, JavaScript)
- Backend API fixes (Node.js, database queries)
- Data sorting, filtering, and display logic
- Form validation and user input handling
- Business logic and algorithmic improvements
- Performance optimizations
- Error handling and edge cases
- Integration and third-party service fixes

Even if the issue seems complex, provide a concrete technical approach. Think step-by-step about:
1. What files would likely contain this functionality?
2. What specific code changes would fix this issue?
3. What libraries, frameworks, or patterns are involved?

Return ONLY valid JSON (be optimistic and attempt all issues):
{
  "canBeAutomated": true,
  "confidence": 0.0-1.0,
  "reasoning": "specific technical reasoning for how this can be fixed",
  "suggestedApproach": "detailed step-by-step technical approach to implement the fix",
  "estimatedFiles": ["specific", "file", "paths", "or", "patterns", "to", "modify"],
  "riskLevel": "low|medium|high",
  "requiresHumanReview": true/false,
  "technicalSteps": ["step 1", "step 2", "step 3"],
  "expectedChanges": "what the fix should accomplish"
}`;

    const response = await openai.chat.completions.create({
      model: MODELS.ANALYSIS,  // GPT-5-mini for fast analysis
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500  // GPT-4o uses max_tokens
    });

    const content = response.choices[0].message.content
      .replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    
    console.log(`   📝 GPT-5 Analysis Response: ${content.substring(0, 200)}...`);
    
    if (!content || content.length < 10) {
      console.log(`   ⚠️ Empty or too short response from GPT-5-mini`);
      return null;
    }
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
      console.log(`   📄 Raw Content: ${content}`);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          console.log(`   ❌ Fallback JSON Parse also failed`);
        }
      }
      return null;
    }
    
  } catch (error) {
    console.error(`❌ AI analysis error:`, error.message);
    return null;
  }
}

/**
 * Generate code fix for an issue
 */
async function generateCodeFix(issue, fixability, repository) {
  try {
    console.log(`🛠️ Generating code fix for issue #${issue.number}...`);
    
    // Get repository context (recent files, structure)
    const repoContext = await getRepositoryContext(repository);
    
    const prompt = `You are an expert full-stack developer specializing in ${getRepoTechStack(repository.name)} and AUTOMATED CODE FIX GENERATION. You MUST provide a working solution for this issue.

REPOSITORY: ${repository.name}
TECH STACK: ${getRepoTechStack(repository.name)}
COMPLEXITY: ${fixability.complexity}

ISSUE TO FIX:
Title: "${issue.title}"
Description: "${issue.body || 'No description'}"

AI ANALYSIS:
${fixability.reasoning}
Suggested Approach: ${fixability.suggestedApproach}

REPOSITORY CONTEXT:
Recent Files: ${repoContext.recentFiles.slice(0, 10).join(', ')}
Structure: ${repoContext.structure}

COMPREHENSIVE FIX REQUIREMENTS:
1. Analyze the issue thoroughly - understand root cause
2. Identify ALL files that need changes (frontend, backend, config, etc.)
3. Provide complete, working code for each file
4. Handle edge cases and error scenarios
5. Include proper testing approaches
6. Consider performance and security implications

For issues involving:
- SORTING/ORDERING: Fix the sort logic, add proper date/time handling
- UI PROBLEMS: Fix components, styles, responsive design
- FORM ISSUES: Fix validation, submission, user experience
- API ISSUES: Fix endpoints, data processing, error handling
- BUSINESS LOGIC: Fix algorithms, calculations, workflows
- PERFORMANCE: Add optimizations, caching, lazy loading

Return ONLY valid JSON with a COMPLETE solution:
{
  "summary": "Comprehensive description of the fix and approach",
  "complexity": "${fixability.complexity}",
  "confidence": ${fixability.confidence},
  "files": [
    {
      "path": "exact/path/to/component.jsx",
      "action": "modify",
      "content": "COMPLETE file content - full working code with imports, exports, all functions",
      "explanation": "detailed explanation of changes and why they fix the issue",
      "changeType": "frontend|backend|config|style|test"
    }
  ],
  "additionalFiles": [
    {
      "path": "path/to/related/file.js", 
      "suggestion": "consider updating this file for related improvements"
    }
  ],
  "testingStrategy": {
    "unitTests": ["specific test cases to verify the fix"],
    "integrationTests": ["end-to-end scenarios to test"],
    "manualTesting": ["steps to manually verify the fix works"]
  },
  "implementationSteps": ["step 1", "step 2", "step 3"],
  "rollbackPlan": "how to revert if issues arise",
  "commitMessage": "fix: descriptive commit message following conventional commits",
  "prDescription": "## Problem\\n\\n## Solution\\n\\n## Testing\\n\\n## Review Checklist",
  "reviewChecklist": ["verify functionality", "check edge cases", "test performance impact"],
  "relatedIssues": ["any related GitHub issues or considerations"]
}

CRITICAL: Provide WORKING, COMPLETE code. Don't use placeholders or pseudo-code. Make the fix comprehensive and production-ready.`;

    const response = await openai.chat.completions.create({
      model: MODELS.CODE_GENERATION,  // GPT-5 for advanced code generation
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000  // GPT-4o uses max_tokens
    });

    const content = response.choices[0].message.content
      .replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    
    console.log(`   📝 GPT-5 Code Generation Response: ${content.substring(0, 200)}...`);
    
    if (!content || content.length < 10) {
      console.log(`   ⚠️ Empty or too short response from GPT-5`);
      return null;
    }
    
    let codeFix;
    try {
      codeFix = JSON.parse(content);
    } catch (parseError) {
      console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
      console.log(`   📄 Raw Content: ${content}`);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          codeFix = JSON.parse(jsonMatch[0]);
        } catch (fallbackError) {
          console.log(`   ❌ Fallback JSON Parse also failed`);
          return null;
        }
      } else {
        return null;
      }
    }
    
    console.log(`   ✅ Code fix generated: ${codeFix.files.length} files`);
    return codeFix;
    
  } catch (error) {
    console.error(`❌ Code generation error:`, error.message);
    return null;
  }
}

/**
 * Get repository context for better code generation
 */
async function getRepositoryContext(repository) {
  try {
    // Get recent commits to understand file patterns
    const { data: commits } = await octokit.repos.listCommits({
      owner: repository.owner.login,
      repo: repository.name,
      per_page: 10
    });
    
    const recentFiles = [];
    commits.forEach(commit => {
      if (commit.files) {
        commit.files.forEach(file => {
          if (!recentFiles.includes(file.filename)) {
            recentFiles.push(file.filename);
          }
        });
      }
    });
    
    // Get repository structure (directories)
    const { data: contents } = await octokit.repos.getContent({
      owner: repository.owner.login,
      repo: repository.name,
      path: ''
    });
    
    const structure = contents
      .filter(item => item.type === 'dir')
      .map(dir => dir.name)
      .slice(0, 10)
      .join(', ');
    
    return {
      recentFiles: recentFiles.slice(0, 20),
      structure: structure
    };
    
  } catch (error) {
    console.log(`⚠️ Could not get repository context: ${error.message}`);
    return {
      recentFiles: [],
      structure: 'Unknown'
    };
  }
}

/**
 * Get tech stack for repository
 */
function getRepoTechStack(repoName) {
  const stacks = {
    'mereka-web': 'React, Next.js, TypeScript, Tailwind CSS',
    'mereka-web-ssr': 'Next.js SSR, TypeScript, SEO optimization',
    'mereka-cloudfunctions': 'Node.js, Firebase Functions, Express',
    'Fadlan-Personal': 'Playwright, TypeScript, Test Automation'
  };
  
  return stacks[repoName] || 'JavaScript, Node.js';
}

/**
 * Create pull request with code fix
 */
async function createFixPullRequest(repository, issue, codeFix) {
  try {
    console.log(`📝 Creating pull request for issue #${issue.number}...`);
    
    const branchName = `ai-fix-issue-${issue.number}`;
    const baseBranch = repository.default_branch || 'main';
    
    // Get base branch SHA
    const { data: baseRef } = await octokit.git.getRef({
      owner: repository.owner.login,
      repo: repository.name,
      ref: `heads/${baseBranch}`
    });
    
    // Create new branch
    await octokit.git.createRef({
      owner: repository.owner.login,
      repo: repository.name,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha
    });
    
    console.log(`   ✅ Created branch: ${branchName}`);
    
    // Apply file changes
    for (const file of codeFix.files) {
      if (file.action === 'create' || file.action === 'modify') {
        let sha = null;
        
        // Get existing file SHA if modifying
        if (file.action === 'modify') {
          try {
            const { data: existingFile } = await octokit.repos.getContent({
              owner: repository.owner.login,
              repo: repository.name,
              path: file.path,
              ref: branchName
            });
            sha = existingFile.sha;
          } catch (error) {
            console.log(`   ⚠️ File ${file.path} not found, creating new file`);
          }
        }
        
        // Create or update file
        await octokit.repos.createOrUpdateFileContents({
          owner: repository.owner.login,
          repo: repository.name,
          path: file.path,
          message: codeFix.commitMessage,
          content: Buffer.from(file.content).toString('base64'),
          branch: branchName,
          ...(sha && { sha })
        });
        
        console.log(`   ✅ ${file.action === 'create' ? 'Created' : 'Modified'}: ${file.path}`);
      }
    }
    
    // Create pull request with MANDATORY CODE REVIEW safeguards
    const { data: pullRequest } = await octokit.pulls.create({
      owner: repository.owner.login,
      repo: repository.name,
      title: `🤖 [NEEDS REVIEW] AI Fix: ${codeFix.summary}`,
      body: `## 🤖 AI-Generated Code Fix
**⚠️ MANDATORY HUMAN REVIEW REQUIRED ⚠️**

**Fixes**: #${issue.number}

${codeFix.prDescription}

## 🔍 REQUIRED REVIEW PROCESS
**This PR contains AI-generated code and MUST be reviewed by the development team.**

### 👥 Required Reviewers
- **@merekahira** (Lead Developer - **APPROVAL REQUIRED**)
- Development team members

### 🚨 SAFETY MEASURES ACTIVE
- ✅ **Draft PR** - Cannot be merged accidentally
- ✅ **Review Required** - @merekahira must approve
- ✅ **Safety Labels** - Clearly marked as AI-generated
- ✅ **Testing Required** - Must verify fix works

### 🔧 Changes Made:
${codeFix.files.map(f => `- **${f.action}**: \`${f.path}\` - ${f.explanation}`).join('\n')}

### 🧪 MANDATORY Testing Checklist:
${codeFix.testSuggestions ? codeFix.testSuggestions.map(test => `- [ ] ${test}`).join('\n') : '- [ ] Add appropriate tests'}
- [ ] **Test in staging environment**
- [ ] **Verify original issue is resolved**
- [ ] **Check for edge cases and regressions**

### ✅ Code Review Checklist:
${codeFix.reviewChecklist ? codeFix.reviewChecklist.map(item => `- [ ] ${item}`).join('\n') : ''}
- [ ] **Security review** - No vulnerabilities introduced
- [ ] **Performance impact** - No degradation
- [ ] **Code standards** - Follows project conventions
- [ ] **Logic verification** - Fix actually solves the issue
- [ ] **Edge cases considered** - Handles error scenarios

### 🔄 Approval Process:
1. **Review code thoroughly** ⬅️ **YOU ARE HERE**
2. **Test in staging environment**
3. **Verify issue resolution**
4. **@merekahira approval required**
5. **Remove "do-not-merge" label**
6. **Mark as "Ready for review"**
7. **Final approval and merge**

### ⚠️ IMPORTANT WARNINGS
- **DO NOT MERGE** without @merekahira approval
- **DO NOT AUTO-MERGE** - Human verification required
- **TEST THOROUGHLY** before production deployment
- **REVERT IMMEDIATELY** if issues arise after merge

---
**🤖 Generated by AI Bug Router** | **🔒 Requires Human Approval** | **Issue #${issue.number}**
**⚠️ This is AI-generated code - VERIFY BEFORE MERGING ⚠️**`,
      head: branchName,
      base: baseBranch,
      draft: true // CRITICAL: Always create as draft
    });
    
    // Add SAFETY labels to prevent accidental merging
    try {
      await octokit.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pullRequest.number,
        labels: ['ai-generated', 'needs-review', 'do-not-merge', 'requires-approval', `fixes-issue-${issue.number}`]
      });
      console.log(`   🏷️ Safety labels applied`);
    } catch (labelError) {
      console.log(`   ⚠️ Could not add labels: ${labelError.message}`);
    }

    // Request mandatory review from merekahira
    try {
      await octokit.pulls.requestReviewers({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pullRequest.number,
        reviewers: ['merekahira']  // Mandatory reviewer
      });
      console.log(`   👥 Mandatory review requested from @merekahira`);
    } catch (reviewError) {
      console.log(`   ⚠️ Could not auto-request review: ${reviewError.message}`);
      console.log(`   📝 Please manually request review from @merekahira`);
    }
    
    // Add mandatory safety comment
    try {
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pullRequest.number,
        body: `🤖 **AI-Generated Code Fix Safety Notice**

⚠️ **MANDATORY REVIEW REQUIRED** ⚠️

This PR contains **AI-generated code** and has multiple safety measures in place:

### 🔒 Safety Measures Active:
- ✅ **Draft PR** - Cannot be merged until marked ready
- ✅ **Review Required** - @merekahira must approve before merge
- ✅ **Safety Labels** - Clearly marked as AI-generated and requiring approval
- ✅ **Testing Required** - Must be verified in staging environment

### 👥 Required Actions:
1. **@merekahira** - Please review the generated code thoroughly
2. **Development Team** - Test the fix in staging environment  
3. **Verify** - Confirm the original issue is actually resolved
4. **Approve** - Only merge after human verification and approval

### ⚠️ CRITICAL WARNINGS:
- **DO NOT MERGE** without @merekahira's explicit approval
- **DO NOT REMOVE** the "do-not-merge" label until fully reviewed
- **TEST THOROUGHLY** before considering for production
- **REVERT IMMEDIATELY** if any issues arise after merge

**Original Issue:** ${issue.html_url}
**AI Confidence:** ${codeFix.confidence || 'N/A'}
**Complexity:** ${codeFix.complexity || 'Unknown'}

---
🛡️ **Multiple safety layers protect against accidental deployment of untested AI code**`
      });
      console.log(`   💬 Safety comment added`);
    } catch (commentError) {
      console.log(`   ⚠️ Could not add safety comment: ${commentError.message}`);
    }
    
    console.log(`   ✅ SAFE Pull request created: #${pullRequest.number}`);
    console.log(`   🔗 URL: ${pullRequest.html_url}`);
    console.log(`   🔒 Multiple safety measures applied - requires @merekahira approval`);
    
    return {
      pullRequest: pullRequest,
      branch: branchName,
      filesModified: codeFix.files.length
    };
    
  } catch (error) {
    console.error(`❌ Error creating pull request:`, error.message);
    return null;
  }
}

/**
 * Main function to scan and generate code fixes
 */
async function scanAndGenerateCodeFixes() {
  console.log('🔍 Scanning repositories for fixable issues...\n');
  
  const results = {
    scanned: 0,
    fixable: 0,
    prsCreated: 0,
    errors: 0
  };
  
  for (const repoName of REPOSITORIES) {
    try {
      console.log(`📂 Processing repository: ${ORG}/${repoName}`);
      
      // Get repository info
      const { data: repository } = await octokit.repos.get({
        owner: ORG,
        repo: repoName
      });
      
      // Get open issues
      const { data: issues } = await octokit.issues.listForRepo({
        owner: ORG,
        repo: repoName,
        state: 'open',
        labels: 'bug',
        per_page: 10,
        sort: 'created',
        direction: 'desc'
      });
      
      console.log(`   Found ${issues.length} open bug issues`);
      results.scanned += issues.length;
      
      for (const issue of issues) {
        // Skip if already has AI-generated PR
        if (issue.body && issue.body.includes('ai-generated')) {
          console.log(`   ⏭️ Skipping #${issue.number} (already has AI fix)`);
          continue;
        }
        
        // Analyze fixability
        const fixability = await analyzeFixability(issue);
        
        if (!fixability) {
          continue;
        }
        
        results.fixable++;
        
        // Generate code fix
        const codeFix = await generateCodeFix(issue, fixability, repository);
        
        if (!codeFix) {
          results.errors++;
          continue;
        }
        
        // Create pull request
        const prResult = await createFixPullRequest(repository, issue, codeFix);
        
        if (prResult) {
          results.prsCreated++;
          
          // Comment on original issue
          await octokit.issues.createComment({
            owner: ORG,
            repo: repoName,
            issue_number: issue.number,
            body: `🤖 **AI-Generated Fix Available**

I've analyzed this issue and created a potential code fix: ${prResult.pullRequest.html_url}

**Fix Summary**: ${codeFix.summary}
**Files Modified**: ${prResult.filesModified}
**Review Required**: This is a draft PR that needs human review before merging.

The fix addresses the issue with ${fixability.category} approach and has ${(fixability.confidence * 100).toFixed(1)}% confidence.`
          });
          
          console.log(`   ✅ Created fix for issue #${issue.number}`);
        } else {
          results.errors++;
        }
        
        // Rate limiting pause
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`   ✅ Completed ${repoName}\n`);
      
    } catch (error) {
      console.error(`❌ Error processing ${repoName}:`, error.message);
      results.errors++;
    }
  }
  
  // Generate summary
  console.log('📊 Code Fix Generation Summary:');
  console.log(`   Issues Scanned: ${results.scanned}`);
  console.log(`   Fixable Issues: ${results.fixable}`);
  console.log(`   PRs Created: ${results.prsCreated}`);
  console.log(`   Errors: ${results.errors}`);
  
  const successRate = results.scanned > 0 ? (results.prsCreated / results.scanned * 100).toFixed(1) : 0;
  console.log(`   Success Rate: ${successRate}%`);
  
  return results;
}

// Run if called directly
if (require.main === module) {
  scanAndGenerateCodeFixes()
    .then((results) => {
      if (results.prsCreated > 0) {
        console.log(`\n🎉 Successfully generated ${results.prsCreated} AI-powered code fixes!`);
      } else {
        console.log('\n💡 No suitable issues found for automated fixes at this time.');
      }
    })
    .catch(error => {
      console.error('❌ Code fix generation failed:', error);
      process.exit(1);
    });
}

module.exports = { scanAndGenerateCodeFixes, analyzeFixability, generateCodeFix };
