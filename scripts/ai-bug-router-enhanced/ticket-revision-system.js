/**
 * Ticket Revision System
 * Handles real-time revision of ClickUp tickets based on user clarifications
 */

const fetch = require('node-fetch');

class TicketRevisionSystem {
  constructor(clickupApiKey, slackToken) {
    this.clickupApiKey = clickupApiKey;
    this.slackToken = slackToken;
    
    // Additional revision emojis (add to existing ones)
    this.revisionEmojis = {
      // REVISE EXISTING TICKET: Re-analyze and update current ticket
      '🔧': {
        action: 'revise_existing_ticket',
        description: 'AI got it wrong - please revise this ticket with correct understanding',
        workflow: 'reanalyze_and_update_ticket'
      },

      // EDIT DESCRIPTION: Update ticket description only
      '📝': {
        action: 'edit_ticket_description',
        description: 'Update the ticket description with additional context',
        workflow: 'update_description_only'
      },

      // CHANGE CATEGORY: Reclassify ticket type
      '🏷️': {
        action: 'change_ticket_category',
        description: 'This ticket is in wrong category - reclassify it',
        workflow: 'reclassify_ticket_type'
      },

      // MARK INVALID: Close ticket as invalid
      '❌': {
        action: 'mark_ticket_invalid',
        description: 'This ticket should not have been created - mark as invalid',
        workflow: 'close_as_invalid'
      }
    };
  }

  /**
   * Handle ticket revision based on user clarification
   */
  async processTicketRevision(originalMessage, revisionEmoji, clarificationUser, channel) {
    console.log(`🔧 Processing ticket revision: ${revisionEmoji}`);
    
    try {
      // Step 1: Find the existing ticket
      const existingTicket = await this.findExistingTicket(originalMessage);
      if (!existingTicket) {
        throw new Error('No existing ticket found for this message');
      }

      // Step 2: Get user clarification from thread/context
      const clarificationContext = await this.getClarificationContext(originalMessage, channel);
      
      // Step 3: Execute revision workflow
      const revisionConfig = this.revisionEmojis[revisionEmoji];
      let result;
      
      switch (revisionConfig.action) {
        case 'revise_existing_ticket':
          result = await this.reviseTicketWithAI(existingTicket, originalMessage, clarificationContext);
          break;
          
        case 'edit_ticket_description':
          result = await this.updateTicketDescription(existingTicket, clarificationContext);
          break;
          
        case 'change_ticket_category':
          result = await this.reclassifyTicket(existingTicket, clarificationContext);
          break;
          
        case 'mark_ticket_invalid':
          result = await this.markTicketInvalid(existingTicket, clarificationUser);
          break;
          
        default:
          throw new Error(`Unknown revision action: ${revisionConfig.action}`);
      }

      // Step 4: Send confirmation to Slack
      await this.sendRevisionConfirmation(channel, existingTicket, result, revisionConfig);
      
      // Step 5: Log the revision for tracking
      await this.logTicketRevision(existingTicket, revisionConfig.action, clarificationUser, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Ticket revision failed:', error);
      await this.sendRevisionError(channel, error.message);
      throw error;
    }
  }

  /**
   * Find existing ClickUp ticket for the Slack message
   */
  async findExistingTicket(slackMessage) {
    console.log('🔍 Looking for existing ticket...');
    
    // In real implementation, this would query the issue tracking database
    // For now, simulating the lookup
    const ticketId = await this.lookupTicketBySlackMessage(slackMessage);
    
    if (!ticketId) {
      return null;
    }

    // Get ticket details from ClickUp
    const response = await fetch(`https://api.clickup.com/api/v2/task/${ticketId}`, {
      headers: {
        'Authorization': this.clickupApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error: ${response.status}`);
    }

    const ticket = await response.json();
    console.log(`✅ Found existing ticket: ${ticket.name} (ID: ${ticket.id})`);
    return ticket;
  }

  /**
   * Get clarification context from Slack thread
   */
  async getClarificationContext(originalMessage, channel) {
    console.log('💬 Getting clarification context...');
    
    try {
      // Get thread replies to find user clarifications
      const response = await fetch(`https://slack.com/api/conversations.replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.slackToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          channel: channel,
          ts: originalMessage.ts,
          limit: 50
        })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
      }

      // Extract clarifications from thread
      const clarifications = data.messages
        .slice(1) // Skip original message
        .filter(msg => !msg.bot_id) // Only human messages
        .map(msg => msg.text)
        .join('\n\n');

      console.log(`✅ Found clarifications: ${clarifications.length} characters`);
      return {
        original_message: originalMessage.text,
        clarifications: clarifications,
        thread_count: data.messages.length - 1
      };
      
    } catch (error) {
      console.error('⚠️ Could not get clarification context:', error);
      return {
        original_message: originalMessage.text,
        clarifications: '',
        thread_count: 0
      };
    }
  }

