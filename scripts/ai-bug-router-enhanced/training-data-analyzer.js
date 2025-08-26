#!/usr/bin/env node

/**
 * AI Training Data Analyzer
 * Reads ClickUp training examples and generates AI improvements
 */

const fetch = require('node-fetch');

class TrainingDataAnalyzer {
  constructor(clickupToken) {
    this.clickupToken = clickupToken;
    this.baseUrl = 'https://api.clickup.com/api/v2';
    this.trainingListId = '901610583307'; // AI Training Examples list
  }

  /**
   * Fetch all training examples from ClickUp
   */
  async fetchTrainingData() {
    console.log('📊 Fetching AI training data from ClickUp...');
    
    const response = await fetch(`${this.baseUrl}/list/${this.trainingListId}/task?include_closed=true`, {
      headers: {
        'Authorization': this.clickupToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.tasks.length} training examples`);
    return data.tasks;
  }

  /**
   * Parse training data from task descriptions
   */
  parseTrainingExamples(tasks) {
    console.log('🔍 Parsing training examples...');
    
    const examples = [];
    
    for (const task of tasks) {
      try {
        const description = task.description;
        
        // Extract data using regex patterns
        const originalMessageMatch = description.match(/📝 \*\*Original Message:\*\*\n(.*?)(?=\n\n🧠)/s);
        const aiClassificationMatch = description.match(/🧠 \*\*AI Classification:\*\*\n(.*?)(?=\n\n👤)/s);
        const confidenceMatch = description.match(/📊 \*\*Confidence Score:\*\* ([\d.]+)/);
        const feedbackUserMatch = description.match(/👤 \*\*Human Feedback By:\*\* (.*?)(?=\n)/);
        
        if (originalMessageMatch && aiClassificationMatch) {
          examples.push({
            taskId: task.id,
            taskName: task.name,
            originalMessage: originalMessageMatch[1].trim(),
            aiClassification: aiClassificationMatch[1].trim(),
            confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
            feedbackUser: feedbackUserMatch ? feedbackUserMatch[1].trim() : 'unknown',
            dateCreated: new Date(parseInt(task.date_created)),
            status: task.status.status,
            url: task.url
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not parse task ${task.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Parsed ${examples.length} valid training examples`);
    return examples;
  }

  /**
   * Analyze patterns in AI classification mistakes
   */
  analyzePatterns(examples) {
    console.log('🧠 Analyzing AI classification patterns...');
    
    const analysis = {
      totalExamples: examples.length,
      classificationPatterns: {},
      confidenceAnalysis: {
        lowConfidence: examples.filter(e => e.confidence && e.confidence < 0.5),
        mediumConfidence: examples.filter(e => e.confidence && e.confidence >= 0.5 && e.confidence < 0.8),
        highConfidence: examples.filter(e => e.confidence && e.confidence >= 0.8)
      },
      commonMistakes: [],
      improvementRecommendations: []
    };

    // Group by AI classification
    examples.forEach(example => {
      const classification = example.aiClassification;
      if (!analysis.classificationPatterns[classification]) {
        analysis.classificationPatterns[classification] = [];
      }
      analysis.classificationPatterns[classification].push(example);
    });

    // Identify common mistake patterns
    this.identifyCommonMistakes(examples, analysis);
    
    // Generate improvement recommendations
    this.generateImprovements(analysis);

    return analysis;
  }

  /**
   * Identify common classification mistakes
   */
  identifyCommonMistakes(examples, analysis) {
    console.log('🔍 Identifying common mistake patterns...');
    
    const mistakePatterns = [];
    
    // Look for keywords that indicate common misclassifications
    examples.forEach(example => {
      const message = example.originalMessage.toLowerCase();
      const classification = example.aiClassification;
      
      // Common patterns that suggest misclassification
      if (message.includes('mobile') && classification === 'USER_EDUCATION_RESPONSE') {
        mistakePatterns.push({
          pattern: 'Mobile issues classified as user education',
          example: example.originalMessage.substring(0, 100) + '...',
          count: 1
        });
      }
      
      if ((message.includes('login') || message.includes('sign in')) && classification === 'USER_EDUCATION_RESPONSE') {
        mistakePatterns.push({
          pattern: 'Login issues classified as user education',
          example: example.originalMessage.substring(0, 100) + '...',
          count: 1
        });
      }
      
      if (message.includes('payment') && classification !== 'ISSUE_REPORT') {
        mistakePatterns.push({
          pattern: 'Payment issues not classified as bugs',
          example: example.originalMessage.substring(0, 100) + '...',
          count: 1
        });
      }
    });

    // Aggregate patterns
    const aggregatedPatterns = {};
    mistakePatterns.forEach(pattern => {
      if (aggregatedPatterns[pattern.pattern]) {
        aggregatedPatterns[pattern.pattern].count++;
      } else {
        aggregatedPatterns[pattern.pattern] = pattern;
      }
    });

    analysis.commonMistakes = Object.values(aggregatedPatterns);
  }

  /**
   * Generate improvement recommendations
   */
  generateImprovements(analysis) {
    console.log('💡 Generating improvement recommendations...');
    
    const recommendations = [];

    // Low confidence issues
    if (analysis.confidenceAnalysis.lowConfidence.length > 0) {
      recommendations.push({
        type: 'CONFIDENCE_IMPROVEMENT',
        priority: 'HIGH',
        description: `${analysis.confidenceAnalysis.lowConfidence.length} examples with low confidence (<50%). Consider improving classification rules.`,
        action: 'Review low-confidence examples and add specific keyword patterns'
      });
    }

    // Common mistake patterns
    analysis.commonMistakes.forEach(mistake => {
      if (mistake.count > 1) {
        recommendations.push({
          type: 'CLASSIFICATION_RULE',
          priority: 'MEDIUM',
          description: mistake.pattern,
          action: `Add specific classification rule for this pattern (${mistake.count} occurrences)`,
          example: mistake.example
        });
      }
    });

    // Classification distribution
    const totalClassifications = Object.keys(analysis.classificationPatterns).length;
    if (totalClassifications > 5) {
      recommendations.push({
        type: 'SIMPLIFY_CLASSIFICATIONS',
        priority: 'LOW',
        description: `Using ${totalClassifications} different classifications. Consider consolidating.`,
        action: 'Review and simplify classification categories'
      });
    }

    analysis.improvementRecommendations = recommendations;
  }

  /**
   * Generate updated AI prompts based on training data
   */
  generateUpdatedPrompts(analysis) {
    console.log('📝 Generating updated AI prompts...');
    
    let updatedPrompt = `
# AI Bug Classification - Enhanced with Training Data

Based on ${analysis.totalExamples} human feedback examples, classify Slack messages into these categories:

## Classification Rules (Updated from Training Data):

### ISSUE_REPORT (Real Bugs)
- Technical problems that prevent functionality
- Error messages or broken features  
- Payment/financial issues (HIGH PRIORITY: ${analysis.commonMistakes.filter(m => m.pattern.includes('Payment')).length} training examples)
- Mobile-specific problems (ATTENTION: Often misclassified as user education)
- Login/authentication failures (ATTENTION: ${analysis.commonMistakes.filter(m => m.pattern.includes('Login')).length} examples misclassified)

### USER_EDUCATION_RESPONSE  
- Questions about how to use features
- Requests for documentation or tutorials
- NOT mobile bugs or login issues (common mistake from training data)

### FEATURE_REQUEST
- Suggestions for new functionality
- Enhancement requests

## Key Improvements from Training Data:
${analysis.commonMistakes.map(mistake => `- ${mistake.pattern} (${mistake.count} examples)`).join('\n')}

## Confidence Guidelines:
- High confidence (>0.8): Clear technical language, specific error descriptions
- Medium confidence (0.5-0.8): Ambiguous language, context needed
- Low confidence (<0.5): Unclear intent, requires human review
`;

    return updatedPrompt;
  }

  /**
   * Create ClickUp task with analysis results
   */
  async createAnalysisReport(analysis, updatedPrompt) {
    console.log('📊 Creating analysis report in ClickUp...');
    
    const reportTask = {
      name: `[AI ANALYSIS] Training Data Review - ${new Date().toLocaleDateString()}`,
      description: `🧠 **AI TRAINING DATA ANALYSIS REPORT**

📊 **Summary:**
- Total Training Examples: ${analysis.totalExamples}
- Analysis Date: ${new Date().toLocaleString()}
- Low Confidence Examples: ${analysis.confidenceAnalysis.lowConfidence.length}
- Medium Confidence Examples: ${analysis.confidenceAnalysis.mediumConfidence.length}  
- High Confidence Examples: ${analysis.confidenceAnalysis.highConfidence.length}

🔍 **Common Classification Mistakes:**
${analysis.commonMistakes.map(mistake => `- ${mistake.pattern} (${mistake.count} occurrences)`).join('\n')}

💡 **Improvement Recommendations:**
${analysis.improvementRecommendations.map(rec => `- [${rec.priority}] ${rec.description}`).join('\n')}

📝 **Updated AI Prompt:**
\`\`\`
${updatedPrompt}
\`\`\`

🔄 **Next Steps:**
1. [ ] Review low confidence examples
2. [ ] Update AI classification prompts  
3. [ ] Test improved classification
4. [ ] Deploy updated system
5. [ ] Schedule next analysis (recommended: weekly)

📈 **Performance Tracking:**
- Previous Analysis: [Link to previous report]
- Improvement Metrics: [To be measured]
- Success Rate: [To be calculated]`,
      priority: 2,
      status: 'to do',
      assignees: [66733245], // Fadlan
      tags: ['ai-analysis', 'training-review', 'improvement']
    };

    const response = await fetch(`${this.baseUrl}/list/${this.trainingListId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': this.clickupToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportTask)
    });

    if (!response.ok) {
      throw new Error(`Failed to create analysis report: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Analysis report created: ${result.url}`);
    return result;
  }

  /**
   * Run complete training data analysis
   */
  async runAnalysis() {
    try {
      console.log('🚀 Starting AI Training Data Analysis...');
      console.log('=====================================');

      // Step 1: Fetch training data
      const tasks = await this.fetchTrainingData();
      
      if (tasks.length === 0) {
        console.log('ℹ️ No training data found. Add some 🤖 emoji reactions first!');
        return;
      }

      // Step 2: Parse examples
      const examples = this.parseTrainingExamples(tasks);
      
      if (examples.length === 0) {
        console.log('⚠️ No valid training examples found. Check task format.');
        return;
      }

      // Step 3: Analyze patterns
      const analysis = this.analyzePatterns(examples);

      // Step 4: Generate updated prompts
      const updatedPrompt = this.generateUpdatedPrompts(analysis);

      // Step 5: Create report in ClickUp
      const report = await this.createAnalysisReport(analysis, updatedPrompt);

      // Step 6: Display summary
      console.log('\n🎉 Analysis Complete!');
      console.log('====================');
      console.log(`📊 Analyzed ${examples.length} training examples`);
      console.log(`🔍 Found ${analysis.commonMistakes.length} common mistake patterns`);
      console.log(`💡 Generated ${analysis.improvementRecommendations.length} improvement recommendations`);
      console.log(`📝 Created analysis report: ${report.url}`);
      console.log('\n🔄 Next: Review the report and update your AI classification prompts!');

      return {
        analysis,
        updatedPrompt,
        report
      };

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  if (!process.env.CLICKUP_TOKEN) {
    throw new Error('❌ CLICKUP_TOKEN environment variable is required');
  }
  const analyzer = new TrainingDataAnalyzer(process.env.CLICKUP_TOKEN);
  analyzer.runAnalysis().catch(console.error);
}

module.exports = { TrainingDataAnalyzer };

