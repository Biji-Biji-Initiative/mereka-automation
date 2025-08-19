#!/usr/bin/env node

/**
 * Demo/Test Script for Enhanced AI Bug Router
 * Tests all components with mock data (no API keys required)
 */

const { EnhancedIssueClassifier } = require('./enhanced-issue-classifier.js');
const { IssueStateTracker } = require('./issue-tracker.js');
const { UserEducationSystem } = require('./user-education-system.js');

class MockEnhancedAIBugRouter {
  constructor() {
    // Mock classifier that doesn't require OpenAI API
    this.classifier = new MockClassifier();
    this.tracker = new IssueStateTracker();
    this.educationSystem = new UserEducationSystem();
  }

  async runDemo() {
    console.log('🚀 Enhanced AI Bug Router - Demo Mode');
    console.log('⏰ Testing all components with sample issues...\n');

    const testIssues = [
      {
        id: 1,
        text: "🆘 Experience cancellation email - Suddenly got the email saying the experience is cancelled. The event is live and is going to happen next week, we didn't cancel it",
        user: "U12345",
        channel: "C12345",
        ts: Date.now() / 1000,
        description: "Real-world admin config issue"
      },
      {
        id: 2,
        text: "🆘 Login button not working, getting 500 error when I click it",
        user: "U23456", 
        channel: "C12345",
        ts: Date.now() / 1000,
        description: "Clear technical bug"
      },
      {
        id: 3,
        text: "🆘 I can't find where to create an experience, help me please",
        user: "U34567",
        channel: "C12345", 
        ts: Date.now() / 1000,
        description: "User education needed"
      },
      {
        id: 4,
        text: "🆘 The website looks different and I don't know how to use it",
        user: "U45678",
        channel: "C12345",
        ts: Date.now() / 1000,
        description: "Vague user confusion"
      },
      {
        id: 5,
        text: "🆘 API returning error code 503 consistently for all users",
        user: "U56789",
        channel: "C12345",
        ts: Date.now() / 1000,
        description: "High-confidence technical bug"
      }
    ];

    const results = [];

    for (const issue of testIssues) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Testing Issue ${issue.id}: ${issue.description}`);
      console.log(`📝 Text: "${issue.text}"`);
      console.log(`${'='.repeat(60)}`);

      try {
        const result = await this.processTestIssue(issue);
        results.push({ issue, result });
        
        console.log(`✅ Result: ${result.recommendation.action}`);
        console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`🎯 Workflow: ${result.recommendation.workflow}`);
        
      } catch (error) {
        console.error(`❌ Error processing issue ${issue.id}:`, error.message);
        results.push({ issue, error: error.message });
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 DEMO SUMMARY');
    console.log(`${'='.repeat(60)}`);
    
    this.printDemoSummary(results);
    this.demonstrateEmojiControls();
    this.demonstrateDeduplication();
    
    return results;
  }

  async processTestIssue(issue) {
    // Test the classification system
    const hasEmergencyEmoji = /🆘/.test(issue.text);
    const userContext = { userType: 'unknown', techLevel: 'unknown' };
    
    const classification = await this.classifier.classifyIssue(
      issue.text,
      userContext, 
      hasEmergencyEmoji
    );

    // Test deduplication 
    const trackingResult = await this.tracker.trackIssue(issue, classification);
    
    return classification;
  }

  printDemoSummary(results) {
    const successful = results.filter(r => !r.error);
    const byAction = {};
    
    successful.forEach(r => {
      const action = r.result.recommendation.action;
      byAction[action] = (byAction[action] || 0) + 1;
    });

    console.log(`📈 Total Issues Processed: ${results.length}`);
    console.log(`✅ Successful Classifications: ${successful.length}`);
    console.log(`❌ Errors: ${results.length - successful.length}`);
    console.log(`\n📋 Action Distribution:`);
    
    Object.entries(byAction).forEach(([action, count]) => {
      const emoji = this.getActionEmoji(action);
      console.log(`   ${emoji} ${action}: ${count} issue(s)`);
    });

    console.log(`\n🎯 Key Benefits Demonstrated:`);
    console.log(`   ✅ Intelligent classification prevents false bug fixes`);
    console.log(`   ✅ User education reduces support burden`);
    console.log(`   ✅ Confidence scoring ensures accuracy`);
    console.log(`   ✅ Multi-workflow routing handles all cases`);
  }

  demonstrateEmojiControls() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🎮 EMOJI CONTROL SYSTEM DEMO');
    console.log(`${'='.repeat(60)}`);
    
    console.log(`\n📱 Emoji Controls Available:`);
    console.log(`   🆘 - Add to message to trigger AI Bug Router`);
    console.log(`   🚨 - React to escalate (override AI decision)`);
    console.log(`   🙋 - React to mark as user education`);
    console.log(`   🤖 - React to add to AI training`);
    
    console.log(`\n💡 Example Usage:`);
    console.log(`   1. User reports: "Can't login 🆘"`);
    console.log(`   2. AI responds: "Sending help guide (user education)"`);
    console.log(`   3. Team member adds 🚨 reaction`);
    console.log(`   4. System creates urgent bug ticket + starts code fix`);
    
    console.log(`\n🔄 Feedback Loop:`);
    console.log(`   • Every override teaches the AI`);
    console.log(`   • Classification accuracy improves over time`);
    console.log(`   • Weekly reports show improvement metrics`);
  }

  demonstrateDeduplication() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔄 DEDUPLICATION SYSTEM DEMO');
    console.log(`${'='.repeat(60)}`);
    
    console.log(`\n🛡️ Prevents These Problems:`);
    console.log(`   ❌ Day 1: Create ticket #123 for "login issue"`);
    console.log(`   ❌ Day 2: Create ticket #124 for SAME login issue`);
    console.log(`   ❌ Day 3: Create ticket #125 for SAME login issue`);
    console.log(`   = CHAOS! Multiple PRs for same issue`);
    
    console.log(`\n✅ Enhanced System Instead:`);
    console.log(`   ✅ Day 1: Create ticket #123 for "login issue"`);
    console.log(`   ✅ Day 2: "Duplicate detected! See ticket #123"`);
    console.log(`   ✅ Day 3: "Still working on #123, sending reminder"`);
    console.log(`   = ORGANIZED! One issue, one solution`);
    
    console.log(`\n⏰ Smart Time Handling:`);
    console.log(`   • Tracks issue lifecycle and states`);
    console.log(`   • Escalates stuck issues automatically`);
    console.log(`   • Sends reminders for pending PRs`);
    console.log(`   • Prevents duplicate work chaos`);
  }

