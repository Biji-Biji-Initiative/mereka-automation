/**
 * Enhanced AI Bug Router - Issue Classification System
 * Intelligently classifies Slack issues to prevent false code fixes
 */

class EnhancedIssueClassifier {
  constructor(openaiApiKey) {
    this.openaiApiKey = openaiApiKey;
    this.patterns = {
      // HIGH HUMAN ERROR INDICATORS
      humanErrorSignals: {
        confusion_language: [
          /i don't understand/i, /confusing/i, /unclear/i, /how do i/i,
          /where is/i, /can't find/i, /don't know how to/i, /help me/i,
          /what does.*mean/i, /how to/i, /tutorial/i, /guide/i,
          /instructions/i, /explain/i, /show me/i, /walk me through/i
        ],
        user_action_timing: [
          /suddenly/i, /out of nowhere/i, /randomly/i, /for no reason/i,
          /just now/i, /this morning/i, /today/i, /yesterday/i,
          /after i/i, /when i tried/i, /after clicking/i, /after changing/i,
          /right after/i, /immediately after/i, /as soon as/i
        ],
        user_actions: [
          /i clicked/i, /i tried to/i, /i attempted/i, /i changed/i,
          /i updated/i, /i deleted/i, /i added/i, /i removed/i,
          /i entered/i, /i selected/i, /i uploaded/i, /i downloaded/i,
          /i logged in/i, /i signed up/i, /i filled out/i, /i submitted/i
        ],
        environment_issues: [
          /on my phone/i, /mobile/i, /iphone/i, /android/i, /tablet/i,
          /browser/i, /chrome/i, /safari/i, /firefox/i, /edge/i,
          /internet/i, /wifi/i, /connection/i, /slow/i, /loading/i,
          /cache/i, /cookies/i, /incognito/i, /private mode/i
        ],
        account_issues: [
          /forgot password/i, /can't remember/i, /lost password/i,
          /account locked/i, /banned/i, /suspended/i, /expired/i,
          /subscription/i, /billing/i, /payment/i, /credit card/i,
          /profile incomplete/i, /verification/i, /email not verified/i
        ]
      },

      // HIGH CODE BUG INDICATORS  
      codeBugSignals: {
        technical_errors: [
          /error code/i, /error \d+/i, /\d{3}\s*error/i, /http.*error/i,
          /exception/i, /stack trace/i, /console error/i, /javascript error/i,
          /syntax error/i, /runtime error/i, /compilation error/i,
          /null reference/i, /undefined/i, /cannot read property/i
        ],
        system_failures: [
          /timeout/i, /timed out/i, /failed to load/i, /won't load/i,
          /page crash/i, /browser crash/i, /app crash/i, /freezes/i,
          /infinite loop/i, /endless loading/i, /stuck loading/i,
          /memory leak/i, /performance issue/i, /very slow/i
        ],
        api_database_issues: [
          /api.*error/i, /api.*fail/i, /server error/i, /database error/i,
          /connection failed/i, /network error/i, /request failed/i,
          /response error/i, /query failed/i, /data not saving/i
        ],
        consistency_patterns: [
          /always happens/i, /every time/i, /consistently/i, /reproducible/i,
          /all users/i, /everyone/i, /multiple people/i, /widespread/i,
          /across all browsers/i, /on all devices/i, /systematic/i
        ],
        ui_bugs: [
          /button.*not.*working/i, /click.*not.*responding/i, /unclickable/i,
          /layout.*broken/i, /css.*issue/i, /styling.*problem/i,
          /text overlapping/i, /images not loading/i, /responsive/i,
          /mobile.*view/i, /dropdown.*broken/i, /form.*not.*submitting/i
        ],
        encoding_formatting_bugs: [
          /symbols.*not.*generating/i, /characters.*not.*displaying/i, /encoding.*issue/i,
          /apostrophe.*not.*working/i, /ampersand.*not.*working/i, /special.*characters/i,
          /text.*formatting.*broken/i, /character.*encoding/i, /utf.*8/i,
          /symbols.*glitchy/i, /characters.*glitchy/i, /formatting.*glitchy/i,
          /email.*subject.*glitchy/i, /template.*rendering/i, /html.*entities/i,
          /escape.*characters/i, /unicode.*issue/i, /charset.*problem/i
        ]
      },

      // HIGH ADMIN/CONFIG INDICATORS
      adminConfigSignals: {
        system_changes: [
          /since the update/i, /after maintenance/i, /since deployment/i,
          /after the release/i, /new version/i, /upgrade/i, /migration/i,
          /configuration/i, /settings changed/i, /admin panel/i,
          /backend change/i, /server update/i, /database migration/i
        ],
        permission_issues: [
          /permission denied/i, /access denied/i, /unauthorized/i,
          /can't access/i, /locked out/i, /restricted/i, /forbidden/i,
          /admin.*removed/i, /privileges.*revoked/i, /role.*changed/i,
          /account.*disabled/i, /user.*suspended/i
        ],
        communication_systems: [
          /email.*not.*sent/i, /notification.*missing/i, /alert.*not.*received/i,
          /campaign.*stopped/i, /mailing.*list/i, /unsubscribed/i,
          /email.*service/i, /smtp.*error/i, /delivery.*failed/i
        ],
        data_mapping_issues: [
          /wrong.*name.*email/i, /incorrect.*host.*name/i, /different.*name.*appears/i,
          /wrong.*user.*data/i, /profile.*mix.*up/i, /wrong.*information.*email/i,
          /template.*variable/i, /email.*template.*wrong/i, /substitution.*error/i,
          /wrong.*recipient.*data/i, /email.*shows.*wrong/i, /name.*mismatch/i,
          /role.*listed.*as/i, /admin.*instead.*of/i, /profile.*incorrect/i,
          /user.*details.*wrong/i, /email.*personalization/i, /merge.*field/i
        ]
      }
    };

    this.weights = {
      technical_errors: 3.0,
      system_failures: 2.5,
      user_actions: 2.0,
      confusion_language: 1.8,
      permission_issues: 2.2,
      system_changes: 1.9,
      data_mapping_issues: 2.5,
      encoding_formatting_bugs: 2.8
    };
  }

