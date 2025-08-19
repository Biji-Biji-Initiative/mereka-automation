const https = require('https');

// ClickUp API configuration
const CLICKUP_API_TOKEN = 'YOUR_CLICKUP_API_TOKEN_HERE';
const LIST_ID = '900501824745'; // "All bugs" list
const API_URL = `https://api.clickup.com/api/v2/list/${LIST_ID}/task`;

// Task data
const taskData = {
  name: `Test automation task - ${new Date().toISOString().substring(0, 19)}`,
  description: 'This is a test task created via direct ClickUp API from Cursor IDE automation suite. No Slack notification required.',
  priority: 2,
  status: 'to do',
  tags: ['automation', 'test', 'no-slack']
};

// Create the task
function createTask() {
  const postData = JSON.stringify(taskData);
  
  const options = {
    hostname: 'api.clickup.com',
    port: 443,
    path: `/api/v2/list/${LIST_ID}/task`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': CLICKUP_API_TOKEN,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔄 Creating ClickUp task...');
  console.log('📋 Task name:', taskData.name);
  console.log('📝 Description:', taskData.description);
  console.log('🎯 List ID:', LIST_ID);
  
  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('✅ Task created successfully!');
          console.log('🆔 Task ID:', response.id);
          console.log('🔗 Task URL:', response.url);
          console.log('📊 Status:', response.status?.status || 'to do');
          console.log('🏷️  Tags:', response.tags?.map(tag => tag.name).join(', ') || 'None');
          console.log('\n🚫 No Slack notification sent as requested.');
        } else {
          console.error('❌ Error creating task:', res.statusCode);
          console.error('Response:', data);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.error('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

// Execute the task creation
createTask(); 