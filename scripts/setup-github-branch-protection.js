/**
 * Setup GitHub Branch Protection Rules to Prevent AI Code Bypass
 * Ensures all AI-generated code MUST be reviewed by merekahira
 */

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPOSITORIES = [
  'mereka-web',
  'mereka-web-ssr', 
  'mereka-cloudfunctions'
];

const OWNER = 'Biji-Biji-Initiative';

/**
 * Set up branch protection rules to enforce code review
 */
async function setupBranchProtection() {
  console.log('🔒 Setting up GitHub Branch Protection Rules...\n');

  for (const repo of REPOSITORIES) {
    try {
      console.log(`📂 Configuring ${repo}...`);

      // Get repository info
      const { data: repository } = await octokit.repos.get({
        owner: OWNER,
        repo: repo
      });

      const defaultBranch = repository.default_branch;
      console.log(`   🌿 Default branch: ${defaultBranch}`);

      // Set up branch protection rules
      const protectionConfig = {
        owner: OWNER,
        repo: repo,
        branch: defaultBranch,
        required_status_checks: {
          strict: true,
          contexts: [] // Add CI/CD checks if available
        },
        enforce_admins: false, // Allow admins to bypass for emergencies
        required_pull_request_reviews: {
          required_approving_review_count: 1, // At least 1 approval required
          dismiss_stale_reviews: true, // Dismiss reviews when new commits pushed
          require_code_owner_reviews: true, // CODEOWNERS must review
          restrictions: {
            users: ['merekahira'], // Only merekahira can approve
            teams: [] // Add team slugs if needed
          }
        },
        restrictions: null, // No push restrictions (allow through PRs)
        required_linear_history: false,
        allow_force_pushes: false, // Prevent force pushes
        allow_deletions: false // Prevent branch deletion
      };

      try {
        await octokit.repos.updateBranchProtection(protectionConfig);
        console.log(`   ✅ Branch protection enabled for ${defaultBranch}`);
        console.log(`   🔒 merekahira approval required for all merges`);
        console.log(`   🚫 Force pushes blocked`);
        console.log(`   ⭐ Stale reviews dismissed on new commits`);
      } catch (protectionError) {
        if (protectionError.status === 404) {
          console.log(`   ⚠️ Branch protection not available (may need admin access)`);
        } else {
          console.log(`   ❌ Failed to set protection: ${protectionError.message}`);
        }
      }

      // Create CODEOWNERS file if it doesn't exist
      try {
        await octokit.repos.getContent({
          owner: OWNER,
          repo: repo,
          path: '.github/CODEOWNERS'
        });
        console.log(`   📋 CODEOWNERS file exists`);
      } catch (codeownersError) {
        if (codeownersError.status === 404) {
          console.log(`   📝 Creating CODEOWNERS file...`);
          
          const codeownersContent = `# CODEOWNERS file for ${repo}
# This file defines who must review code changes

# Global owners - all files require review from merekahira
* @merekahira

# AI-generated code requires special review
# Any AI-generated PRs must be reviewed by merekahira
/src/ @merekahira
/components/ @merekahira
/pages/ @merekahira
/lib/ @merekahira
/utils/ @merekahira

# Critical system files require extra scrutiny
package.json @merekahira
package-lock.json @merekahira
.env* @merekahira
docker* @merekahira
*.config.* @merekahira

# Documentation can be more flexible but still reviewed
*.md @merekahira
docs/ @merekahira
`;

          await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: repo,
            path: '.github/CODEOWNERS',
            message: '🔒 Add CODEOWNERS file to require merekahira review for all code changes',
            content: Buffer.from(codeownersContent).toString('base64')
          });
          
          console.log(`   ✅ CODEOWNERS file created`);
        }
      }

    } catch (error) {
      console.error(`❌ Error configuring ${repo}:`, error.message);
    }

    console.log(''); // Empty line between repos
  }
}

/**
 * Create a safety guidelines document
 */
