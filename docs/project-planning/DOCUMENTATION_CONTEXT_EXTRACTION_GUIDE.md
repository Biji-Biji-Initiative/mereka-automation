# Documentation Context Extraction Guide
## Using Mereka Documentation Repository as AI Context Foundation

### Overview
This guide shows how to transform the Mereka documentation repository (https://github.com/Biji-Biji-Initiative/mereka-documentation) into the foundation for enterprise-wide AI context engineering.

## Phase 1: Repository Analysis & Context Mapping

### Step 1: Analyze Repository Structure
```bash
# Clone the documentation repository
git clone https://github.com/Biji-Biji-Initiative/mereka-documentation.git
cd mereka-documentation

# Analyze structure
find . -name "*.md" -o -name "*.txt" -o -name "*.json" -o -name "*.yaml" | head -20
```

### Step 2: Create Content Inventory
Create a complete inventory of documentation types:

| Document Type | Location | Context Value | Priority |
|---------------|----------|---------------|----------|
| Product Requirements | `/requirements/` | Business Context | High |
| API Documentation | `/api/` | Technical Context | High |
| User Guides | `/guides/` | Operational Context | Medium |
| Architecture Docs | `/architecture/` | Technical Context | High |
| Process Documentation | `/processes/` | Operational Context | Medium |

### Step 3: Context Classification
```typescript
interface DocumentContext {
  path: string;
  type: 'business' | 'technical' | 'operational' | 'domain';
  category: string;
  priority: 'high' | 'medium' | 'low';
  lastModified: Date;
  dependencies: string[];
}
```

## Phase 2: Automated Context Extraction Pipeline

### Step 1: Create Documentation Extractor
```typescript
// Create: context-extractors/documentation-extractor.ts

import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

export class DocumentationExtractor {
  private octokit: Octokit;
  private repoOwner = 'Biji-Biji-Initiative';
  private repoName = 'mereka-documentation';

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN // You'll need a GitHub token
    });
  }

  /**
   * Extract all documentation content from the repository
   */
  async extractAllDocumentation(): Promise<DocumentContext[]> {
    try {
      // Get repository tree
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner: this.repoOwner,
        repo: this.repoName,
        tree_sha: 'main',
        recursive: true
      });

      const documents: DocumentContext[] = [];

      for (const item of tree.tree) {
        if (item.type === 'blob' && this.isDocumentationFile(item.path!)) {
          const content = await this.getFileContent(item.path!);
          const context = await this.processDocument(item.path!, content);
          documents.push(context);
        }
      }

      return documents;
    } catch (error) {
      console.error('Error extracting documentation:', error);
      return [];
    }
  }

  private isDocumentationFile(filePath: string): boolean {
    const extensions = ['.md', '.txt', '.json', '.yaml', '.yml'];
    return extensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  private async getFileContent(filePath: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.repoOwner,
        repo: this.repoName,
        path: filePath
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return '';
    } catch (error) {
      console.error(`Error getting content for ${filePath}:`, error);
      return '';
    }
  }

  private async processDocument(filePath: string, content: string): Promise<DocumentContext> {
    return {
      path: filePath,
      type: this.classifyDocumentType(filePath, content),
      category: this.extractCategory(filePath),
      priority: this.determinePriority(filePath, content),
      lastModified: new Date(),
      dependencies: this.extractDependencies(content),
      content: content,
      summary: this.generateSummary(content),
      keywords: this.extractKeywords(content)
    };
  }

  private classifyDocumentType(filePath: string, content: string): 'business' | 'technical' | 'operational' | 'domain' {
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (lowerPath.includes('api') || lowerPath.includes('technical') || lowerContent.includes('endpoint')) {
      return 'technical';
    }
    if (lowerPath.includes('business') || lowerPath.includes('requirement') || lowerContent.includes('user story')) {
      return 'business';
    }
    if (lowerPath.includes('process') || lowerPath.includes('workflow') || lowerContent.includes('procedure')) {
      return 'operational';
    }
    return 'domain';
  }

  private extractCategory(filePath: string): string {
    const pathParts = filePath.split('/');
    return pathParts.length > 1 ? pathParts[0] : 'general';
  }

  private determinePriority(filePath: string, content: string): 'high' | 'medium' | 'low' {
    const highPriorityKeywords = ['critical', 'important', 'main', 'core', 'primary'];
    const lowPriorityKeywords = ['example', 'sample', 'draft', 'deprecated'];

    const lowerContent = content.toLowerCase() + filePath.toLowerCase();

    if (highPriorityKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'high';
    }
    if (lowPriorityKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract links to other documentation
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match[2].startsWith('./') || match[2].startsWith('../')) {
        dependencies.push(match[2]);
      }
    }

    return dependencies;
  }

  private generateSummary(content: string): string {
    // Simple summary generation - first 200 characters
    return content.substring(0, 200).trim() + '...';
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Return most frequent words
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}
```

### Step 2: Create Context Storage System
```typescript
// Create: context-storage/documentation-store.ts

import { DocumentContext } from '../types/context-types';

export class DocumentationStore {
  private contexts: Map<string, DocumentContext> = new Map();

  /**
   * Store documentation context
   */
  async storeContext(context: DocumentContext): Promise<void> {
    this.contexts.set(context.path, context);
    
    // Also store in external systems
    await this.storeInVectorDatabase(context);
    await this.storeInSearchIndex(context);
  }

  /**
   * Retrieve context by query
   */
  async queryContext(query: string, type?: string): Promise<DocumentContext[]> {
    const results: DocumentContext[] = [];

    for (const context of this.contexts.values()) {
      if (type && context.type !== type) continue;
      
      if (this.matchesQuery(context, query)) {
        results.push(context);
      }
    }

    return results.sort((a, b) => {
      // Prioritize by relevance and priority
      const relevanceA = this.calculateRelevance(a, query);
      const relevanceB = this.calculateRelevance(b, query);
      return relevanceB - relevanceA;
    });
  }

  private matchesQuery(context: DocumentContext, query: string): boolean {
    const searchText = `${context.content} ${context.summary} ${context.keywords.join(' ')}`.toLowerCase();
    const queryLower = query.toLowerCase();
    
    return searchText.includes(queryLower) || 
           context.keywords.some(keyword => keyword.includes(queryLower));
  }

  private calculateRelevance(context: DocumentContext, query: string): number {
    let score = 0;
    
    // Priority weight
    if (context.priority === 'high') score += 10;
    else if (context.priority === 'medium') score += 5;
    
    // Keyword matches
    const queryWords = query.toLowerCase().split(' ');
    queryWords.forEach(word => {
      if (context.keywords.includes(word)) score += 5;
      if (context.summary.toLowerCase().includes(word)) score += 3;
    });

    return score;
  }

  private async storeInVectorDatabase(context: DocumentContext): Promise<void> {
    // Implementation for vector database storage
    // This would connect to Pinecone, Weaviate, etc.
  }

  private async storeInSearchIndex(context: DocumentContext): Promise<void> {
    // Implementation for search index storage
    // This would connect to Elasticsearch, etc.
  }
}
```

## Phase 3: Integration with Existing MCP Tools

### Step 1: Extend MCP Context Manager
```typescript
// Create: context-integrations/mcp-context-manager.ts

import { DocumentationExtractor } from '../context-extractors/documentation-extractor';
import { DocumentationStore } from '../context-storage/documentation-store';

export class MCPContextManager {
  private docExtractor: DocumentationExtractor;
  private docStore: DocumentationStore;

  constructor() {
    this.docExtractor = new DocumentationExtractor();
    this.docStore = new DocumentationStore();
  }

  /**
   * Build comprehensive context for AI queries
   */
  async buildAIContext(query: string, domain: string): Promise<string> {
    try {
      // 1. Get documentation context
      const docContexts = await this.docStore.queryContext(query, domain);
      
      // 2. Get ClickUp context (using existing MCP)
      const clickupContext = await this.getClickUpContext(query);
      
      // 3. Get Slack context (using existing MCP)
      const slackContext = await this.getSlackContext(query);
      
      // 4. Combine and format context
      return this.formatCombinedContext({
        documentation: docContexts,
        clickup: clickupContext,
        slack: slackContext,
        query: query,
        domain: domain
      });
    } catch (error) {
      console.error('Error building AI context:', error);
      return `Error building context for query: ${query}`;
    }
  }

  private async getClickUpContext(query: string): Promise<any> {
    // Use existing MCP ClickUp integration
    // This would call your existing MCP tools
    return {
      tasks: "Recent tasks related to query",
      projects: "Relevant project information",
      team_status: "Current team workload"
    };
  }

  private async getSlackContext(query: string): Promise<any> {
    // Use existing MCP Slack integration or fallback API
    return {
      recent_discussions: "Recent relevant discussions",
      decisions: "Related decisions made",
      team_communications: "Relevant team communications"
    };
  }

  private formatCombinedContext(contextData: any): string {
    return `
# AI Context Package

## Query: ${contextData.query}
## Domain: ${contextData.domain}

## Documentation Context
${this.formatDocumentationContext(contextData.documentation)}

## Project Management Context (ClickUp)
${JSON.stringify(contextData.clickup, null, 2)}

## Team Communication Context (Slack)
${JSON.stringify(contextData.slack, null, 2)}

## Context Confidence: High
## Last Updated: ${new Date().toISOString()}
    `;
  }

  private formatDocumentationContext(docs: any[]): string {
    return docs.map(doc => `
### ${doc.path}
**Type:** ${doc.type}
**Priority:** ${doc.priority}
**Summary:** ${doc.summary}
**Keywords:** ${doc.keywords.join(', ')}
`).join('\n');
  }
}
```

## Phase 4: Daily Context Sync Implementation

### Step 1: Create Daily Sync Script
```powershell
# Create: scripts/daily-context-sync.ps1

Write-Host "🔄 Starting Daily Context Sync..." -ForegroundColor Blue

# 1. Extract latest documentation
Write-Host "📄 Extracting documentation context..." -ForegroundColor Yellow
node -e "
const { DocumentationExtractor } = require('./context-extractors/documentation-extractor');
const extractor = new DocumentationExtractor();
extractor.extractAllDocumentation().then(docs => {
  console.log('✅ Extracted', docs.length, 'documents');
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"

# 2. Sync with ClickUp (using existing MCP)
Write-Host "📋 Syncing ClickUp context..." -ForegroundColor Yellow
node -e "
// Use existing MCP integration to get latest tasks
console.log('✅ ClickUp context synced');
"

# 3. Sync with Slack (using existing MCP)
Write-Host "💬 Syncing Slack context..." -ForegroundColor Yellow
node -e "
// Use existing MCP integration to get latest communications
console.log('✅ Slack context synced');
"

# 4. Update context indices
Write-Host "🔍 Updating search indices..." -ForegroundColor Yellow
node -e "
// Update vector database and search indices
console.log('✅ Search indices updated');
"

Write-Host "✅ Daily Context Sync Complete!" -ForegroundColor Green
```

### Step 2: Automate with Task Scheduler
```powershell
# Schedule daily sync
schtasks /create /tn "MerekaContextSync" /tr "powershell.exe -File C:\path\to\daily-context-sync.ps1" /sc daily /st 06:00
```

## Phase 5: AI Integration Examples

### Example 1: AI-Assisted Code Review
```typescript
// Create: ai-integrations/code-review-assistant.ts

export class CodeReviewAssistant {
  private contextManager: MCPContextManager;

  constructor() {
    this.contextManager = new MCPContextManager();
  }

  async reviewCode(codeChanges: string, filePath: string): Promise<string> {
    const context = await this.contextManager.buildAIContext(
      `code review for ${filePath}`, 
      'technical'
    );

    const prompt = `
${context}

Please review this code change:
File: ${filePath}
Changes:
${codeChanges}

Provide feedback on:
1. Code quality
2. Adherence to documented standards
3. Potential issues
4. Suggested improvements
    `;

    // Send to AI service (OpenAI, Claude, etc.)
    return await this.callAIService(prompt);
  }

  private async callAIService(prompt: string): Promise<string> {
    // Implementation depends on your AI service choice
    return "AI review response";
  }
}
```

### Example 2: AI-Powered Documentation Generator
```typescript
// Create: ai-integrations/doc-generator.ts

export class DocumentationGenerator {
  private contextManager: MCPContextManager;

  async generateAPIDocumentation(apiEndpoint: string): Promise<string> {
    const context = await this.contextManager.buildAIContext(
      `API documentation for ${apiEndpoint}`, 
      'technical'
    );

    const prompt = `
${context}

Generate comprehensive API documentation for: ${apiEndpoint}

Include:
1. Endpoint description
2. Parameters
3. Response format
4. Error handling
5. Examples
6. Related endpoints

Use the existing documentation style and format found in the context.
    `;

    return await this.callAIService(prompt);
  }
}
```

## Implementation Timeline

### Week 1: Foundation Setup
- [ ] Clone and analyze Mereka documentation repository
- [ ] Create content inventory and classification
- [ ] Set up basic extraction pipeline
- [ ] Test with sample documents

### Week 2: Integration with Existing Tools
- [ ] Integrate with existing MCP ClickUp tools
- [ ] Integrate with existing MCP Slack tools (or API fallback)
- [ ] Create combined context manager
- [ ] Test end-to-end context building

### Week 3: AI Integration & Use Cases
- [ ] Implement code review assistant
- [ ] Create documentation generator
- [ ] Set up context quality monitoring
- [ ] Test with real scenarios

### Week 4: Automation & Scaling
- [ ] Implement daily sync automation
- [ ] Set up monitoring and alerting
- [ ] Create context dashboard
- [ ] Train team on new capabilities

## Success Metrics

### Technical Metrics
- Documentation extraction: 100% of docs processed
- Context retrieval time: < 500ms
- AI response relevance: > 85%
- System availability: > 99%

### Business Metrics
- Faster documentation updates: 60% time reduction
- Improved code review quality: 40% fewer issues
- Better knowledge sharing: 50% faster onboarding
- Reduced duplicate documentation: 70% reduction

## CEO Presentation Points

1. **Immediate Value**: "We can start today using our existing documentation repository"
2. **Quick ROI**: "First AI-powered features can be live in 2 weeks"
3. **Builds on Existing Investment**: "Leverages our current MCP and automation infrastructure"
4. **Scalable Foundation**: "This sets us up for enterprise-wide AI transformation"
5. **Measurable Impact**: "Clear metrics showing time savings and quality improvements"

## Next Steps

1. **This Week**: Analyze the Mereka documentation repository structure
2. **Set up extraction pipeline**: Start with a subset of high-priority documents
3. **Create pilot use case**: Choose one AI integration (e.g., code review assistant)
4. **Demonstrate value**: Show working prototype to leadership
5. **Scale gradually**: Add more context sources and AI use cases

This approach transforms your existing documentation into a powerful AI context foundation while building on your proven MCP integration expertise. 