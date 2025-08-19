const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');

// Initialize clients
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ORG = 'Biji-Biji-Initiative';
const REPOSITORIES = ['mereka-web', 'mereka-web-ssr', 'mereka-cloudfunctions', 'Fadlan-Personal'];

/**
 * Semantic Search Engine for GitHub Issues and PRs
 * Finds similar issues/PRs based on meaning, not just keywords
 */
class SemanticSearchEngine {
  constructor() {
    this.prCache = new Map(); // Cache PRs to avoid repeated API calls
    this.embeddings = new Map(); // Cache embeddings
  }

  /**
   * Find similar PRs using semantic search
   */
  async findSimilarPRs(query, repository, options = {}) {
    try {
      console.log(`🔍 Semantic search for: "${query}" in ${repository}`);
      
      const {
        timeframe = '6months',
        threshold = 0.75,
        maxResults = 5,
        includeBody = true
      } = options;
      
      // Get recent PRs from the repository
      const prs = await this.getRecentPRs(repository, timeframe);
      console.log(`   Found ${prs.length} PRs to analyze`);
      
      if (prs.length === 0) {
        return [];
      }
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      if (!queryEmbedding) {
        console.log('   ⚠️ Could not generate query embedding');
        return [];
      }
      
      // Calculate similarity scores for all PRs
      const similarities = [];
      
      for (const pr of prs) {
        const prText = includeBody 
          ? `${pr.title} ${pr.body || ''}`
          : pr.title;
        
        const prEmbedding = await this.generateEmbedding(prText);
        
        if (prEmbedding) {
          const similarity = this.calculateCosineSimilarity(queryEmbedding, prEmbedding);
          
          if (similarity >= threshold) {
            similarities.push({
              pr: pr,
              similarity: similarity,
              relevanceScore: similarity * 100
            });
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Sort by similarity and return top results
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
      
      console.log(`   ✅ Found ${results.length} similar PRs (threshold: ${threshold})`);
      
      return results.map(result => ({
        ...result.pr,
        similarity: result.similarity,
        relevanceScore: result.relevanceScore.toFixed(1),
        url: result.pr.html_url
      }));
      
    } catch (error) {
      console.error('❌ Semantic search error:', error.message);
      return [];
    }
  }

  /**
   * Get recent PRs from repository
   */
  async getRecentPRs(repository, timeframe) {
    try {
      const cacheKey = `${repository}-${timeframe}`;
      
      if (this.prCache.has(cacheKey)) {
        return this.prCache.get(cacheKey);
      }
      
      // Calculate date threshold
      const months = timeframe === '6months' ? 6 : 12;
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      
      const { data: prs } = await octokit.pulls.list({
        owner: ORG,
        repo: repository,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      });
      
      // Filter by date and merge status
      const recentPRs = prs.filter(pr => {
        const updatedDate = new Date(pr.updated_at);
        return updatedDate >= since && pr.merged_at !== null;
      });
      
      // Cache results
      this.prCache.set(cacheKey, recentPRs);
      
      return recentPRs;
      
    } catch (error) {
      console.error(`❌ Error fetching PRs for ${repository}:`, error.message);
      return [];
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  async generateEmbedding(text) {
    try {
      if (this.embeddings.has(text)) {
        return this.embeddings.get(text);
      }
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000), // Limit text length
        encoding_format: "float"
      });
      
      const embedding = response.data[0].embedding;
      this.embeddings.set(text, embedding);
      
      return embedding;
      
    } catch (error) {
      console.error('❌ Embedding generation error:', error.message);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateCosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Analyze issue and find similar solutions
   */
  async analyzeIssueForSimilarity(issue, repository) {
    try {
      console.log(`🧠 Analyzing issue #${issue.number} for similar solutions...`);
      
      // Create search query from issue
      const searchQuery = `${issue.title} ${issue.body || ''}`;
      
      // Find similar PRs
      const similarPRs = await this.findSimilarPRs(searchQuery, repository, {
        threshold: 0.7,
        maxResults: 3
      });
      
      if (similarPRs.length === 0) {
        console.log('   No similar PRs found');
        return null;
      }
      
      // Analyze the most similar PR for solution insights
      const bestMatch = similarPRs[0];
      const solutionAnalysis = await this.analyzeSolution(bestMatch, issue);
      
      return {
        similarPRs: similarPRs,
        bestMatch: bestMatch,
        solutionInsights: solutionAnalysis,
        confidence: bestMatch.similarity
      };
      
    } catch (error) {
      console.error('❌ Issue similarity analysis error:', error.message);
      return null;
    }
  }

  /**
   * Analyze solution from similar PR
   */
  async analyzeSolution(similarPR, originalIssue) {
    try {
      const prompt = `You are analyzing a similar PR to extract solution insights for a new issue.

ORIGINAL ISSUE:
Title: "${originalIssue.title}"
Description: "${originalIssue.body || 'No description'}"

SIMILAR PR (${similarPR.relevanceScore}% match):
Title: "${similarPR.title}"
Description: "${similarPR.body || 'No description'}"
State: ${similarPR.state} (${similarPR.merged_at ? 'Merged' : 'Closed'})

Analyze how the similar PR's solution could apply to the original issue. Return ONLY valid JSON:
{
  "applicability": 0.0-1.0,
  "solutionType": "direct-apply|adapt-approach|reference-only",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "suggestedApproach": "specific approach based on the similar PR",
  "filesLikelyAffected": ["file1.js", "file2.tsx"],
  "estimatedComplexity": "simple|moderate|complex",
  "reasoning": "why this solution is relevant"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 600
      });

      const content = response.choices[0].message.content
        .replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      
      return JSON.parse(content);
      
    } catch (error) {
      console.error('❌ Solution analysis error:', error.message);
      return null;
    }
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCache() {
    this.prCache.clear();
    this.embeddings.clear();
  }
}

// Export singleton instance
const semanticSearch = new SemanticSearchEngine();

/**
 * Main function to enhance issue analysis with semantic search
 */
async function enhanceIssueWithSemanticSearch(issue, repository) {
  try {
    console.log(`🔍 Enhancing issue #${issue.number} with semantic search...`);
    
    // Find similar solutions
    const similarityAnalysis = await semanticSearch.analyzeIssueForSimilarity(issue, repository);
    
    if (!similarityAnalysis) {
      return {
        hasSimilarSolutions: false,
        message: 'No similar solutions found in recent PRs'
      };
    }
    
    const enhancement = {
      hasSimilarSolutions: true,
      similarPRs: similarityAnalysis.similarPRs,
      bestMatch: similarityAnalysis.bestMatch,
      solutionInsights: similarityAnalysis.solutionInsights,
      confidence: similarityAnalysis.confidence,
      recommendations: generateRecommendations(similarityAnalysis)
    };
    
    console.log(`   ✅ Found ${enhancement.similarPRs.length} similar PRs`);
    console.log(`   🎯 Best match: ${enhancement.bestMatch.relevanceScore}% similarity`);
    
    return enhancement;
    
  } catch (error) {
    console.error('❌ Issue enhancement error:', error.message);
    return {
      hasSimilarSolutions: false,
      error: error.message
    };
  }
}

/**
 * Generate recommendations based on similarity analysis
 */
function generateRecommendations(analysis) {
  const { bestMatch, solutionInsights } = analysis;
  const recommendations = [];
  
  if (solutionInsights.applicability > 0.8) {
    recommendations.push(`🎯 High confidence: Solution from PR #${bestMatch.number} directly applicable`);
  } else if (solutionInsights.applicability > 0.6) {
    recommendations.push(`🔄 Moderate confidence: Adapt approach from PR #${bestMatch.number}`);
  } else {
    recommendations.push(`📚 Reference: Use PR #${bestMatch.number} as guidance`);
  }
  
  if (solutionInsights.estimatedComplexity === 'simple') {
    recommendations.push(`⚡ Estimated as simple fix - good candidate for AI code generation`);
  }
  
  if (solutionInsights.filesLikelyAffected.length > 0) {
    recommendations.push(`📁 Likely files: ${solutionInsights.filesLikelyAffected.join(', ')}`);
  }
  
  return recommendations;
}

// Run if called directly
if (require.main === module) {
  console.log('🔍 Semantic Search Engine Test');
  console.log('Use this module by importing: const { enhanceIssueWithSemanticSearch } = require("./semantic-search-engine.js")');
}

module.exports = { 
  enhanceIssueWithSemanticSearch, 
  SemanticSearchEngine,
  semanticSearch
};

