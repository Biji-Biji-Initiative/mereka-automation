# Documentation Directory Organization 📚

This directory contains all project documentation organized by function and topic to maintain a clean, scalable structure.

## Directory Structure

### 🔧 `/mcp/` - Model Context Protocol Documentation
Complete documentation for MCP server setup and management:
- `MCP_EXECUTIVE_SUMMARY.md` - High-level MCP overview and benefits
- `MCP_QUICK_REFERENCE.md` - Quick reference guide for MCP tools
- `MCP_SETUP_COMPLETE_GUIDE.md` - Comprehensive setup guide (15KB, 562 lines)
- `MCP_SETUP_GUIDE.md` - Standard setup procedures
- `MCP_SETUP_GUIDES_README.md` - Guide collection overview
- `MCP_TROUBLESHOOTING_GUIDE.md` - Common issues and solutions

### 🎭 `/stagehand/` - Stagehand AI Automation Documentation  
Documentation for Stagehand AI automation framework:
- `STAGEHAND_EXECUTIVE_SUMMARY.md` - Overview and capabilities
- `STAGEHAND_EXPERIENCE_CREATION_SUMMARY.md` - Experience automation guide
- `STAGEHAND_SETUP.md` - Setup and configuration instructions

### 🤖 `/ai-guides/` - AI and Automation Guides
Documentation for AI assistance and automation workflows:
- `AI_ASSISTANT_PROMPT_TEMPLATE.md` - Detailed AI prompt templates
- `AI_CONTEXT_ENGINEERING_PLAN.md` - Context engineering strategy (11KB)
- `HELPER_PROMPT.md` - Interactive guidance prompts
- `QUICK_AI_PROMPT.md` - Quick AI assistance prompts

### 📋 `/project-planning/` - Project Strategy & Planning
High-level planning documents and strategic guides:
- `AUTOMATION_PLAN.md` - Automation strategy and roadmap
- `AUTOMATION-GUIDE.md` - General automation guidelines
- `DOCUMENTATION_CONTEXT_EXTRACTION_GUIDE.md` - Documentation strategy (18KB)
- `IMMEDIATE_ACTION_PLAN.md` - Quick action items and priorities

### ⚙️ `/setup/` - Setup & Configuration
Installation and configuration documentation:
- `api-keys-setup.md` - API keys and token configuration guide

### 📄 `/prd/` - Product Requirements Documents
Product specifications and feature requirements:
- `JOB_CREATION_POSTING_PRD.md` - Job creation and posting requirements

## Usage Guidelines

### 🔍 Finding Documentation

| Need Information About | Look In | Key Files |
|------------------------|---------|-----------|
| **MCP Setup/Issues** | `/mcp/` | MCP_SETUP_COMPLETE_GUIDE.md |
| **Stagehand Automation** | `/stagehand/` | STAGEHAND_SETUP.md |
| **AI Assistance** | `/ai-guides/` | AI_ASSISTANT_PROMPT_TEMPLATE.md |
| **Project Strategy** | `/project-planning/` | AUTOMATION_PLAN.md |
| **Configuration** | `/setup/` | api-keys-setup.md |
| **Product Features** | `/prd/` | JOB_CREATION_POSTING_PRD.md |

### 🚀 Common Documentation Workflows

#### Setting Up MCP Integration
```bash
# Read setup guide
docs/mcp/MCP_SETUP_COMPLETE_GUIDE.md

# Quick reference during setup
docs/mcp/MCP_QUICK_REFERENCE.md

# Troubleshooting issues
docs/mcp/MCP_TROUBLESHOOTING_GUIDE.md
```

#### AI-Assisted Development
```bash
# For comprehensive AI help
docs/ai-guides/AI_ASSISTANT_PROMPT_TEMPLATE.md

# For quick assistance
docs/ai-guides/QUICK_AI_PROMPT.md

# For interactive guidance
docs/ai-guides/HELPER_PROMPT.md
```

