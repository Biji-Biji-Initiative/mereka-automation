const express = require('express');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
const secretClient = new SecretManagerServiceClient();

app.use(express.json());

// Initialize OpenAI client (will be set up with API key from secrets)
let openai = null;

// Helper function to get secrets from Google Secret Manager
async function getSecret(secretName) {
  try {
    const name = `projects/mereka-dev/secrets/${secretName}/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    return version.payload.data.toString();
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}

// Repository routing registry for Biji-Biji-Initiative production repositories
const REPO_REGISTRY = {
  'mereka-web': ['frontend', 'ui', 'web', 'client', 'react', 'nextjs', 'typescript', 'component', 'interface', 'login', 'dashboard', 'experience', 'expert', 'job', 'user', 'mobile', 'responsive', 'css', 'styling', 'form', 'validation', 'routing', 'navigation'],
  'mereka-web-ssr': ['ssr', 'server-side', 'rendering', 'nextjs', 'seo', 'performance', 'hydration', 'static', 'generation', 'pre-rendering', 'meta', 'og', 'sitemap'],
  'mereka-cloudfunctions': ['backend', 'api', 'server', 'cloud', 'functions', 'firebase', 'google-cloud', 'serverless', 'authentication', 'auth', 'database', 'firestore', 'payment', 'stripe', 'webhook', 'cron', 'scheduled', 'email', 'notification', 'push'],
  'Fadlan-Personal': ['automation', 'test', 'qa', 'playwright', 'testing', 'triage', 'routing', 'bug-routing', 'ci-cd', 'deployment']
};

// GitHub client functions
async function createGitHubIssue(repo, title, body, labels = []) {
  try {
    const token = await getSecret('GITHUB_TOKEN');
    if (!token) throw new Error('GitHub token not found');
    
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    const response = await axios.post(`https://api.github.com/repos/${repo}/issues`, {
      title,
      body,
      labels
    }, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });
    
    return {
      number: response.data.number,
      url: response.data.html_url,
      id: response.data.id
    };
  } catch (error) {
    console.error('❌ Error creating GitHub issue:', error.response?.data || error.message);
    return null;
  }
}

// AI-powered repository router
/**
 * Enhanced repository routing with AI-powered analysis
 * Phase 2 Enhancement: Advanced routing using AI classification
 */