  getActionEmoji(action) {
    const emojis = {
      'AI_CODE_ANALYSIS_APPROVED': '🤖',
      'USER_EDUCATION_RESPONSE': '📚',
      'HUMAN_INVESTIGATION_REQUIRED': '👤',
      'ADMIN_INVESTIGATION': '⚙️',
      'EMERGENCY_HUMAN_REVIEW': '🚨'
    };
    return emojis[action] || '❓';
  }
}

// Mock classifier that works without OpenAI API
class MockClassifier {
  async classifyIssue(issueText, userContext, hasEmergencyEmoji) {
    console.log('🔍 Running mock classification...');
    
    // Simple pattern-based classification for demo
    const text = issueText.toLowerCase();
    
    let classification;
    if (text.includes('error') && text.includes('500')) {
      classification = {
        probabilities: { humanError: 5, codeBug: 85, adminConfig: 5, infrastructure: 5 },
        confidence: 0.9,
        recommendation: {
          action: 'AI_CODE_ANALYSIS_APPROVED',
          reason: 'High probability HTTP 500 error indicates code bug',
          priority: 'high',
          workflow: 'ai_code_generation_approved'
        }
      };
    } else if (text.includes('email') && text.includes('cancelled')) {
      classification = {
        probabilities: { humanError: 10, codeBug: 5, adminConfig: 80, infrastructure: 5 },
        confidence: 0.8,
        recommendation: {
          action: 'ADMIN_INVESTIGATION',
          reason: 'Email cancellation likely admin action',
          priority: 'high', 
          workflow: 'admin_review_required'
        }
      };
    } else if (text.includes('find') || text.includes('help') || text.includes('how')) {
      classification = {
        probabilities: { humanError: 85, codeBug: 5, adminConfig: 5, infrastructure: 5 },
        confidence: 0.9,
        recommendation: {
          action: 'USER_EDUCATION_RESPONSE',
          reason: 'User needs guidance, not code fix',
          priority: 'low',
          workflow: 'automated_education_response'
        }
      };
    } else if (text.includes('different') || text.includes('looks')) {
      classification = {
        probabilities: { humanError: 60, codeBug: 20, adminConfig: 15, infrastructure: 5 },
        confidence: 0.5,
        recommendation: {
          action: 'HUMAN_INVESTIGATION_REQUIRED',
          reason: 'Ambiguous case - requires human judgment',
          priority: 'medium',
          workflow: 'human_review_then_decision'
        }
      };
    } else if (text.includes('api') && text.includes('503')) {
      classification = {
        probabilities: { humanError: 5, codeBug: 90, adminConfig: 3, infrastructure: 2 },
        confidence: 0.95,
        recommendation: {
          action: 'AI_CODE_ANALYSIS_APPROVED',
          reason: 'API 503 error with high confidence',
          priority: 'high',
          workflow: 'ai_code_generation_approved'
        }
      };
    } else {
      classification = {
        probabilities: { humanError: 40, codeBug: 30, adminConfig: 20, infrastructure: 10 },
        confidence: 0.4,
        recommendation: {
          action: 'HUMAN_INVESTIGATION_REQUIRED',
          reason: 'Low confidence - requires human review',
          priority: 'medium',
          workflow: 'human_review_then_decision'
        }
      };
    }

    // Add mock analysis details
    classification.patternAnalysis = { confidence: 0.7, matchedPatterns: [] };
    classification.rootCauseAnalysis = { confidence: classification.confidence };
    classification.technicalValidation = { valid: true, score: 0.8 };
    
    return classification;
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new MockEnhancedAIBugRouter();
  demo.runDemo().catch(error => {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { MockEnhancedAIBugRouter };