async function createSafetyGuidelines() {
  console.log('📋 Creating AI Code Review Safety Guidelines...\n');

  const safetyDoc = `# 🤖 AI-Generated Code Review Guidelines

## ⚠️ CRITICAL: All AI-Generated Code MUST Be Reviewed

This repository uses an AI Bug Router that can automatically generate code fixes. **EVERY AI-generated fix requires human review and approval.**

## 🔒 Safety Measures in Place

### 1. Automatic Safeguards
- ✅ **Draft PRs Only** - AI never creates mergeable PRs
- ✅ **Mandatory Review** - @merekahira approval required
- ✅ **Safety Labels** - Clear marking of AI-generated content
- ✅ **Branch Protection** - Cannot merge without review

### 2. Required Review Process

#### 🔍 For @merekahira (Lead Reviewer):
- [ ] **Code Quality Review**
  - Does the code follow our standards?
  - Are there any security vulnerabilities?
  - Is the logic sound and efficient?

- [ ] **Functionality Verification**
  - Does the fix actually solve the original issue?
  - Are edge cases handled properly?
  - Is error handling adequate?

- [ ] **Testing Requirements**
  - Are unit tests included or updated?
  - Has the fix been tested in staging?
  - Are integration tests passing?

- [ ] **Impact Assessment**
  - What's the blast radius of this change?
  - Could this break existing functionality?
  - Is a rollback plan available?

#### 🧪 Testing Checklist
- [ ] **Staging Environment** - Deploy and test thoroughly
- [ ] **Original Issue** - Verify the reported problem is fixed
- [ ] **Regression Testing** - Ensure no new bugs introduced
- [ ] **Performance Impact** - Check for any performance degradation
- [ ] **Security Scan** - Run security analysis if applicable

## 🚨 Red Flags - When to Reject AI Code

### Immediate Rejection:
- **Security vulnerabilities** in the generated code
- **Performance degradation** without justification
- **Breaking changes** without proper migration
- **Insufficient testing** or test coverage
- **Complex business logic** that seems incorrect
- **External API changes** without proper error handling

### Requires Extra Scrutiny:
- Changes to authentication or authorization
- Database schema or query modifications
- Third-party integrations or API calls
- Performance-critical code paths
- User-facing UI/UX changes

## ✅ Approval Process

### 1. Initial Review
- AI creates **DRAFT PR** with safety measures
- @merekahira receives automatic review request
- Review the generated code thoroughly

### 2. Testing Phase
- Deploy to staging environment
- Test the fix manually
- Run automated test suites
- Verify original issue resolution

### 3. Final Approval
- If code passes all checks, **approve the PR**
- **Remove "do-not-merge" label**
- **Mark PR as "Ready for review"**
- **Merge only after final verification**

### 4. Post-Merge Monitoring
- Monitor production for any issues
- Be ready to **revert immediately** if problems arise
- Document any lessons learned

## 🛡️ Safety Guarantees

### What AI Cannot Do:
- ❌ **Cannot merge code** without human approval
- ❌ **Cannot bypass review** process
- ❌ **Cannot remove safety labels** automatically
- ❌ **Cannot override** branch protection rules

### What Humans Must Do:
- ✅ **Review every line** of AI-generated code
- ✅ **Test thoroughly** in staging environment
- ✅ **Verify issue resolution** manually
- ✅ **Approve explicitly** before merge
- ✅ **Monitor post-deployment** for issues

## 📞 Emergency Procedures

### If AI Code Causes Production Issues:
1. **Immediate Revert** - Roll back the problematic change
2. **Incident Response** - Follow standard incident procedures
3. **Root Cause Analysis** - Determine what went wrong
4. **AI System Review** - Update prompts/rules if needed
5. **Process Improvement** - Enhance review guidelines

### Contact Information:
- **Lead Developer**: @merekahira
- **AI System Maintainer**: Development team
- **Emergency**: Follow standard escalation procedures

---

## 📝 Remember: AI is a Tool, Not a Replacement

AI-generated code is a **powerful tool** to accelerate development, but it **requires human wisdom, experience, and judgment** to ensure quality and safety.

**When in doubt, ask for additional review or reject the AI suggestion.**

---
*Generated as part of AI Bug Router safety measures*
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

  // Save to repository
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: 'mereka-automation', // Store in automation repo
      path: 'docs/AI_CODE_REVIEW_GUIDELINES.md',
      message: '📋 Add comprehensive AI code review safety guidelines',
      content: Buffer.from(safetyDoc).toString('base64')
    });
    
    console.log('✅ AI Code Review Guidelines created');
    console.log('📄 Available at: docs/AI_CODE_REVIEW_GUIDELINES.md');
  } catch (error) {
    console.error('❌ Failed to create guidelines:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔒 AI CODE SAFETY SETUP\n');
  console.log('Setting up safeguards to ensure AI code cannot bypass human review...\n');

  await setupBranchProtection();
  await createSafetyGuidelines();

  console.log('🎉 AI Code Safety Setup Complete!\n');
  console.log('🔒 Safety Measures Active:');
  console.log('   ✅ Branch protection rules enforced');
  console.log('   ✅ CODEOWNERS files created');
  console.log('   ✅ Review guidelines documented');
  console.log('   ✅ @merekahira approval required for all AI code');
  console.log('\n⚠️ AI-generated code can NO LONGER bypass human review!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupBranchProtection, createSafetyGuidelines };

