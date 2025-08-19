/**
 * User Education Response System
 * Provides helpful responses for non-bug issues
 */

class UserEducationSystem {
  constructor() {
    this.educationalResponses = {
      // Password/Login Issues
      passwordIssues: {
        patterns: [/forgot.*password/i, /can't.*login/i, /lost.*password/i],
        response: `🔐 **Password Help**

Here are the steps to reset your password:
1. Go to the Mereka login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for reset link
5. Follow the link to create a new password

💡 **Tips:**
- Check your spam folder if you don't see the email
- Make sure you're using the email you registered with
- Try clearing your browser cache if issues persist

If you're still having trouble, please contact our support team! 💬`
      },

      // Navigation/Finding Features
      navigationHelp: {
        patterns: [/where.*is/i, /can't.*find/i, /how.*do.*i.*find/i],
        response: `🧭 **Navigation Help**

**Common locations:**
- **Profile Settings:** Click your avatar → Profile Settings
- **Create Experience:** Main menu → Create → New Experience  
- **Job Postings:** Navigation bar → Jobs
- **Expert Profiles:** Navigation bar → Experts
- **My Dashboard:** Click your avatar → Dashboard

💡 **Quick tip:** Use the search bar at the top to find specific content!

Need help finding something specific? Let us know what you're looking for! 🔍`
      },

      // Feature Understanding
      featureExplanation: {
        patterns: [/what.*does.*mean/i, /how.*does.*work/i, /explain/i],
        response: `📚 **Feature Explanation**

**Key Mereka Platform Features:**
- **Experiences:** Learning sessions created by experts
- **Expert Profiles:** Showcase your skills and expertise
- **Job Marketplace:** Find and post job opportunities
- **Collections:** Save and organize your favorite content

🎥 **Want a quick tour?** Check out our Getting Started Guide or Video Tutorials

Have a specific feature question? Feel free to ask! 💬`
      },

      // Technical Environment Issues
      browserIssues: {
        patterns: [/browser/i, /chrome/i, /safari/i, /firefox/i, /cache/i],
        response: `🌐 **Browser & Technical Help**

**Quick fixes to try:**
1. **Clear browser cache:** Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Try incognito/private mode:** Ctrl+Shift+N (or Cmd+Shift+N on Mac)
3. **Update your browser:** Make sure you're using the latest version
4. **Disable extensions:** Some extensions can interfere with websites

**Recommended browsers:** Chrome, Firefox, Safari (latest versions)

Still having issues? Try a different browser or device! 🔧`
      },

      // Mobile Issues
      mobileHelp: {
        patterns: [/mobile/i, /phone/i, /iphone/i, /android/i, /tablet/i],
        response: `📱 **Mobile Experience Help**

**Mobile tips:**
- Use the latest version of your mobile browser
- For best experience, use Chrome or Safari on mobile
- Some features work better in landscape mode
- Make sure you have a stable internet connection

**Having trouble with specific mobile features?** 
Many users find the desktop version easier for complex tasks like creating experiences or managing profiles.

Let us know if you need help with a specific mobile feature! 📞`
      },

      // Account & Profile Issues
      accountIssues: {
        patterns: [/account/i, /profile/i, /verification/i, /incomplete/i],
        response: `👤 **Account & Profile Help**

**Common account solutions:**
- **Email verification:** Check your inbox and spam folder
- **Profile completion:** Go to Profile Settings to add missing information
- **Account access:** Try password reset if locked out
- **Subscription issues:** Contact billing support

**Profile tips:**
- Complete your profile for better visibility
- Add skills and expertise to attract opportunities
- Upload a professional photo

Need account-specific help? Contact support with your email address! 📧`
      },

      // Experience Creation Help
      experienceHelp: {
        patterns: [/experience/i, /create.*experience/i, /how.*to.*create/i],
        response: `🎯 **Experience Creation Help**

**Step-by-step guide:**
1. Go to Create → New Experience
2. Choose experience type (Virtual, Physical, or Hybrid)
3. Fill in title, description, and requirements
4. Set pricing and availability
5. Add images and detailed curriculum
6. Publish when ready

**Tips for success:**
- Write clear, engaging descriptions
- Set competitive pricing
- Add high-quality images
- Include detailed learning outcomes

Need help with a specific step? Let us know! 🚀`
      },

      // Job-related Help
      jobHelp: {
        patterns: [/job/i, /apply/i, /posting/i, /career/i],
        response: `💼 **Job & Career Help**

**For job seekers:**
- Browse jobs by category or search keywords
- Use filters to find relevant opportunities
- Save jobs to your collections for later
- Apply directly through the platform

**For employers:**
- Post detailed job descriptions
- Set clear requirements and compensation
- Review applications in your dashboard
- Manage hiring pipeline efficiently

**Tips:**
- Complete your profile for better job matches
- Tailor applications to each position
- Follow up appropriately with employers

Questions about a specific job? Contact the poster directly! 💪`
      }
    };

    this.contextualResponses = {
      // Mereka-specific features
      merekaSpeficic: {
        patterns: [/mereka/i, /platform/i],
        additionalInfo: `

🏢 **About Mereka Platform:**
Mereka connects learners with expert-led experiences and job opportunities. Whether you're looking to learn new skills, share your expertise, or find career opportunities, we've got you covered!

📞 **Need more help?**
- Email: support@mereka.my
- Live chat: Available during business hours
- Help center: Browse our FAQ and guides`
      }
    };
  }

  /**
   * Generate educational response based on issue content
   */
  async generateEducationalResponse(issueText, classification) {
    console.log('📚 Generating educational response...');
    
    // Find the most relevant educational response
    let bestMatch = null;
    let maxMatches = 0;

    Object.entries(this.educationalResponses).forEach(([category, config]) => {
      const matches = config.patterns.filter(pattern => 
        pattern.test(issueText)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = { category, response: config.response };
      }
    });

    if (bestMatch) {
      console.log(`✅ Found matching response category: ${bestMatch.category}`);
      return this.formatResponse(bestMatch.response, issueText);
    }

    // Fallback to generic helpful response
    console.log('📝 Using generic helpful response');
    return this.generateGenericHelpfulResponse(issueText, classification);
  }

  /**
   * Format response with context-specific additions
   */
  formatResponse(baseResponse, issueText) {
    let formattedResponse = baseResponse;

    // Add Mereka-specific context if relevant
    if (/mereka/i.test(issueText) || /platform/i.test(issueText)) {
      formattedResponse += this.contextualResponses.merekaSpeficic.additionalInfo;
    }

    return formattedResponse;
  }

  /**
   * Generate generic helpful response for unmatched cases
   */
  generateGenericHelpfulResponse(issueText, classification) {
    return `🤗 **We're Here to Help!**

Thanks for reaching out! It looks like you might be experiencing a user experience issue rather than a technical bug.

**Quick help options:**
📚 Check our Help Center for common questions
💬 Contact our support team for personalized assistance  
🎥 Watch our Getting Started Videos
📧 Email us at support@mereka.my

**For faster help, please include:**
- What you were trying to do
- What you expected to happen
- What actually happened
- Screenshots if possible

**Common solutions:**
- Clear your browser cache and cookies
- Try using a different browser or device
- Check your internet connection
- Disable browser extensions temporarily

We're committed to making Mereka easy to use! ✨

If this is actually a technical issue that needs developer attention, please add 🚨 reaction to get immediate escalation.`;
  }

  /**
   * Generate contextual help based on user profile
   */
  generateContextualHelp(userContext, issueText) {
    const suggestions = [];

    // User type specific suggestions
    if (userContext.userType === 'expert') {
      suggestions.push('💡 **Expert tip:** Your profile completeness affects visibility in search results');
    } else if (userContext.userType === 'learner') {
      suggestions.push('🎓 **Learner tip:** Save interesting experiences to your collections for easy access');
    }

    // Technical level specific suggestions
    if (userContext.techLevel === 'beginner') {
      suggestions.push('🔰 **New user?** Consider taking our platform tour for a complete overview');
    }

    return suggestions.join('\n');
  }

  /**
   * Create educational ticket for tracking
   */
  async createEducationalTicket(issueText, userInfo, response) {
    const ticket = {
      type: 'user_education',
      title: `User Education Request: ${this.extractTitle(issueText)}`,
      description: `**Original Message:**
${issueText}

**User Information:**
- User ID: ${userInfo.userId || 'Unknown'}
- Channel: ${userInfo.channel || 'Unknown'}

**Educational Response Provided:**
${response}

**Follow-up Actions:**
- Monitor if user needs additional help
- Track common education requests for content improvement
- No code changes required`,
      priority: 'low',
      labels: ['user-education', 'not-a-bug', 'knowledge-base'],
      assignee: 'support-team'
    };

    return ticket;
  }

  /**
   * Extract meaningful title from issue text
   */
  extractTitle(issueText) {
    // Remove emoji and clean up text
    const cleanText = issueText.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract first meaningful phrase (up to 50 characters)
    const title = cleanText.length > 50 
      ? cleanText.substring(0, 47) + '...'
      : cleanText;
    
    return title || 'General Help Request';
  }

  /**
   * Track education effectiveness
   */
  async trackEducationMetrics(category, issueText, userSatisfied = null) {
    const metrics = {
      category,
      issueText: issueText.substring(0, 100), // Store excerpt
      timestamp: Date.now(),
      userSatisfied,
      responseGenerated: true
    };

    // In real implementation, save to analytics database
    console.log('📊 Tracking education metrics:', metrics);
    return metrics;
  }

  /**
   * Generate weekly education report
   */
  async generateEducationReport() {
    // In real implementation, query database for education metrics
    const report = {
      totalEducationResponses: 0,
      topCategories: [],
      userSatisfactionRate: 0,
      commonQuestions: [],
      contentGaps: [],
      recommendations: []
    };

    console.log('📈 Generated education effectiveness report');
    return report;
  }
}

module.exports = { UserEducationSystem };