  /**
   * Main classification method
   */
  async classifyIssue(issueText, userContext = {}, hasEmergencyEmoji = false) {
    console.log('🔍 Starting enhanced issue classification...');
    
    // Step 1: Pattern-based analysis
    const patternAnalysis = this.analyzePatterns(issueText);
    
    // Step 2: AI-powered root cause analysis
    const rootCauseAnalysis = await this.analyzeRootCause(issueText, userContext);
    
    // Step 3: Technical evidence validation
    const technicalValidation = this.validateTechnicalEvidence(issueText);
    
    // Step 4: Synthesize all analyses
    const finalClassification = this.synthesizeAnalysis(
      patternAnalysis, 
      rootCauseAnalysis, 
      technicalValidation,
      hasEmergencyEmoji
    );

    console.log('✅ Classification complete:', finalClassification.recommendation.action);
    return finalClassification;
  }

  /**
   * Pattern-based analysis using our comprehensive patterns
   */
  analyzePatterns(issueText) {
    const scores = {
      humanError: 0,
      codeBug: 0,
      adminConfig: 0
    };

    // Analyze each pattern category
    Object.entries(this.patterns).forEach(([categoryGroup, signals]) => {
      Object.entries(signals).forEach(([patternType, patternArray]) => {
        const matchCount = patternArray.filter(pattern => 
          pattern.test(issueText)
        ).length;

        if (matchCount > 0) {
          const weight = this.weights[patternType] || 1.0;
          const score = matchCount * weight;

          // Map pattern types to root cause categories
          if (categoryGroup === 'humanErrorSignals') {
            scores.humanError += score;
          } else if (categoryGroup === 'codeBugSignals') {
            scores.codeBug += score;
          } else if (categoryGroup === 'adminConfigSignals') {
            scores.adminConfig += score;
          }
        }
      });
    });

    // Normalize scores to percentages
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    if (totalScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = (scores[key] / totalScore) * 100;
      });
    }

    return {
      scores,
      totalMatches: totalScore,
      confidence: this.calculatePatternConfidence(totalScore),
      matchedPatterns: this.getMatchedPatterns(issueText)
    };
  }

  /**
   * AI-powered root cause analysis using GPT-4
   */
  async analyzeRootCause(issueText, userContext) {
    const prompt = `
    Analyze this issue report and determine the probability of different root causes:

    ISSUE REPORT: "${issueText}"
    
    USER CONTEXT:
    - User Type: ${userContext.userType || 'unknown'}
    - Technical Level: ${userContext.techLevel || 'unknown'}
    - Previous Issues: ${userContext.previousIssues || 'none'}
    
    Please analyze and provide probabilities (0-100%) for each category:

    1. HUMAN ERROR PROBABILITY:
       - User configuration mistake
       - User misunderstanding features
       - User account/permission issues
       - User environment issues (browser, device, etc.)
       
    2. ADMIN/CONFIGURATION PROBABILITY:
       - Admin action caused the issue
       - System configuration change
       - Database/backend configuration
       - Third-party service configuration
       
    3. ACTUAL CODE BUG PROBABILITY:
       - Frontend code bug
       - Backend code bug
       - API integration bug
       - Database query bug
       
    4. INFRASTRUCTURE PROBABILITY:
       - Server/hosting issues
       - Network connectivity
       - Third-party service down
       - Performance/scaling issues

    Return JSON format:
    {
      "humanError": { "probability": 0, "reasons": [] },
      "adminConfig": { "probability": 0, "reasons": [] },
      "codeBug": { "probability": 0, "reasons": [] },
      "infrastructure": { "probability": 0, "reasons": [] },
      "confidence": 0.0,
      "reasoning": "detailed explanation"
    }
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an expert software issue analyst. Always return valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      console.log('🤖 AI root cause analysis completed');
      return analysis;
    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Validate technical evidence in the issue report
   */
  validateTechnicalEvidence(issueText) {
    const evidence = {
      hasSteps: /steps?.*reproduce|to reproduce|how to replicate/i.test(issueText),
      hasErrorMessage: /error|exception|failed|timeout|\d{3}\s+error/i.test(issueText),
      hasSpecificBehavior: /expected|should|actual|instead/i.test(issueText),
      hasVagueLanguage: /i think|maybe|might be|not sure|sometimes|occasionally/i.test(issueText)
    };

    let evidenceScore = 0;
    if (evidence.hasSteps) evidenceScore += 0.4;
    if (evidence.hasErrorMessage) evidenceScore += 0.3;
    if (evidence.hasSpecificBehavior) evidenceScore += 0.3;

    const valid = evidenceScore >= 0.6 && !evidence.hasVagueLanguage;
    
    return { 
      valid, 
      score: evidenceScore, 
      evidence,
      reasons: this.getValidationReasons(evidence)
    };
  }

  /**
   * Synthesize all analyses into final decision
   */
  synthesizeAnalysis(patternAnalysis, rootCauseAnalysis, technicalValidation, hasEmergencyEmoji) {
    // Weighted combination of analyses
    const weights = {
      rootCause: 0.4,
      patterns: 0.3,
      technical: 0.3
    };

    const finalProbabilities = {
      humanError: (rootCauseAnalysis.humanError.probability * weights.rootCause) +
                  (patternAnalysis.scores.humanError * weights.patterns),
      codeBug: (rootCauseAnalysis.codeBug.probability * weights.rootCause) +
               (patternAnalysis.scores.codeBug * weights.patterns),
      adminConfig: (rootCauseAnalysis.adminConfig.probability * weights.rootCause) +
                   (patternAnalysis.scores.adminConfig * weights.patterns),
      infrastructure: rootCauseAnalysis.infrastructure.probability * weights.rootCause
    };

    // Technical validation affects confidence
    const overallConfidence = Math.min(
      rootCauseAnalysis.confidence,
      patternAnalysis.confidence,
      technicalValidation.valid ? 0.9 : 0.5
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      finalProbabilities, 
      overallConfidence, 
      technicalValidation,
      hasEmergencyEmoji
    );

    return {
      probabilities: finalProbabilities,
      confidence: overallConfidence,
      recommendation,
      patternAnalysis,
      rootCauseAnalysis,
      technicalValidation,
      reasoning: this.generateDetailedReasoning(patternAnalysis, rootCauseAnalysis, technicalValidation)
    };
  }

  /**
   * Generate action recommendation based on analysis
   */
  generateRecommendation(probabilities, confidence, technicalValidation, hasEmergencyEmoji) {
    const maxProb = Math.max(...Object.values(probabilities));
    const topCategory = Object.keys(probabilities).find(key => 
      probabilities[key] === maxProb
    );

    // Emergency emoji override
    if (hasEmergencyEmoji && confidence < 0.7) {
      return {
        action: 'EMERGENCY_HUMAN_REVIEW',
        reason: 'Emergency emoji detected but issue unclear - requires human judgment',
        priority: 'urgent',
        workflow: 'emergency_human_review'
      };
    }

    // Low confidence requires human review
    if (maxProb < 60 || confidence < 0.6) {
      return {
        action: 'HUMAN_INVESTIGATION_REQUIRED',
        reason: 'Ambiguous case - requires human judgment',
        priority: 'medium',
        workflow: 'human_review_then_decision'
      };
    }

    // High confidence recommendations
    const recommendations = {
      humanError: {
        action: 'USER_EDUCATION_RESPONSE',
        reason: 'High probability of user configuration or understanding issue',
        priority: 'low',
        workflow: 'automated_education_response'
      },
      adminConfig: {
        action: 'ADMIN_INVESTIGATION',
        reason: 'High probability of configuration or administrative issue',
        priority: 'high',
        workflow: 'admin_review_required'
      },
      codeBug: {
        action: 'AI_CODE_ANALYSIS_APPROVED',
        reason: 'High probability of actual code bug with sufficient evidence',
        priority: 'high',
        workflow: 'ai_code_generation_approved'
      },
      infrastructure: {
        action: 'INFRASTRUCTURE_CHECK',
        reason: 'High probability of infrastructure or third-party issue',
        priority: 'high',
        workflow: 'devops_investigation'
      }
    };

    return recommendations[topCategory] || recommendations.humanError;
  }

  // Helper methods
  calculatePatternConfidence(totalScore) {
    if (totalScore >= 10) return 0.9;
    if (totalScore >= 7) return 0.8;
    if (totalScore >= 5) return 0.7;
    if (totalScore >= 3) return 0.6;
    if (totalScore >= 1) return 0.5;
    return 0.3;
  }

  getMatchedPatterns(issueText) {
    const matched = [];
    Object.entries(this.patterns).forEach(([categoryGroup, signals]) => {
      Object.entries(signals).forEach(([patternType, patternArray]) => {
        patternArray.forEach(pattern => {
          if (pattern.test(issueText)) {
            matched.push({
              category: categoryGroup,
              type: patternType,
              pattern: pattern.source,
              match: issueText.match(pattern)?.[0]
            });
          }
        });
      });
    });
    return matched;
  }

  getValidationReasons(evidence) {
    const missing = [];
    if (!evidence.hasSteps) missing.push("reproduction steps");
    if (!evidence.hasErrorMessage) missing.push("error details");
    if (!evidence.hasSpecificBehavior) missing.push("expected vs actual behavior");
    if (evidence.hasVagueLanguage) missing.push("contains vague language");
    return missing;
  }

  generateDetailedReasoning(patternAnalysis, rootCauseAnalysis, technicalValidation) {
    return [
      `Pattern confidence: ${(patternAnalysis.confidence * 100).toFixed(1)}%`,
      `AI analysis confidence: ${(rootCauseAnalysis.confidence * 100).toFixed(1)}%`,
      `Technical evidence: ${technicalValidation.valid ? 'Sufficient' : 'Insufficient'}`,
      `Matched patterns: ${patternAnalysis.matchedPatterns.length}`,
      technicalValidation.reasons.length > 0 ? `Missing: ${technicalValidation.reasons.join(', ')}` : ''
    ].filter(Boolean);
  }

  getFallbackAnalysis() {
    return {
      humanError: { probability: 40, reasons: ['AI analysis unavailable'] },
      adminConfig: { probability: 20, reasons: ['AI analysis unavailable'] },
      codeBug: { probability: 20, reasons: ['AI analysis unavailable'] },
      infrastructure: { probability: 20, reasons: ['AI analysis unavailable'] },
      confidence: 0.3,
      reasoning: 'Fallback analysis - AI service unavailable'
    };
  }
}

module.exports = { EnhancedIssueClassifier };
