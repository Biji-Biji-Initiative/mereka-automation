# Project Reorganization Plan

## Current Issues
- Root directory has 20+ files scattered with mixed purposes
- Scripts, documentation, and config files are not properly organized
- Duplicate downloads folders exist
- Test artifacts are mixed with source code
- Documentation is spread across multiple locations

## Proposed New Structure

```
mereka-automation/
├── .cursorrules                      # Project-specific AI rules
├── package.json                      # Node.js dependencies
├── package-lock.json                 # Lock file
├── playwright.config.ts              # Playwright configuration
├── README.md                         # Main project documentation
├── 
├── docs/                             # All documentation
│   ├── AUTOMATION_PLAN.md
│   ├── AUTOMATION_GUIDE.md
│   ├── api-keys-setup.md
│   ├── STAGEHAND_SETUP.md
│   ├── STAGEHAND_EXECUTIVE_SUMMARY.md
│   └── STAGEHAND_EXPERIENCE_CREATION_SUMMARY.md
│
├── config/                           # Configuration files
│   ├── environments.json            # Environment configurations
│   └── test-data/                    # Test data files
│
├── scripts/                          # All automation scripts
│   ├── daily-test-scheduler.ps1
│   ├── simple-daily-test.ps1
│   ├── test-live.ps1
│   ├── run-tests.ps1
│   ├── run-tests.sh
│   ├── run-stagehand-demo.ps1
│   ├── update-stagehand-config.ps1
│   ├── daily-job-creation-test.ps1
│   └── run-automated-tests.ps1
│
├── tests/                            # All test files (renamed from mereka-automation)
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── debug-stagehand.spec.ts
│   │   ├── login-stagehand-agent.spec.ts
│   │   └── sign-up/
│   │       ├── set-up-profile-learner.spec.ts
│   │       └── sign-up-as-learner.spec.ts
│   │
│   ├── experience/
│   │   ├── create-physical-experience.spec.ts
│   │   ├── create-physical-experience-focused.spec.ts
│   │   ├── create-physical-experience-hybrid.spec.ts
│   │   ├── create-physical-experience-stagehand.spec.ts
│   │   └── home-to-experience-redirection.spec.ts
│   │
│   ├── expert/
│   │   ├── expert-detail-single-user.spec.ts
│   │   └── home-to-expert-detail.spec.ts
│   │
│   ├── expertise/
│   │   └── expertise-collection/
│   │       ├── guest-expertise-collection.spec.ts
│   │       └── login-expertise-collection.spec.ts
│   │
│   ├── home/
│   │   └── home-page-elements.spec.ts
│   │
│   ├── job/
│   │   ├── job-application/
│   │   ├── job-collection/
│   │   │   ├── job-category-tabs.spec.ts
│   │   │   ├── job-collection.spec.ts
│   │   │   └── job-menu-dropdown.spec.ts
│   │   ├── job-creation/
│   │   │   └── create-job-post.spec.ts
│   │   └── job-detail/
│   │       └── job-detail.spec.ts
│   │
│   └── fixtures/                     # Test fixtures and utilities
│       ├── page-objects/             # Page object models
│       ├── test-data/               # Test data factories
│       └── helpers/                 # Test helper functions
│
├── artifacts/                        # Test artifacts and reports
│   ├── downloads/                   # Downloaded files from tests
│   ├── test-results/               # Test execution results
│   ├── playwright-report/          # HTML reports
│   └── screenshots/                # Test failure screenshots
│
├── infrastructure/                   # Infrastructure and CI/CD
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── ci/
│   │   ├── Jenkinsfile
│   │   └── .github/                # GitHub Actions (if using)
│   └── .devcontainer/              # Dev container configuration
│
└── .gitignore                       # Git ignore rules
```

## Migration Steps

### Step 1: Create New Directory Structure
```bash
# Create main directories
mkdir -p docs config/test-data tests/fixtures/{page-objects,test-data,helpers}
mkdir -p artifacts/{downloads,test-results,playwright-report,screenshots}
mkdir -p infrastructure/{docker,ci}
```

### Step 2: Move Documentation
```bash
# Move all documentation to docs folder
mv AUTOMATION_PLAN.md docs/
mv AUTOMATION_GUIDE.md docs/
mv api-keys-setup.md docs/
mv STAGEHAND_*.md docs/
```

### Step 3: Move Scripts
```bash
# Move all scripts to scripts folder
mv daily-test-scheduler.ps1 scripts/
mv simple-daily-test.ps1 scripts/
mv test-live.ps1 scripts/
mv run-tests.ps1 scripts/
mv run-tests.sh scripts/
mv run-stagehand-demo.ps1 scripts/
mv update-stagehand-config.ps1 scripts/
mv scripts/daily-job-creation-test.ps1 scripts/
mv scripts/run-automated-tests.ps1 scripts/
```

### Step 4: Move Infrastructure
```bash
# Move Docker and CI/CD files
mv Dockerfile infrastructure/docker/
mv docker-compose.yml infrastructure/docker/
mv Jenkinsfile infrastructure/ci/
mv .devcontainer infrastructure/
```

### Step 5: Reorganize Tests
```bash
# Rename mereka-automation to tests
mv mereka-automation tests

# Remove duplicate downloads folder
rm -rf downloads  # Keep only the one in artifacts
```

### Step 6: Move Test Artifacts
```bash
# Move test artifacts
mv test-results artifacts/
mv playwright-report artifacts/
mv downloads artifacts/  # If there are any files there
```

## Benefits of This Structure

1. **Clear Separation of Concerns**: Each directory has a specific purpose
2. **Scalability**: Easy to add new test suites, documentation, or infrastructure
3. **Maintainability**: Related files are grouped together
4. **CI/CD Friendly**: Clear paths for automation scripts and configurations
5. **Developer Experience**: Easy to navigate and understand the project
6. **Artifact Management**: Test results and downloads are properly organized

## Updated .gitignore Recommendations

```gitignore
# Dependencies
node_modules/

# Test artifacts
artifacts/test-results/
artifacts/playwright-report/
artifacts/downloads/
artifacts/screenshots/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## Configuration Updates Needed

After reorganization, you'll need to update:

1. **playwright.config.ts** - Update test directory paths
2. **package.json** - Update script paths
3. **CI/CD configurations** - Update file paths
4. **Import statements** - Update relative paths in test files
5. **Documentation** - Update any hardcoded paths

## Maintenance Benefits

- **Easier onboarding** for new team members
- **Better IDE navigation** with logical folder structure
- **Cleaner version control** with organized commits
- **Improved CI/CD** with dedicated infrastructure folder
- **Better artifact management** with dedicated artifacts folder 