#!/usr/bin/env node

const https = require('https');

// ClickUp API configuration
const API_TOKEN = 'YOUR_CLICKUP_API_TOKEN_HERE';
const PRD_FOLDER_ID = '90166093693';

/**
 * Make ClickUp API request
 */
function makeClickUpRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clickup.com',
      path: `/api/v2${endpoint}`,
      method: method,
      headers: {
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${jsonData.err || jsonData.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}. Response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Generate comprehensive PRD content
 */
function generatePRDContent() {
  return `🎯 PRODUCT REQUIREMENTS DOCUMENT: JOB CREATION & POSTING

📋 OVERVIEW
============
This PRD covers the complete job creation and posting functionality, allowing clients to create, publish, and manage job posts on the Mereka platform. Based on analysis of 27 job-related tasks from the development backlog.

👥 USER PERSONAS
================
• Primary: Clients/Employers looking to hire experts
• Secondary: Platform administrators managing job quality
• Tertiary: Expert users who will receive job applications

🎯 BUSINESS OBJECTIVES
======================
• Enable seamless job posting experience
• Improve job post quality and discoverability  
• Increase job posting conversion rates
• Enhance SEO visibility of job posts
• Reduce time-to-post for new jobs
• Improve mobile job posting experience

🔧 FUNCTIONAL REQUIREMENTS
==========================

1. JOB FORM CREATION
   ✅ Responsive job posting form
   ✅ Form validation and error handling
   ✅ Mobile optimization (screen width issues resolved)
   ✅ Draft saving capability
   ✅ Rich text description editor
   ✅ File attachment support

2. JOB POST PUBLISHING
   ✅ Public job post creation
   ✅ Private job post option
   ✅ Job categorization and tagging
   ✅ Rich text description support
   ✅ Job duration and budget settings
   ✅ Skills and expertise requirements

3. SEO & DISCOVERY
   ✅ Meta tags implementation for job posts
   ✅ Schema markup for better search visibility
   ✅ URL optimization for job posts
   ✅ Social media preview optimization

4. JOB POST MANAGEMENT
   ✅ Edit existing job posts
   ✅ Archive/delete job posts
   ✅ Status management (draft, published, closed)
   ✅ Auto-close after 1 month feature

📊 SUCCESS METRICS
==================
• Job posting completion rate > 85%
• Mobile job posting success rate > 90%
• SEO click-through rate improvement > 20%
• Time to complete job posting < 5 minutes
• Form abandonment rate < 15%
• Mobile responsiveness score > 95%

🔗 RELATED TASKS (from your 27 job tasks analyzed)
=================================================
• Job single page - Implement meta tags (Sprint 43)
• [Issue] Job Form on Mobile Doesn't Fit Screen Width (Sprint 48) 
• [Technical] Implement schema markup for job, expert, hub (Sprint 48)
• All job posts - Make job post as private (Sprint 48)
• Job - Make job posts auto Closed 1 month after posted date (Sprint 48)

⚠️ DEPENDENCIES
===============
• User authentication system
• Payment processing (for premium job posts)
• File upload service (for attachments)
• Notification system
• Search indexing service
• Email notification service

🎨 DESIGN REQUIREMENTS
======================
• Follow Mereka design system
• Mobile-first responsive design
• Clear form validation messaging
• Intuitive job posting workflow
• Progressive disclosure for advanced options
• Consistent with existing platform UX

🧪 TESTING REQUIREMENTS
=======================
• Cross-browser compatibility testing
• Mobile device testing (iOS/Android)
• Form validation testing
• SEO markup validation
• Performance testing (page load < 3s)
• Accessibility testing (WCAG compliance)
• Load testing for high volume periods

📅 IMPLEMENTATION PHASES
========================
Phase 1: Core job posting form ✅ (Completed - Sprint 43)
Phase 2: Mobile optimization ✅ (Completed - Sprint 48) 
Phase 3: SEO implementation ✅ (In Progress - Sprint 48)
Phase 4: Private posting feature ✅ (In Progress - Sprint 48)
Phase 5: Auto-close functionality ✅ (In Progress - Sprint 48)

🔍 ACCEPTANCE CRITERIA
======================
• Users can create job posts in under 5 minutes
• Form works seamlessly on mobile devices (width issues resolved)
• Job posts are properly indexed by search engines
• Private job posts are accessible only to intended recipients
• All form validations work correctly with clear error messages
• Meta tags are properly generated for each job post
• Jobs auto-close after 1 month unless manually extended
• Mobile form displays correctly across all screen sizes

🚨 KNOWN ISSUES & RESOLUTIONS
=============================
• Mobile form width issues → RESOLVED in Sprint 48
• Schema markup implementation → IN PROGRESS Sprint 48
• Auto-close functionality → IN PROGRESS Sprint 48
• Private job posting access control → IN PROGRESS Sprint 48

💡 FUTURE ENHANCEMENTS
======================
• AI-powered job description suggestions
• Bulk job posting capabilities
• Advanced job post analytics
• Job post templates
• Integration with external job boards
• Automated job renewal options
• Enhanced tagging and categorization
• Job post performance insights

🔄 INTEGRATION POINTS
====================
• Job Application & Proposals system
• Job Contract Management system
• Payment Processing system
• Notification & Communication system
• Expert Profile system
• Search & Discovery system

---
Document Created: ${new Date().toISOString().split('T')[0]}
Author: AI Assistant - Mereka Automation Team
Version: 1.0
Last Updated: ${new Date().toISOString().split('T')[0]}
Status: Ready for Review`;
}

/**
 * Create complete PRD setup
 */
async function createCompletePRD() {
  console.log('🏗️ Creating Complete Job Creation & Posting PRD...\n');

  try {
    // Check folder
    console.log('1. Checking PRD folder...');
    const folderInfo = await makeClickUpRequest(`/folder/${PRD_FOLDER_ID}`);
    console.log(`   📁 Folder: "${folderInfo.name}"`);
    console.log(`   📋 Existing lists: ${folderInfo.lists.length}`);

    let targetList;

    if (folderInfo.lists.length === 0) {
      // Create new list
      console.log('\n2. Creating new list for PRDs...');
      const listData = {
        name: 'Job Feature PRDs',
        content: 'Product Requirements Documents for Job platform features'
      };
      
      targetList = await makeClickUpRequest(`/folder/${PRD_FOLDER_ID}/list`, 'POST', listData);
      console.log(`   ✅ Created list: "${targetList.name}" (ID: ${targetList.id})`);
    } else {
      targetList = folderInfo.lists[0];
      console.log(`   ✅ Using existing list: "${targetList.name}" (ID: ${targetList.id})`);
    }

    // Check for existing PRD tasks
    console.log('\n3. Checking for existing PRD tasks...');
    const tasksResponse = await makeClickUpRequest(`/list/${targetList.id}/task`);
    const existingTasks = tasksResponse.tasks || [];
    
    const existingPRD = existingTasks.find(task => 
      task.name.toLowerCase().includes('job creation') && 
      task.name.toLowerCase().includes('posting')
    );

    if (existingPRD) {
      console.log('\n✅ Job Creation & Posting PRD already exists!');
      console.log(`📋 Existing PRD: "${existingPRD.name}"`);
      console.log(`🔗 URL: ${existingPRD.url}`);
      return {
        taskId: existingPRD.id,
        taskUrl: existingPRD.url,
        listId: targetList.id,
        name: existingPRD.name
      };
    }

    // Create PRD task with default status
    console.log('\n4. Creating Job Creation & Posting PRD task...');
    const taskData = {
      name: 'Job Creation & Posting - Product Requirements Document',
      description: generatePRDContent(),
      tags: ['PRD', 'Job', 'Product-Requirements', 'Documentation', 'Job-Creation', 'Job-Posting']
    };

    const prdTask = await makeClickUpRequest(`/list/${targetList.id}/task`, 'POST', taskData);
    
    console.log('\n🎉 SUCCESS!');
    console.log(`📋 PRD Task Created Successfully!`);
    console.log(`🆔 Task ID: ${prdTask.id}`);
    console.log(`📄 Task Name: ${prdTask.name}`);
    console.log(`🔗 Direct URL: ${prdTask.url}`);
    console.log(`📁 List URL: https://app.clickup.com/2627356/v/li/${targetList.id}`);

    return {
      taskId: prdTask.id,
      taskUrl: prdTask.url,
      listId: targetList.id,
      name: prdTask.name
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the creation
createCompletePRD().then(result => {
  if (result) {
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Job Creation & Posting PRD created successfully!`);
    console.log(`🔗 Access your PRD here: ${result.taskUrl}`);
    console.log(`📝 Document: "${result.name}"`);
    console.log('\n🎯 WHAT YOU CAN DO NOW:');
    console.log('• ✅ Review the comprehensive PRD in ClickUp');
    console.log('• ✅ Share with your team for feedback');
    console.log('• ✅ Link related tasks to this PRD');
    console.log('• ✅ Use this as template for other job feature PRDs');
    console.log('\n📋 READY TO CREATE NEXT PRDs:');
    console.log('  1. Job Application & Proposals PRD');
    console.log('  2. Job Contract Management PRD');
    console.log('  3. Job Payment Processing PRD');
    console.log('  4. Job Communication PRD');
    console.log('  5. Job Status & Workflow PRD');
  }
}); 