async function routeToRepository(aiAnalysis) {
  console.log('🔍 Starting enhanced repository routing...');
  
  // If AI provided repository hints, use them with high priority
  if (aiAnalysis.repositoryHints) {
    console.log('🎯 Using AI repository hints:', aiAnalysis.repositoryHints);
    
    const aiChoice = aiAnalysis.repositoryHints.primary;
    const aiAlternatives = aiAnalysis.repositoryHints.alternatives || [];
    const aiReasoning = aiAnalysis.repositoryHints.reasoning;
    
    // Validate AI choice against known repositories
    const validRepos = Object.keys(REPO_REGISTRY);
    const isValidChoice = validRepos.includes(aiChoice);
    
    if (isValidChoice) {
      return {
        method: 'ai-routing',
        primary: {
          repo: aiChoice,
          confidence: aiAnalysis.confidence || 0.9,
          reasoning: aiReasoning
        },
        alternatives: aiAlternatives
          .filter(alt => validRepos.includes(alt))
          .map(alt => ({ repo: alt, confidence: 0.7 })),
        shouldAutoRoute: (aiAnalysis.confidence || 0.9) >= 0.75,
        aiMetadata: {
          category: aiAnalysis.bugType,
          affectedArea: aiAnalysis.affectedArea,
          urgency: aiAnalysis.urgency,
          complexity: aiAnalysis.estimatedComplexity
        }
      };
    }
  }
  
  // Fallback to enhanced keyword-based routing with AI context
  console.log('🔄 Using enhanced keyword-based routing...');
  
  const analysisText = [
    aiAnalysis.title || '',
    aiAnalysis.coreIssueDescription || '',
    ...(aiAnalysis.component_keywords || []),
    ...(aiAnalysis.technicalDetails || []),
    ...(aiAnalysis.reproductionSteps || []),
    aiAnalysis.bugType || '',
    aiAnalysis.affectedArea || ''
  ].join(' ').toLowerCase();
  
  console.log('📝 Analysis text for routing:', analysisText.substring(0, 200) + '...');
  
  const scores = {};
  let maxScore = 0;
  
  // Enhanced scoring with weighted categories
  Object.entries(REPO_REGISTRY).forEach(([repo, hints]) => {
    let score = 0;
    const matchedKeywords = [];
    
    hints.forEach(hint => {
      if (analysisText.includes(hint.toLowerCase())) {
        score += 1;
        matchedKeywords.push(hint);
      }
    });
    
    // Bonus scoring based on AI classification
    if (aiAnalysis.bugType) {
      if (repo === 'mereka-web' && ['frontend', 'user-experience'].includes(aiAnalysis.bugType)) {
        score += 2; // Bonus for frontend issues
      } else if (repo === 'mereka-cloudfunctions' && ['backend', 'infrastructure'].includes(aiAnalysis.bugType)) {
        score += 2; // Bonus for backend issues
      } else if (repo === 'mereka-web-ssr' && aiAnalysis.bugType === 'ssr') {
        score += 3; // High bonus for SSR-specific issues
      }
    }
    
    // Bonus scoring for affected area
    if (aiAnalysis.affectedArea) {
      const areaBonus = {
        'authentication': { 'mereka-cloudfunctions': 2, 'mereka-web': 1 },
        'profiles': { 'mereka-web': 2, 'mereka-cloudfunctions': 1 },
        'jobs': { 'mereka-web': 2, 'mereka-cloudfunctions': 1 },
        'experiences': { 'mereka-web': 2, 'mereka-cloudfunctions': 1 },
        'search': { 'mereka-web-ssr': 2, 'mereka-web': 1 },
        'payments': { 'mereka-cloudfunctions': 3 }
      };
      
      if (areaBonus[aiAnalysis.affectedArea] && areaBonus[aiAnalysis.affectedArea][repo]) {
        score += areaBonus[aiAnalysis.affectedArea][repo];
      }
    }
    
    if (score > 0) {
      scores[repo] = { score, matchedKeywords };
      maxScore = Math.max(maxScore, score);
    }
  });
  
  // Calculate final candidates with enhanced scoring
  const candidates = Object.entries(scores)
    .map(([repo, { score, matchedKeywords }]) => ({
      repo,
      score: score,
      confidence: maxScore > 0 ? score / maxScore : 0,
      matchedKeywords: matchedKeywords,
      normalizedScore: maxScore > 0 ? (score / maxScore * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.score - a.score);
  
  console.log('📊 Enhanced routing candidates:', candidates);
  
  const topChoice = candidates[0] || null;
  const shouldAutoRoute = topChoice && topChoice.confidence >= 0.6; // Lower threshold for keyword routing
  
  return {
    method: 'keyword-routing',
    candidates,
    primary: topChoice ? {
      repo: topChoice.repo,
      confidence: topChoice.confidence,
      reasoning: `Matched keywords: ${topChoice.matchedKeywords.join(', ')}`,
      matchedKeywords: topChoice.matchedKeywords
    } : null,
    shouldAutoRoute,
    aiMetadata: aiAnalysis.classification ? {
      category: aiAnalysis.bugType,
      affectedArea: aiAnalysis.affectedArea,
      aiConfidence: aiAnalysis.confidence
    } : null
  };
}

// Initialize OpenAI client with API key
async function initializeOpenAI() {
  if (!openai) {
    try {
      const apiKey = await getSecret('OPENAI_API_KEY');
      if (apiKey) {
        openai = new OpenAI({
          apiKey: apiKey.trim().replace(/[\r\n\t]/g, '')
        });
        console.log('✅ OpenAI client initialized');
      } else {
        console.log('⚠️ OpenAI API key not found, falling back to rule-based analysis');
      }
    } catch (error) {
      console.error('❌ Error initializing OpenAI:', error);
    }
  }
  return openai;
}

// Helper function to get Slack message content
async function getSlackMessage(channel, timestamp) {
  try {
    const token = await getSecret('SLACK_BOT_TOKEN');
    if (!token) throw new Error('Slack token not found');
    
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    
    const response = await axios.get('https://slack.com/api/conversations.history', {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        channel: channel,
        latest: timestamp,
        inclusive: true,
        limit: 1
      }
    });

    if (response.data.ok && response.data.messages.length > 0) {
      return response.data.messages[0].text;
    }
    
    throw new Error('Message not found');
  } catch (error) {
    console.error('Error fetching Slack message:', error);
    return null;
  }
}

// Smart content analysis functions
function analyzeMessageContent(messageText) {
  const cleanText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
  
  // Identify feature area
  let feature = 'platform functionality';
  if (cleanText.toLowerCase().includes('job')) feature = 'job posting system';
  if (cleanText.toLowerCase().includes('login') || cleanText.toLowerCase().includes('auth')) feature = 'authentication system';
  if (cleanText.toLowerCase().includes('payment') || cleanText.toLowerCase().includes('stripe')) feature = 'payment processing';
  if (cleanText.toLowerCase().includes('mobile')) feature = 'mobile interface';
  if (cleanText.toLowerCase().includes('email')) feature = 'email system';
  if (cleanText.toLowerCase().includes('profile')) feature = 'user profile system';
  if (cleanText.toLowerCase().includes('experience')) feature = 'experience management';
  
  // Identify problem type
  let problemType = 'not functioning correctly';
  if (cleanText.toLowerCase().includes('unclickable') || cleanText.toLowerCase().includes('not working')) problemType = 'unresponsive';
  if (cleanText.toLowerCase().includes('error') || cleanText.toLowerCase().includes('fail')) problemType = 'throwing errors';
  if (cleanText.toLowerCase().includes('slow') || cleanText.toLowerCase().includes('loading')) problemType = 'performing slowly';
  if (cleanText.toLowerCase().includes('duplicate') || cleanText.toLowerCase().includes('copy')) problemType = 'creating duplicates';
  if (cleanText.toLowerCase().includes('wrong') || cleanText.toLowerCase().includes('incorrect')) problemType = 'displaying incorrect information';
  
  // Identify user action
  let userAction = 'using the platform';
  if (cleanText.toLowerCase().includes('click')) userAction = 'clicking buttons or links';
  if (cleanText.toLowerCase().includes('submit') || cleanText.toLowerCase().includes('save')) userAction = 'submitting forms';
  if (cleanText.toLowerCase().includes('upload')) userAction = 'uploading files';
  if (cleanText.toLowerCase().includes('login') || cleanText.toLowerCase().includes('sign in')) userAction = 'attempting to log in';
  if (cleanText.toLowerCase().includes('reuse') || cleanText.toLowerCase().includes('re-use')) userAction = 'trying to reuse content';
  
  return { feature, problemType, userAction, cleanText };
}

// AI-powered bug report analysis using GPT
/**
 * Enhanced AI analysis with multi-step reasoning and learning
 * Phase 2 Enhancement: Advanced AI-powered triage agent
 */
async function analyzeWithAI(messageText, context = {}) {
  const ai = await initializeOpenAI();
  
  if (!ai) {
    console.log('📝 Using rule-based analysis (AI not available)');
    return null;
  }

  try {
    console.log('🤖 Starting enhanced multi-step AI analysis...');
    
    // Step 1: Classification and Context Analysis
    const classificationPrompt = `You are an expert software QA analyst for Mereka, a professional networking/marketplace platform.

Platform Context:
- Core Features: User authentication, experience creation, expert profiles, job postings, expertise collections
- User Types: Learners, Experts, Job Seekers, Employers
- Tech Stack: Frontend (React/Next.js), Backend (Cloud Functions/Firebase), SSR (Next.js), Testing (Playwright)

Message: "${messageText}"
${context.threadContext ? `Thread Context: ${context.threadContext}` : ''}

Analyze and classify this issue. Return ONLY valid JSON:
{
  "classification": {
    "isValidBug": true/false,
    "confidence": 0.0-1.0,
    "primaryCategory": "frontend|backend|ssr|testing|infrastructure|user-experience",
    "affectedArea": "authentication|profiles|jobs|experiences|search|payments",
    "userImpact": "low|medium|high|critical",
    "urgency": "low|medium|high|critical"
  },
  "technicalIndicators": {
    "errorPatterns": ["specific errors mentioned"],
    "behaviorIssues": ["incorrect behaviors"],
    "performanceIssues": ["slow loading", "timeouts"],
    "uiProblems": ["layout issues", "interaction problems"]
  },
  "contextClues": {
    "mentionedComponents": ["login", "dashboard", "job listing"],
    "devices": ["mobile", "desktop", "browser type"],
    "userRoles": ["expert", "learner", "employer"],
    "workflows": ["job posting", "profile creation"]
  }
}`;

    const classificationResult = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: classificationPrompt }],
      temperature: 0.1,
      max_tokens: 600
    });

    let classificationResponse = classificationResult.choices[0].message.content;
    classificationResponse = classificationResponse.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    
    let classification;
    try {
      classification = JSON.parse(classificationResponse);
      console.log(`🎯 Classification: ${classification.classification.primaryCategory} (${(classification.classification.confidence * 100).toFixed(1)}% confidence)`);
    } catch (parseError) {
      console.error('❌ Classification parsing failed:', parseError.message);
      return null;
    }

    // Early return if not a valid bug with sufficient confidence
    if (!classification.classification.isValidBug || classification.classification.confidence < 0.6) {
      console.log('⚠️ Low confidence or invalid bug detected');
      return {
        isValidBug: false,
        confidence: classification.classification.confidence,
        reason: 'AI determined this may not be a valid bug report',
        classification: classification.classification
      };
    }

    // Step 2: Detailed Technical Analysis
    const analysisPrompt = `Based on the classification, perform detailed technical analysis for a ${classification.classification.primaryCategory} issue affecting ${classification.classification.affectedArea}.

Original Message: "${messageText}"
Classification: ${JSON.stringify(classification.classification)}
Technical Indicators: ${JSON.stringify(classification.technicalIndicators)}

Generate a comprehensive, specific bug report. Return ONLY valid JSON:
{
  "title": "Specific, actionable bug title focusing on the exact issue (max 80 chars)",
  "coreIssueDescription": "Comprehensive 5-10 sentence technical description focusing on: the specific malfunction, where it occurs in the system, how the broken behavior manifests, exact user impact, technical scope, and what needs to be fixed. Use specific terminology from the message.",
  "technicalDetails": [
    "Specific technical problem #1 with exact details",
    "System behavior issue #2 with context", 
    "Error condition #3 with manifestation"
  ],
  "reproductionSteps": [
    "Step 1: Specific user action with exact context",
    "Step 2: System interaction or page navigation",
    "Step 3: Point where issue manifests with details",
    "Step 4: Observable failure or incorrect behavior"
  ],
  "expectedResult": "Detailed description of correct functionality and expected behavior",
  "actualResult": "Specific description of the problematic behavior and what's actually happening",
  "preconditions": [
    "Specific user state or permissions required",
    "Platform/device requirements",
    "Data conditions or setup needed"
  ],
  "environmentContext": [
    "Device/browser information from message",
    "User role and permissions context",
    "Timing or frequency details",
    "Related system state"
  ],
  "component_keywords": ["extracted", "technical", "routing", "keywords"],
  "severity": "${classification.classification.userImpact}",
  "urgency": "${classification.classification.urgency}",
  "bugType": "${classification.classification.primaryCategory}",
  "affectedArea": "${classification.classification.affectedArea}",
  "confidence": ${classification.classification.confidence},
  "repositoryHints": {
    "primary": "most likely repository based on technical analysis",
    "alternatives": ["backup repository options"],
    "reasoning": "technical justification for routing decision"
  },
  "suggestedLabels": ["bug", "${classification.classification.primaryCategory}", "${classification.classification.affectedArea}"],
  "estimatedComplexity": "simple|moderate|complex",
  "requiresImmediateAttention": ${classification.classification.urgency === 'critical' ? 'true' : 'false'}
}

Be highly specific and technical. Extract exact details from the user's message.`;

    const analysisResult = await ai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.2,
      max_tokens: 1400
    });

    let analysisResponse = analysisResult.choices[0].message.content;
    analysisResponse = analysisResponse.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    
    try {
      const analysis = JSON.parse(analysisResponse);
      
      // Add enhanced metadata
      analysis.aiVersion = '2.0-enhanced-triage';
      analysis.analysisTimestamp = new Date().toISOString();
      analysis.processingSteps = ['classification', 'technical-analysis'];
      analysis.classification = classification.classification;
      analysis.technicalIndicators = classification.technicalIndicators;
      analysis.contextClues = classification.contextClues;
      
      console.log('✅ Enhanced AI analysis completed successfully');
      console.log(`🎯 Final Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`📊 Complexity: ${analysis.estimatedComplexity}, Urgency: ${analysis.urgency}`);
      console.log(`🎯 Primary Target: ${analysis.repositoryHints.primary}`);
      
      return analysis;
      
    } catch (parseError) {
      console.error('❌ Failed to parse technical analysis:', parseError.message);
      console.log('Raw response:', analysisResponse);
      return null;
    }

  } catch (error) {
    console.error('❌ Enhanced AI analysis failed:', error.message);
    return null;
  }
}

function generateSmartCoreIssue(analysis) {
  const text = analysis.cleanText.toLowerCase();
  
  // Generate a simple but intelligent description
  const simpleDescription = generateSimpleDescription(text, analysis.cleanText);
  if (simpleDescription) {
    return simpleDescription;
  }
  
  // Fallback to existing reliable logic
  const sentences = [];
  sentences.push(`The ${analysis.feature} is ${analysis.problemType} when users are ${analysis.userAction}.`);
  
  // Add context-specific details
  if (text.includes('chronological') || text.includes('order')) {
    sentences.push(`Items are appearing out of sequence, with newer content positioned incorrectly among older entries.`);
    sentences.push(`This makes it difficult for users to track recent activity and may lead to missed updates.`);
    sentences.push(`The sorting functionality appears to be malfunctioning, affecting user workflow efficiency.`);
  } else if (text.includes('reuse') || text.includes('re-use')) {
    sentences.push(`When attempting to reuse closed job posts, the system performs unexpected actions instead of the intended reuse functionality.`);
    sentences.push(`This creates duplicate job posts and incorrectly modifies the original post status.`);
    sentences.push(`The behavior prevents proper job reuse workflow and creates confusion with multiple job listings.`);
  } else if (text.includes('mobile') && text.includes('job')) {
    sentences.push(`On mobile devices, job-related interface elements become unresponsive or difficult to interact with.`);
    sentences.push(`This prevents users from properly accessing job information and performing necessary actions.`);
    sentences.push(`The issue significantly impacts mobile user experience and job application processes.`);
  } else if (text.includes('slow') || text.includes('loading')) {
    sentences.push(`Page loading times are significantly longer than expected, causing user frustration.`);
    sentences.push(`This affects user experience and may lead to users abandoning their intended actions.`);
    sentences.push(`Performance issues like this can significantly impact user engagement and platform usability.`);
  } else {
    sentences.push(`This issue occurs during normal platform usage and affects user workflow.`);
    sentences.push(`The problem prevents users from completing their intended actions successfully.`);
    sentences.push(`This impacts overall user experience and platform functionality.`);
  }
  
  return sentences.slice(0, 5).join(' ');
}

// Simple but effective description generation
function generateSimpleDescription(lowerText, originalText) {
  // Extract key elements
  const context = extractContext(lowerText);
  const problem = extractProblem(lowerText);
  const impact = extractImpact(lowerText);
  
  if (!context || !problem) return null;
  
  const sentences = [];
  
  // Sentence 1: Core issue
  sentences.push(`The ${context} ${problem} during normal platform usage.`);
  
  // Sentence 2: Specific context if available
  if (lowerText.includes('august') && lowerText.includes('june')) {
    sentences.push(`For example, content from August 2025 is appearing incorrectly positioned relative to June 2025 entries.`);
  } else if (lowerText.includes('appear') && lowerText.includes('middle')) {
    sentences.push(`Newer items are appearing in the middle of the list instead of at the top where expected.`);
  }
  
  // Sentence 3: User impact
  if (impact) {
    sentences.push(impact);
  } else {
    sentences.push(`This prevents users from efficiently completing their intended workflow.`);
  }
  
  // Sentence 4: Business impact
  sentences.push(`The issue affects user experience and platform reliability.`);
  
  return sentences.join(' ');
}

function extractContext(lowerText) {
  if (lowerText.includes('job') && lowerText.includes('application')) return 'job applications page';
  if (lowerText.includes('job')) return 'job listings section';
  if (lowerText.includes('contract')) return 'contract management system';
  if (lowerText.includes('profile')) return 'user profile section';
  if (lowerText.includes('email')) return 'email notification system';
  if (lowerText.includes('mobile')) return 'mobile interface';
  return 'platform';
}

function extractProblem(lowerText) {
  if (lowerText.includes('chronological') || lowerText.includes('order')) return 'is not displaying content in correct chronological order';
  if (lowerText.includes('appear') && lowerText.includes('middle')) return 'is positioning items incorrectly';
  if (lowerText.includes('slow') || lowerText.includes('loading')) return 'is experiencing significant performance issues';
  if (lowerText.includes('unclickable') || lowerText.includes('not working')) return 'has non-functional interface elements';
  if (lowerText.includes('wrong') || lowerText.includes('incorrect')) return 'is displaying incorrect information';
  if (lowerText.includes('duplicate')) return 'is creating duplicate entries';
  return 'is not functioning correctly';
}

function extractImpact(lowerText) {
  if (lowerText.includes('track') && lowerText.includes('application')) {
    return 'This makes it difficult for users to track their most recent applications and may result in missed opportunities.';
  }
  if (lowerText.includes('confusion')) {
    return 'This creates confusion for users trying to navigate and use the platform effectively.';
  }
  if (lowerText.includes('slow') || lowerText.includes('loading')) {
    return 'This causes delays and frustration for users trying to access platform features.';
  }
  return null;
}



// Enhanced content parsing functions
function parseSlackMessage(messageText) {
  const cleanText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim().toLowerCase();
  
  return {
    technicalIssues: extractTechnicalProblems(cleanText),
    userActions: extractUserActions(cleanText),
    systemBehavior: extractSystemBehavior(cleanText),
    environmentInfo: extractEnvironmentDetails(cleanText),
    originalText: messageText.replace(/<@[A-Z0-9]+>/g, '').trim()
  };
}

function extractTechnicalProblems(cleanText) {
  const issues = [];
  
  // AI-powered semantic analysis of technical problems
  const technicalAnalysis = analyzeTextForTechnicalIssues(cleanText);
  
  // Add specific technical issues based on semantic analysis
  if (technicalAnalysis.length > 0) {
    issues.push(...technicalAnalysis);
  } else {
    // Fallback to generic but relevant technical details
    issues.push('System functionality not performing as expected');
    issues.push('User workflow interrupted by technical issues');
  }
  
  return issues;
}

// AI-powered semantic analysis for technical issues
function analyzeTextForTechnicalIssues(text) {
  const issues = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase().trim();
    
    // Analyze sentence structure and extract technical problems
    const technicalIssue = extractTechnicalIssueFromSentence(lowerSentence);
    if (technicalIssue) {
      issues.push(technicalIssue);
    }
  }
  
  return issues;
}

// Extract technical issue from individual sentence using semantic patterns
function extractTechnicalIssueFromSentence(sentence) {
  // Pattern: Something is not working/functioning correctly
  if (sentence.includes('not') && (sentence.includes('work') || sentence.includes('function'))) {
    const subject = extractSubjectFromSentence(sentence);
    return `${subject} functionality failure affecting user operations`;
  }
  
  // Pattern: Something appears incorrectly
  if (sentence.includes('appear') && (sentence.includes('wrong') || sentence.includes('incorrect') || sentence.includes('middle'))) {
    const subject = extractSubjectFromSentence(sentence);
    return `${subject} display logic malfunction causing incorrect positioning`;
  }
  
  // Pattern: Something is slow/loading
  if (sentence.includes('slow') || sentence.includes('loading') || sentence.includes('spinner')) {
    const subject = extractSubjectFromSentence(sentence);
    return `${subject} performance degradation causing extended response times`;
  }
  
  // Pattern: Something causes confusion/problems
  if (sentence.includes('confuse') || sentence.includes('problem') || sentence.includes('difficult')) {
    const subject = extractSubjectFromSentence(sentence);
    return `${subject} behavior creating user experience issues`;
  }
  
  // Pattern: Something is missing/not showing
  if ((sentence.includes('not') && sentence.includes('show')) || sentence.includes('missing')) {
    const subject = extractSubjectFromSentence(sentence);
    return `${subject} content rendering failure preventing proper display`;
  }
  
  // Pattern: Something breaks/disrupts workflow
  if (sentence.includes('break') || sentence.includes('disrupt') || sentence.includes('prevent')) {
    return 'System workflow disruption preventing task completion';
  }
  
  return null;
}

// Smart subject extraction from sentence
function extractSubjectFromSentence(sentence) {
  // Look for key nouns that indicate system components
  const systemComponents = [
    'page', 'button', 'form', 'list', 'application', 'job', 'system', 
    'interface', 'menu', 'content', 'data', 'order', 'sort', 'display',
    'login', 'payment', 'email', 'notification', 'search', 'filter'
  ];
  
  for (const component of systemComponents) {
    if (sentence.includes(component)) {
      // Capitalize and make it more technical
      return component.charAt(0).toUpperCase() + component.slice(1) + ' component';
    }
  }
  
  return 'System component';
}

function extractUserActions(cleanText) {
  const actions = [];
  
  // Common navigation patterns
  if (cleanText.includes('clicked on jobs') || cleanText.includes('click') && cleanText.includes('job')) {
    actions.push('User clicked on Jobs section/button');
  }
  
  if (cleanText.includes('login') || cleanText.includes('sign in')) {
    actions.push('User attempted to log in');
  }
  
  if (cleanText.includes('submit') || cleanText.includes('save')) {
    actions.push('User attempted to submit form');
  }
  
  if (cleanText.includes('upload')) {
    actions.push('User attempted to upload file');
  }
  
  if (cleanText.includes('refresh')) {
    actions.push('User refreshed page multiple times');
  }
  
  if (cleanText.includes('navigate') || cleanText.includes('go to')) {
    actions.push('User navigated to specific page section');
  }
  
  return actions;
}

function extractSystemBehavior(cleanText) {
  const behaviors = [];
  
  if (cleanText.includes('keeps spinning')) {
    behaviors.push('System displays continuous loading spinner');
  }
  
  if (cleanText.includes('nothing happens') || cleanText.includes('no response')) {
    behaviors.push('System fails to respond to user input');
  }
  
  if (cleanText.includes('same thing') && cleanText.includes('refresh')) {
    behaviors.push('System behavior persists across page refreshes');
  }
  
  if (cleanText.includes('create') && cleanText.includes('duplicate')) {
    behaviors.push('System creates unintended duplicate entries');
  }
  
  if (cleanText.includes('status') && cleanText.includes('wrong')) {
    behaviors.push('System displays incorrect status information');
  }
  
  return behaviors;
}

function extractEnvironmentDetails(cleanText) {
  const details = [];
  
  if (cleanText.includes('mobile') || cleanText.includes('phone')) {
    details.push('Issue occurs on mobile devices');
  }
  
  if (cleanText.includes('safari') || cleanText.includes('chrome') || cleanText.includes('firefox')) {
    const browser = cleanText.match(/(safari|chrome|firefox)/i);
    if (browser) {
      details.push(`Browser: ${browser[0]} specific behavior`);
    }
  }
  
  if (cleanText.includes('ios') || cleanText.includes('android')) {
    const os = cleanText.match(/(ios|android)/i);
    if (os) {
      details.push(`Operating System: ${os[0]} platform`);
    }
  }
  
  return details;
}

function generateTechnicalDetails(parsedData) {
  const details = [];
  
  // Add technical issues
  parsedData.technicalIssues.forEach(issue => {
    details.push(`• ${issue}`);
  });
  
  // Add system behavior
  parsedData.systemBehavior.forEach(behavior => {
    details.push(`• ${behavior}`);
  });
  
  // Add environment info
  parsedData.environmentInfo.forEach(env => {
    details.push(`• ${env}`);
  });
  
  // If no specific technical details found, provide generic ones
  if (details.length === 0) {
    details.push('• System functionality not performing as expected');
    details.push('• User workflow interrupted by technical issues');
  }
  
  return details.join('\n');
}

function generateReproductionSteps(parsedData) {
  const steps = [];
  const originalText = parsedData.originalText;
  
  // AI-powered steps generation based on content analysis
  const smartSteps = generateSmartReproductionSteps(originalText);
  
  if (smartSteps.length > 0) {
    steps.push(...smartSteps);
  } else {
    // Fallback to basic steps
    steps.push('1. Log in to the platform with appropriate user credentials');
    steps.push('2. Navigate to the affected page or section');
    steps.push('3. Perform the action described in the issue');
    steps.push('4. Observe system behavior and document any unexpected results');
    steps.push('5. Verify the issue is consistently reproducible');
  }
  
  return steps.join('\n');
}

// AI-powered smart reproduction steps generator
function generateSmartReproductionSteps(text) {
  const steps = [];
  const lowerText = text.toLowerCase();
  
  // Extract key actions and context from the bug report
  const context = extractContext(lowerText);
  const userActions = extractUserActionsFromText(lowerText);
  const problemDescription = extractProblemDescription(lowerText);
  
  // Step 1: Always start with login/access
  if (context.requiresSpecificAccount) {
    steps.push(`1. Log in to ${context.accountType}`);
  } else {
    steps.push('1. Log in to the platform with appropriate user credentials');
  }
  
  // Step 2: Navigation
  if (context.location) {
    steps.push(`2. Navigate to ${context.location}`);
  } else {
    steps.push('2. Navigate to the affected page or section');
  }
  
  // Step 3-N: Add extracted user actions
  let stepNumber = 3;
  for (const action of userActions) {
    steps.push(`${stepNumber}. ${action}`);
    stepNumber++;
  }
  
  // Add observation step
  if (problemDescription) {
    steps.push(`${stepNumber}. Observe that ${problemDescription}`);
    stepNumber++;
  } else {
    steps.push(`${stepNumber}. Perform the action and observe the issue`);
    stepNumber++;
  }
  
  // Add verification step
  steps.push(`${stepNumber}. Verify the issue is consistently reproducible`);
  
  return steps;
}

// Extract user actions from text using semantic analysis
function extractUserActionsFromText(text) {
  const actions = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase().trim();
    
    // Look for action patterns
    if (lowerSentence.includes('click') || lowerSentence.includes('tap')) {
      const clickTarget = extractClickTarget(lowerSentence);
      actions.push(`Click on ${clickTarget}`);
    } else if (lowerSentence.includes('navigate') || lowerSentence.includes('go to')) {
      const destination = extractDestination(lowerSentence);
      actions.push(`Navigate to ${destination}`);
    } else if (lowerSentence.includes('apply') || lowerSentence.includes('submit')) {
      actions.push('Submit or apply using the relevant form');
    } else if (lowerSentence.includes('refresh') || lowerSentence.includes('reload')) {
      actions.push('Refresh the page');
    } else if (lowerSentence.includes('check') || lowerSentence.includes('view')) {
      const checkTarget = extractCheckTarget(lowerSentence);
      actions.push(`Check ${checkTarget}`);
    }
  }
  
  return actions;
}

// Extract what the user is trying to click
function extractClickTarget(sentence) {
  if (sentence.includes('button')) return 'the relevant button';
  if (sentence.includes('link')) return 'the specified link';
  if (sentence.includes('menu')) return 'the menu option';
  if (sentence.includes('job')) return 'job listings or applications';
  return 'the relevant interface element';
}

// Extract navigation destination
function extractDestination(sentence) {
  if (sentence.includes('job')) return 'Jobs section or Applications list';
  if (sentence.includes('profile')) return 'user profile page';
  if (sentence.includes('dashboard')) return 'dashboard';
  if (sentence.includes('home')) return 'homepage';
  return 'the relevant page section';
}

// Extract what to check/view
function extractCheckTarget(sentence) {
  if (sentence.includes('order')) return 'the content order or sequence';
  if (sentence.includes('list')) return 'the list items and their positioning';
  if (sentence.includes('application')) return 'job applications and their status';
  if (sentence.includes('page')) return 'page content and layout';
  return 'the relevant content area';
}

// Extract problem description for observation step
function extractProblemDescription(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('appear') && lowerText.includes('middle')) {
    return 'content appears in incorrect positions (middle instead of top)';
  } else if (lowerText.includes('not') && lowerText.includes('work')) {
    return 'the functionality does not work as expected';
  } else if (lowerText.includes('slow') || lowerText.includes('loading')) {
    return 'page loading is significantly slower than expected';
  } else if (lowerText.includes('error') || lowerText.includes('fail')) {
    return 'errors occur or functionality fails';
  }
  
  return null;
}

// AI-powered Expected and Actual Results generation
function generateSmartExpectedActualResults(messageText, analysis) {
  const lowerText = messageText.toLowerCase();
  
  // Analyze the problem and generate appropriate expected/actual results
  const expectedResult = generateSmartExpectedResult(lowerText, analysis);
  const actualResult = generateSmartActualResult(lowerText, messageText);
  
  return { expected: expectedResult, actual: actualResult };
}

// Generate context-aware expected results
function generateSmartExpectedResult(lowerText, analysis) {
  // Extract the feature/component being discussed
  const component = extractContext(lowerText);
  
  if (lowerText.includes('order') || lowerText.includes('sort') || lowerText.includes('sequence')) {
    return `${component.displayName} should display content in the correct order, with proper sorting functionality to help users find and track items efficiently.`;
  } else if (lowerText.includes('click') || lowerText.includes('button') || lowerText.includes('tap')) {
    return `${component.displayName} should respond properly to user interactions, with clickable elements functioning as expected.`;
  } else if (lowerText.includes('load') || lowerText.includes('slow') || lowerText.includes('performance')) {
    return `${component.displayName} should load quickly and perform efficiently, providing a smooth user experience without delays.`;
  } else if (lowerText.includes('display') || lowerText.includes('show') || lowerText.includes('appear')) {
    return `${component.displayName} should display content correctly and consistently, showing accurate information in the proper format.`;
  } else if (lowerText.includes('apply') || lowerText.includes('submit') || lowerText.includes('form')) {
    return `${component.displayName} should process submissions correctly, allowing users to complete their intended actions successfully.`;
  } else if (lowerText.includes('login') || lowerText.includes('auth') || lowerText.includes('sign')) {
    return `Authentication system should allow seamless access to platform features for authorized users without errors or delays.`;
  } else if (lowerText.includes('email') || lowerText.includes('notification')) {
    return `Email and notification system should deliver accurate information with proper formatting and timing.`;
  } else if (lowerText.includes('search') || lowerText.includes('filter')) {
    return `Search and filtering functionality should return accurate results and allow users to find content efficiently.`;
  } else {
    return `${component.displayName} should function reliably and meet user expectations for normal platform operations.`;
  }
}

// Generate specific actual results based on problem description
function generateSmartActualResult(lowerText, originalText) {
  // Extract the specific problem from the text
  const problemDescription = extractProblemDescription(originalText);
  
  if (problemDescription) {
    return `The system ${problemDescription}, causing user workflow disruption and preventing successful task completion.`;
  }
  
  // Fallback based on problem type
  if (lowerText.includes('not') && (lowerText.includes('work') || lowerText.includes('function'))) {
    return 'Functionality fails to work as expected, blocking users from completing their intended actions.';
  } else if (lowerText.includes('slow') || lowerText.includes('loading')) {
    return 'System performance is significantly degraded, causing extended wait times and user frustration.';
  } else if (lowerText.includes('appear') && (lowerText.includes('wrong') || lowerText.includes('incorrect'))) {
    return 'Content appears in incorrect positions or formats, creating confusion and workflow disruption.';
  } else if (lowerText.includes('error') || lowerText.includes('fail')) {
    return 'System errors occur during normal operations, preventing successful completion of user tasks.';
  } else if (lowerText.includes('missing') || lowerText.includes('not show')) {
    return 'Expected content or functionality is missing or not displayed, limiting user capabilities.';
  } else {
    return 'System behavior deviates from expected functionality, creating user experience issues and workflow interruption.';
  }
}

// Generate smart preconditions based on context analysis
function generateSmartPreconditions(messageText, analysis, parsedData) {
  const lowerText = messageText.toLowerCase();
  const context = extractContext(lowerText);
  
  let preconditions = '- User has valid account and necessary permissions\n- Platform is accessible and operational';
  
  // Analyze content for specific preconditions
  if (lowerText.includes('application') && lowerText.includes('job')) {
    preconditions = '- User has job application history with multiple entries\n- Various job applications exist with different submission dates\n- User is logged in with appropriate permissions';
  } else if (lowerText.includes('multiple') || lowerText.includes('several') || lowerText.includes('different')) {
    if (context.feature.includes('job')) {
      preconditions = '- User has multiple job-related entries in their account\n- System contains existing data for comparison\n- User is logged in with appropriate role';
    } else {
      preconditions = '- User has multiple entries or items in their account\n- System contains existing data for testing\n- User is logged in with appropriate permissions';
    }
  } else if (parsedData.environmentInfo.some(info => info.includes('mobile'))) {
    preconditions = '- User is accessing platform via mobile device\n- Stable internet connection is available\n- Mobile interface is properly loaded';
  } else if (lowerText.includes('login') || lowerText.includes('auth')) {
    preconditions = '- User has valid login credentials\n- Authentication system is operational\n- User account is active and not restricted';
  } else if (lowerText.includes('new') || lowerText.includes('create') || lowerText.includes('apply')) {
    preconditions = '- User has permissions to create or apply for new items\n- System allows new submissions\n- User is logged in with appropriate role';
  } else if (context.feature.includes('job')) {
    preconditions = '- User has job-related permissions and access\n- Job system is operational and accessible\n- User is logged in with appropriate role';
  } else if (parsedData.environmentInfo.length > 0) {
    preconditions = `- User environment: ${parsedData.environmentInfo.join(', ')}\n- Platform is accessible and operational\n- User has necessary permissions for the described actions`;
  }
  
  return preconditions;
}

// Enhanced bug report generation with AI and smart formatting
async function generateBugReport(messageText, threadLink) {
  // Try AI analysis first
  const aiAnalysis = await analyzeWithAI(messageText);
  
  if (aiAnalysis) {
    // Use AI-generated content
    console.log('✅ Using AI-generated bug report');
    return {
      title: aiAnalysis.title,
      description: `🎯 Description:
${aiAnalysis.coreIssueDescription}

📝 Technical Details:
${aiAnalysis.technicalDetails.map(detail => `• ${detail}`).join('\n')}

⚠️ Issue reported via SOS emoji reaction requiring immediate attention.`,
      expectedResult: aiAnalysis.expectedResult,
      actualResult: aiAnalysis.actualResult,
      preconditions: aiAnalysis.preconditions.map(condition => `- ${condition}`).join('\n'),
      reproductionSteps: aiAnalysis.reproductionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')
    };
  }
  
  // Fallback to rule-based analysis
  console.log('📝 Using rule-based analysis');
  const analysis = analyzeMessageContent(messageText);
  const parsedData = parseSlackMessage(messageText);
  const smartCoreIssue = generateSmartCoreIssue(analysis);
  const technicalDetails = generateTechnicalDetails(parsedData);
  const reproductionSteps = generateReproductionSteps(parsedData);
  
  // AI-powered Expected and Actual Results generation
  const smartResults = generateSmartExpectedActualResults(messageText, analysis);
  let expectedResult = smartResults.expected;
  let actualResult = smartResults.actual;
  
  // AI-powered preconditions generation
  const preconditions = generateSmartPreconditions(messageText, analysis, parsedData);

  const description = `🎯 Description:
${smartCoreIssue}

📝 Technical Details:
${technicalDetails}

⚠️ Issue reported via SOS emoji reaction requiring immediate attention. This affects ${analysis.feature} which is core to platform value.`;

  return {
    title: null, // Will be generated separately in rule-based mode
    description,
    expectedResult,
    actualResult,
    preconditions,
    reproductionSteps: reproductionSteps
  };
}

// Create ClickUp task with enhanced content
async function createClickUpTask(title, description, priority = 2) {
  try {
    const apiKey = await getSecret('CLICKUP_API_KEY');
    if (!apiKey) throw new Error('ClickUp API key not found');
    
    const cleanApiKey = apiKey.trim().replace(/[\r\n\t]/g, '');
    
    const taskData = {
      name: title,
      description: description,
      status: "to do",
      priority: priority,
      assignees: [66733245] // Fadlan only
    };

    const response = await axios.post(
      'https://api.clickup.com/api/v2/list/900501824745/task',
      taskData,
      {
        headers: {
          'Authorization': cleanApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.id) {
      console.log('✅ ClickUp task created successfully:', response.data.id);
      return {
        taskId: response.data.id,
        taskUrl: response.data.url || `https://app.clickup.com/t/${response.data.id}`
      };
    }
    
    throw new Error('Invalid response from ClickUp API');
  } catch (error) {
    console.error('❌ Error creating ClickUp task:', error);
    return null;
  }
}