#### Project Planning & Strategy
```bash
# Overall automation strategy
docs/project-planning/AUTOMATION_PLAN.md

# Immediate next steps
docs/project-planning/IMMEDIATE_ACTION_PLAN.md

# Documentation strategy
docs/project-planning/DOCUMENTATION_CONTEXT_EXTRACTION_GUIDE.md
```

### 📝 Adding New Documentation

When adding new documentation, place files in the appropriate directory:

| Document Type | Directory | Examples |
|---------------|-----------|----------|
| **MCP-related** | `/mcp/` | Setup guides, troubleshooting |
| **Stagehand automation** | `/stagehand/` | Configuration, examples |
| **AI assistance** | `/ai-guides/` | Prompts, strategies |
| **Project planning** | `/project-planning/` | Roadmaps, strategies |
| **Setup/Config** | `/setup/` | Installation, configuration |
| **Product specs** | `/prd/` | Requirements, specifications |

### 🔄 Maintenance Guidelines

#### Document Organization Rules
- **Group by function** rather than file type
- **Use descriptive filenames** with consistent naming
- **Keep related documents together** in subdirectories
- **Maintain cross-references** between related documents

#### Naming Conventions
- **ALL_CAPS_WITH_UNDERSCORES.md** for formal documents
- **kebab-case.md** for setup/configuration files
- Include document type in filename (GUIDE, PLAN, SUMMARY, etc.)

## Document Cross-References

### 🔗 Key Document Relationships

#### MCP Workflow Chain
1. **Start**: `mcp/MCP_EXECUTIVE_SUMMARY.md` (overview)
2. **Setup**: `mcp/MCP_SETUP_COMPLETE_GUIDE.md` (implementation)
3. **Reference**: `mcp/MCP_QUICK_REFERENCE.md` (daily use)
4. **Issues**: `mcp/MCP_TROUBLESHOOTING_GUIDE.md` (problems)

#### AI Assistance Progression
1. **Quick Help**: `ai-guides/QUICK_AI_PROMPT.md`
2. **Detailed Help**: `ai-guides/AI_ASSISTANT_PROMPT_TEMPLATE.md`
3. **Interactive**: `ai-guides/HELPER_PROMPT.md`
4. **Strategy**: `ai-guides/AI_CONTEXT_ENGINEERING_PLAN.md`

#### Project Implementation Flow
1. **Strategy**: `project-planning/AUTOMATION_PLAN.md`
2. **Action**: `project-planning/IMMEDIATE_ACTION_PLAN.md`
3. **Execution**: `project-planning/AUTOMATION-GUIDE.md`
4. **Documentation**: `project-planning/DOCUMENTATION_CONTEXT_EXTRACTION_GUIDE.md`

## Search Tips

### 🔍 Quick File Location
```bash
# Find all MCP documentation
find docs/mcp/ -name "*.md"

# Find setup guides
find docs/ -name "*setup*" -o -name "*SETUP*"

# Find summaries
find docs/ -name "*SUMMARY*"

# Find troubleshooting docs
find docs/ -name "*troubleshoot*" -o -name "*TROUBLE*"
```

### 📖 Content Search
Use these keywords to find specific topics:
- **MCP**: Model Context Protocol, ClickUp, Slack integration
- **Stagehand**: AI automation, experience creation
- **AI**: Prompts, context engineering, assistance
- **Planning**: Strategy, roadmap, automation plan
- **Setup**: Configuration, installation, API keys

## Statistics

- **Total Files**: 19 documentation files
- **Categories**: 6 functional categories
- **Largest Document**: DOCUMENTATION_CONTEXT_EXTRACTION_GUIDE.md (18KB)
- **Most Complete**: MCP documentation (6 files)
- **Last Organized**: 2025-07-28

---

*This documentation structure follows the project's cleanliness guidelines and supports efficient information discovery and maintenance.* 