  /**
   * Revise ticket using AI with new context
   */
  async reviseTicketWithAI(existingTicket, originalMessage, clarificationContext) {
    console.log('🤖 Revising ticket with AI...');
    
    // Simulate AI re-analysis with clarification context
    const prompt = `
REVISE THIS TICKET BASED ON USER CLARIFICATION:

Original Issue: "${originalMessage.text}"

Current Ticket:
- Title: "${existingTicket.name}"
- Description: "${existingTicket.description}"
- Status: "${existingTicket.status.status}"

User Clarification: "${clarificationContext.clarifications}"

Please provide:
1. Revised ticket title
2. Updated description incorporating the clarification
3. Correct category/priority based on new understanding
4. Any status changes needed

Focus on the user's clarification to correct any misunderstanding.
`;

    // In real implementation, this would call OpenAI API
    // For now, simulating the response
    const revisedTicket = this.simulateAIRevision(existingTicket, clarificationContext);
    
    // Update the ClickUp ticket
    const updateResult = await this.updateClickUpTicket(existingTicket.id, revisedTicket);
    
    console.log('✅ Ticket revised successfully');
    return {
      action: 'revised',
      original_title: existingTicket.name,
      new_title: revisedTicket.name,
      changes_made: updateResult.changes,
      ticket_url: `https://app.clickup.com/t/${existingTicket.id}`
    };
  }

  /**
   * Update ticket description with additional context
   */
  async updateTicketDescription(existingTicket, clarificationContext) {
    console.log('📝 Updating ticket description...');
    
    const updatedDescription = `${existingTicket.description}

📝 **Additional Context from User:**
${clarificationContext.clarifications}

⏰ **Updated:** ${new Date().toLocaleString()}`;

    await this.updateClickUpTicket(existingTicket.id, {
      description: updatedDescription
    });
    
    return {
      action: 'description_updated',
      ticket_url: `https://app.clickup.com/t/${existingTicket.id}`,
      added_context: clarificationContext.clarifications.length + ' characters'
    };
  }

  /**
   * Reclassify ticket to correct category
   */
  async reclassifyTicket(existingTicket, clarificationContext) {
    console.log('🏷️ Reclassifying ticket...');
    
    // Analyze clarification to determine correct category
    const newCategory = this.determineCorrectCategory(clarificationContext);
    
    const updates = {
      status: newCategory.status,
      priority: newCategory.priority,
      tags: newCategory.tags
    };
    
    await this.updateClickUpTicket(existingTicket.id, updates);
    
    return {
      action: 'reclassified',
      old_category: existingTicket.status.status,
      new_category: newCategory.status,
      ticket_url: `https://app.clickup.com/t/${existingTicket.id}`
    };
  }

  /**
   * Mark ticket as invalid
   */
  async markTicketInvalid(existingTicket, clarificationUser) {
    console.log('❌ Marking ticket as invalid...');
    
    const updates = {
      status: 'closed',
      description: `${existingTicket.description}

❌ **MARKED AS INVALID**
- Marked by: ${clarificationUser}
- Reason: This issue should not have been created as a ticket
- Date: ${new Date().toLocaleString()}`
    };
    
    await this.updateClickUpTicket(existingTicket.id, updates);
    
    return {
      action: 'marked_invalid',
      marked_by: clarificationUser,
      ticket_url: `https://app.clickup.com/t/${existingTicket.id}`
    };
  }

  /**
   * Update ClickUp ticket with new data
   */
  async updateClickUpTicket(ticketId, updates) {
    console.log(`🔄 Updating ClickUp ticket ${ticketId}...`);
    
    const response = await fetch(`https://api.clickup.com/api/v2/task/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.clickupApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ ClickUp ticket updated successfully');
    return result;
  }

  /**
   * Send revision confirmation to Slack
   */
  async sendRevisionConfirmation(channel, originalTicket, result, revisionConfig) {
    const message = `✅ Ticket Revision Complete!

🎯 Action: ${revisionConfig.description}
📄 Ticket: ${originalTicket.name}
🔗 Link: ${result.ticket_url}

📋 Changes Made:
${this.formatChanges(result)}

The ticket has been updated based on your clarification!`;

    await this.sendSlackMessage(channel, message);
  }

  /**
   * Send revision error to Slack
   */
  async sendRevisionError(channel, errorMessage) {
    const message = `❌ Ticket Revision Failed

Error: ${errorMessage}

Please try again or contact support if the issue persists.`;

    await this.sendSlackMessage(channel, message);
  }

  /**
   * Send message to Slack
   */
  async sendSlackMessage(channel, message) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: channel,
        text: message
      })
    });

    if (!response.ok) {
      throw new Error(`Slack API Error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Helper methods
   */
  async lookupTicketBySlackMessage(slackMessage) {
    // Simulate database lookup - replace with real implementation
    return '86czwx84g'; // Example ticket ID
  }

  simulateAIRevision(existingTicket, clarificationContext) {
    // Simulate AI analysis - replace with real OpenAI call
    return {
      name: `[REVISED] ${existingTicket.name}`,
      description: `${existingTicket.description}\n\n🔧 REVISED BASED ON CLARIFICATION:\n${clarificationContext.clarifications}`,
      priority: 2
    };
  }

  determineCorrectCategory(clarificationContext) {
    // Analyze clarification to determine category - replace with real logic
    return {
      status: 'in progress',
      priority: 2,
      tags: ['revised', 'user-clarified']
    };
  }

  formatChanges(result) {
    switch (result.action) {
      case 'revised':
        return `- Title: ${result.original_title} → ${result.new_title}`;
      case 'description_updated':
        return `- Added ${result.added_context} of clarification context`;
      case 'reclassified':
        return `- Category: ${result.old_category} → ${result.new_category}`;
      case 'marked_invalid':
        return `- Status: Active → Closed (Invalid)`;
      default:
        return '- General updates applied';
    }
  }

  async logTicketRevision(ticket, action, user, result) {
    console.log(`📝 Logging revision: ${action} by ${user} on ticket ${ticket.id}`);
    // Implement revision logging for analytics
  }
}

module.exports = { TicketRevisionSystem };