// Send confirmation message to Slack
async function sendSlackConfirmation(channel, threadTimestamp, taskId, taskUrl, title) {
  try {
    const token = await getSecret('SLACK_BOT_TOKEN');
    if (!token) throw new Error('Slack token not found');
    
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    
    const confirmationMessage = `✅ Bug report created successfully!

Ticket ID: ${taskId}
Title: ${title.length > 80 ? title.substring(0, 80) + '...' : title}
ClickUp Link: ${taskUrl}

Your bug report has been automatically processed and assigned to the development team. You can track the progress using the ClickUp link above.`;

    const response = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channel,
      thread_ts: threadTimestamp,
      text: confirmationMessage,
      unfurl_links: false
    }, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.ok) {
      console.log('✅ Slack confirmation sent successfully');
    } else {
      console.error('❌ Failed to send Slack confirmation:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error sending Slack confirmation:', error);
  }
}

// Enhanced Slack confirmation with GitHub integration
async function sendEnhancedSlackConfirmation(channel, threadTimestamp, taskId, taskUrl, title, githubIssue, routingResult) {
  try {
    const token = await getSecret('SLACK_BOT_TOKEN');
    if (!token) throw new Error('Slack token not found');
    
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    
    const githubInfo = githubIssue 
      ? `GitHub Issue: ${githubIssue.url} (#${githubIssue.number})`
      : 'GitHub: Issue creation failed';
    
    const routingInfo = routingResult.shouldAutoRoute && routingResult.primary
      ? `Auto-routed to: ${routingResult.primary.repo} (${(routingResult.primary.confidence * 100).toFixed(1)}% confidence) via ${routingResult.method}`
      : `Routing: Manual review required${routingResult.candidates?.length > 0 ? ` (${routingResult.candidates.length} candidates)` : ''}`;
    
    const confirmationMessage = `🤖 Automated Bug Report Created!

✅ ClickUp Task: ${taskUrl} (ID: ${taskId})
🔗 ${githubInfo}
🎯 ${routingInfo}

Title: ${title.length > 80 ? title.substring(0, 80) + '...' : title}

Your bug report has been automatically processed with AI analysis and intelligent routing. Both ClickUp and GitHub issues have been created for tracking and development.`;

    const response = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channel,
      thread_ts: threadTimestamp,
      text: confirmationMessage,
      unfurl_links: false
    }, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.ok) {
      console.log('✅ Enhanced Slack confirmation sent successfully');
    } else {
      console.error('❌ Failed to send enhanced Slack confirmation:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error sending enhanced Slack confirmation:', error);
  }
}

