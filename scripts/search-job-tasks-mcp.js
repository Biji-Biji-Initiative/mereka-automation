/**
 * Search ClickUp for Job-related tasks using API
 */

// ClickUp API configuration
if (!process.env.CLICKUP_TOKEN) {
  throw new Error('❌ CLICKUP_TOKEN environment variable is required');
}
const CLICKUP_API_TOKEN = process.env.CLICKUP_TOKEN;
const TEAM_ID = '2627356';
const BUG_LIST_ID = '900501824745'; // All bugs list

async function searchJobTasks() {
  console.log('🔍 Searching ClickUp for Job-related tasks...\n');

  const headers = {
    'Authorization': CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  };

  try {
    // Get all tasks from the main bug list
    console.log('📋 Getting tasks from "All bugs" list...');
    const response = await fetch(`https://api.clickup.com/api/v2/list/${BUG_LIST_ID}/task`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const allTasks = data.tasks || [];

    // Filter tasks that contain "Job" in title or description
    const jobTasks = allTasks.filter(task => {
      const titleMatch = task.name && task.name.toLowerCase().includes('job');
      const descMatch = task.description && task.description.toLowerCase().includes('job');
      return titleMatch || descMatch;
    });

    console.log(`📊 Found ${jobTasks.length} Job-related tasks out of ${allTasks.length} total tasks\n`);

    if (jobTasks.length === 0) {
      console.log('❌ No Job-related tasks found in the "All bugs" list');
      return;
    }

    // Display Job-related tasks
    console.log('🎯 Job-related tasks:');
    console.log('=' .repeat(80));

    jobTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. 📋 ${task.name}`);
      console.log(`   🔗 URL: ${task.url}`);
      console.log(`   📅 Status: ${task.status?.status || 'Unknown'}`);
      console.log(`   👤 Assignees: ${task.assignees?.map(a => a.username).join(', ') || 'Unassigned'}`);
      console.log(`   🏷️  Priority: ${task.priority?.priority || 'No priority'}`);
      
      if (task.description && task.description.length > 0) {
        const shortDesc = task.description.length > 100 
          ? task.description.substring(0, 100) + '...' 
          : task.description;
        console.log(`   📝 Description: ${shortDesc}`);
      }
      
      console.log(`   📊 ID: ${task.id}`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log(`✅ Search complete! Found ${jobTasks.length} Job-related tasks`);

    return jobTasks;

  } catch (error) {
    console.error('❌ Error searching for Job tasks:', error.message);
    return [];
  }
}

// Run the search
if (require.main === module) {
  searchJobTasks().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { searchJobTasks };

