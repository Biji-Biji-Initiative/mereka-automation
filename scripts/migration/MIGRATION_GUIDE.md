# Migration Guide - Mereka Automation Project Reorganization

This guide will help you safely migrate your current project structure to a clean, organized, and maintainable structure.

## 🚀 Quick Start

### 1. Create Backup (IMPORTANT!)
```powershell
# Run this first to create a safe backup
.\backup-before-migration.ps1
```

### 2. Run Migration
```powershell
# Run the migration script
.\migrate-structure.ps1
```

### 3. Update Configurations
Follow the post-migration steps listed below.

## 📋 What Will Change

### Before (Current Structure)
```
mereka-automation/
├── 📄 20+ files scattered in root
├── 📁 mereka-automation/          # Test files
├── 📁 scripts/                   # Some scripts
├── 📁 config/                    # Configuration
├── 📁 test-results/              # Test artifacts
├── 📁 playwright-report/         # Reports
├── 📁 downloads/                 # Downloads
└── 📄 Many documentation files
```

### After (New Structure)
```
mereka-automation/
├── 📄 Essential files only (.cursorrules, package.json, etc.)
├── 📁 docs/                      # All documentation
├── 📁 scripts/                   # All scripts organized
├── 📁 config/                    # Configuration files
├── 📁 tests/                     # All test files (renamed from mereka-automation)
├── 📁 artifacts/                 # Test results, reports, downloads
└── 📁 infrastructure/            # Docker, CI/CD, dev container
```

## 🛡️ Safety Features

- **Backup Creation**: Creates timestamped backup before migration
- **Safe File Moving**: Checks file existence before moving
- **Conflict Detection**: Handles existing directories gracefully
- **Rollback Option**: Easy restoration from backup if needed

## 📝 Post-Migration Steps

After running the migration, you'll need to update these configurations:

### 1. Update playwright.config.ts
```typescript
// Change this:
testDir: './mereka-automation',

// To this:
testDir: './tests',
```

### 2. Update package.json scripts
```json
{
  "scripts": {
    "test": "playwright test --config=playwright.config.ts",
    "test:headed": "playwright test --config=playwright.config.ts --headed",
    "report": "playwright show-report artifacts/playwright-report"
  }
}
```

### 3. Update CI/CD configurations
- **Jenkinsfile**: Update paths from `mereka-automation/` to `tests/`
- **Docker**: Update any volume mounts or paths
- **GitHub Actions**: Update workflow paths if using

### 4. Update Import Statements
If you have any relative imports between test files, update them:
```typescript
// Change this:
import { helper } from '../../../helpers/testHelper';

// To this (if using fixtures):
import { helper } from '../fixtures/helpers/testHelper';
```

## 🔧 Script Details

### backup-before-migration.ps1
- Creates timestamped backup folder
- Copies all project files except node_modules, .git, and large artifacts
- Provides restoration command

### migrate-structure.ps1
- Creates new directory structure
- Moves files to appropriate locations
- Updates .cursorrules path references
- Provides summary of changes

## 🎯 Benefits of New Structure

1. **Organized**: Each type of file has its proper place
2. **Scalable**: Easy to add new tests, docs, or infrastructure
3. **Maintainable**: Clear separation of concerns
4. **Professional**: Follows industry best practices
5. **CI/CD Friendly**: Clear paths for automation

## 📊 Directory Purpose

| Directory | Purpose |
|-----------|---------|
| `docs/` | All documentation files |
| `scripts/` | PowerShell/shell scripts for automation |
| `tests/` | All Playwright test files |
| `tests/fixtures/` | Page objects, test data, helpers |
| `config/` | Configuration files |
| `artifacts/` | Test results, reports, downloads |
| `infrastructure/` | Docker, CI/CD, dev containers |

## 🚨 Troubleshooting

### Migration Failed?
```powershell
# Restore from backup
$backupDir = "backup-YYYY-MM-DD-HHmm"  # Replace with actual backup dir
Copy-Item -Path "$backupDir\*" -Destination "." -Recurse -Force
```

### Tests Not Running?
1. Check `playwright.config.ts` testDir path
2. Verify test files are in `tests/` directory
3. Update any hardcoded paths in test files

### Scripts Not Working?
1. Check script paths in `package.json`
2. Verify scripts are in `scripts/` directory
3. Update any references to old paths

## 📚 Additional Resources

- [Playwright Configuration Documentation](https://playwright.dev/docs/test-configuration)
- [Project Structure Best Practices](https://docs.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)
- [CI/CD Pipeline Setup](https://docs.github.com/en/actions/learn-github-actions)

## ✅ Verification Checklist

After migration, verify:
- [ ] All tests run successfully: `npm test`
- [ ] Reports generate in correct location
- [ ] Scripts execute from new locations
- [ ] Documentation is accessible
- [ ] CI/CD pipeline works (if applicable)
- [ ] No broken imports or path references

## 🤝 Need Help?

If you encounter issues:
1. Check the backup folder for original files
2. Review the migration script output for errors
3. Update configurations as outlined above
4. Run tests to verify everything works

The new structure will make your project more maintainable and professional! 🚀 