// AI-powered title generation with fallback
async function generateSmartTitle(messageText) {
  // Try AI analysis first for title
  const aiAnalysis = await analyzeWithAI(messageText);
  
  if (aiAnalysis && aiAnalysis.title) {
    console.log('✅ Using AI-generated title');
    return aiAnalysis.title;
  }
  
  // Fallback to rule-based title generation
  console.log('📝 Using rule-based title generation');
  const cleanText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
  const lowerText = cleanText.toLowerCase();
  
  let title = '[Issue] ';
  let isHotfix = false;
  
  // Determine if it's a hotfix based on keywords
  if (lowerText.includes('payment') || lowerText.includes('stripe') || 
      lowerText.includes('revenue') || lowerText.includes('critical')) {
    isHotfix = true;
  }
  
  // Simple keyword-based title generation that's reliable
  const titleDescription = generateReliableTitle(lowerText, cleanText);
  title += titleDescription;
  
  return isHotfix ? title.replace('[Issue]', '[Issue][Hotfix]') : title;
}

// Reliable title generation using simple keyword detection
function generateReliableTitle(lowerText, originalText) {
  // Detect context (what area)
  let context = '';
  if (lowerText.includes('job') && lowerText.includes('application')) {
    context = 'Job applications';
  } else if (lowerText.includes('job')) {
    context = 'Job listings';
  } else if (lowerText.includes('contract')) {
    context = 'Contract management';
  } else if (lowerText.includes('profile')) {
    context = 'User profile';
  } else if (lowerText.includes('email')) {
    context = 'Email system';
  } else if (lowerText.includes('mobile')) {
    context = 'Mobile interface';
  } else if (lowerText.includes('payment')) {
    context = 'Payment processing';
  } else if (lowerText.includes('experience')) {
    context = 'Experience management';
  }
  
  // Detect main problem
  let problem = '';
  if (lowerText.includes('chronological') || lowerText.includes('order')) {
    problem = 'not displaying in chronological order';
  } else if (lowerText.includes('appear') && (lowerText.includes('middle') || lowerText.includes('below'))) {
    problem = 'items appearing in wrong position';
  } else if (lowerText.includes('slow') || lowerText.includes('loading')) {
    problem = 'loading performance issue';
  } else if (lowerText.includes('unclickable') || lowerText.includes('not working')) {
    problem = 'functionality not working';
  } else if (lowerText.includes('wrong') || lowerText.includes('incorrect')) {
    problem = 'displaying incorrect information';
  } else if (lowerText.includes('error') || lowerText.includes('fail')) {
    problem = 'system error';
  } else if (lowerText.includes('duplicate')) {
    problem = 'creating duplicates';
  } else if (lowerText.includes('not displayed') || lowerText.includes('not showing')) {
    problem = 'not displaying correctly';
  } else {
    problem = 'functionality issue';
  }
  
  // Combine context and problem
  if (context && problem) {
    return `${context} ${problem}`;
  } else if (problem) {
    return problem;
  } else {
    return 'platform functionality issue';
  }
}





// Main processing function
async function processSOSReaction(event) {
  try {
    const channel = event.item.channel;
    const timestamp = event.item.ts;
    
    console.log(`🔄 Processing SOS reaction for message ${timestamp} in channel ${channel}`);
    
    // Get the original message
    const messageText = await getSlackMessage(channel, timestamp);
    if (!messageText) {
      console.error('❌ Could not retrieve message text');
      return;
    }
    
    // Generate thread link
    const threadLink = `https://bijimereka.slack.com/archives/${channel}/p${timestamp.replace('.', '')}`;
    
    // Generate smart title and bug report (both now use AI)
    const title = await generateSmartTitle(messageText);
    const bugReport = await generateBugReport(messageText, threadLink);
    
    // Create full description
    const fullDescription = `${bugReport.description}

🔗 Link to Thread:
${threadLink}

📋 Preconditions:
${bugReport.preconditions}

🔧 Steps to Reproduce:
${bugReport.reproductionSteps}

✅ Expected Result:
${bugReport.expectedResult}

❌ Actual Result:
${bugReport.actualResult}

🎨 Figma Link:
[To be added]

📎 Attachments:
[Screenshots to be added]`;
    
    // Create ClickUp task
    const taskResult = await createClickUpTask(title, fullDescription, 2);
    
    if (taskResult) {
      console.log(`✅ ClickUp task created successfully: ${taskResult.taskId}`);
      
      // Analyze with AI for repository routing
      const aiAnalysis = await analyzeWithAI(messageText);
      const routingResult = await routeToRepository(aiAnalysis || { 
        title, 
        component_keywords: [], 
        coreIssueDescription: messageText.slice(0, 200) 
      });
      
      console.log('🎯 Repository routing result:', routingResult);
      
      // Create GitHub issue
      let githubIssue = null;
      const githubOrg = 'Biji-Biji-Initiative'; // Production organization
      
      if (routingResult.shouldAutoRoute && routingResult.primary) {
        // Auto-route to specific repository
        const targetRepo = `${githubOrg}/${routingResult.primary.repo}`;
        console.log(`🎯 Auto-routing to repository: ${targetRepo} (confidence: ${routingResult.primary.confidence}) via ${routingResult.method}`);
        
        const githubBody = `## 🤖 Enhanced AI Bug Report

**Source**: Slack Thread - ${threadLink}
**ClickUp Task**: ${taskResult.taskUrl}
**Auto-routed**: Yes (${(routingResult.primary.confidence * 100).toFixed(1)}% confidence via ${routingResult.method})
**AI Analysis**: ${aiAnalysis?.aiVersion || 'N/A'}
${routingResult.aiMetadata ? `**Category**: ${routingResult.aiMetadata.category} | **Area**: ${routingResult.aiMetadata.affectedArea} | **Urgency**: ${routingResult.aiMetadata.urgency}` : ''}
**Routing Reasoning**: ${routingResult.primary.reasoning}

### Issue Description
${bugReport.description}

### Technical Details
${bugReport.reproductionSteps}

### Expected vs Actual
**Expected**: ${bugReport.expectedResult}
**Actual**: ${bugReport.actualResult}

### Environment
${bugReport.preconditions}

---
*This issue was automatically created and routed by AI based on content analysis.*`;

        githubIssue = await createGitHubIssue(targetRepo, title, githubBody, ['bug', 'auto-routed']);
        
      } else {
        // Create in Fadlan-Personal repo for manual routing (acts as triage)
        const triageRepo = `${githubOrg}/Fadlan-Personal`; // Using automation repo for triage
        console.log(`📋 Creating triage issue in: ${triageRepo}`);
        
        const triageBody = `## Bug Report - Needs Routing

**Source**: Slack Thread - ${threadLink}
**ClickUp Task**: ${taskResult.taskUrl}
**Routing Status**: Manual review required

### Issue Description
${bugReport.description}

### Repository Candidates
${routingResult.candidates.map(c => `- **${c.repo}** (confidence: ${(c.confidence * 100).toFixed(1)}%)`).join('\n') || 'No clear candidates found'}

### Technical Details
${bugReport.reproductionSteps}

### Expected vs Actual
**Expected**: ${bugReport.expectedResult}
**Actual**: ${bugReport.actualResult}

### Environment
${bugReport.preconditions}

---
*This issue needs manual routing. Please review and transfer to the appropriate repository.*`;

        githubIssue = await createGitHubIssue(triageRepo, `[TRIAGE] ${title}`, triageBody, ['bug', 'needs-routing', 'triage']);
      }
      
      // Enhanced Slack confirmation with GitHub info
      await sendEnhancedSlackConfirmation(
        channel, 
        timestamp, 
        taskResult.taskId, 
        taskResult.taskUrl, 
        title,
        githubIssue,
        routingResult
      );
      
    } else {
      console.error('❌ Failed to create ClickUp task');
    }
    
  } catch (error) {
    console.error('❌ Error processing SOS reaction:', error);
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Bug Report Pipeline is running!', 
    timestamp: new Date().toISOString(),
    version: '2.0 - Smart Description'
  });
});

// Slack events endpoint
app.post('/slack/events', async (req, res) => {
  try {
    // Handle Slack URL verification challenge
    if (req.body.challenge) {
      console.log('📋 Slack challenge received');
      return res.json({ challenge: req.body.challenge });
    }

    // Handle SOS reaction events
    if (req.body.event && req.body.event.type === 'reaction_added') {
      if (req.body.event.reaction === 'sos') {
        console.log('🆘 SOS reaction detected - Processing bug report...', {
          user: req.body.event.user,
          channel: req.body.event.item.channel,
          timestamp: req.body.event.item.ts
        });
        
        // Process asynchronously to avoid timeout
        setImmediate(() => processSOSReaction(req.body.event));
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Error handling Slack event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the Express app for Cloud Functions
exports.bugReportPipeline = app;
