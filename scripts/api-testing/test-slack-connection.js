const https = require('https');

const SLACK_TOKEN = 'your-slack-bot-token';
const TEAM_ID = 'bijimereka';
const CHANNEL_IDS = ['C023FUQH7B2', 'C02GDJUE8LW'];

console.log('🔄 Testing Slack connection...');

// Helper function to make Slack API requests
function makeSlackRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'slack.com',
      path: `/api/${path}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request Error: ${e.message}`));
    });

    req.end();
  });
}

async function testSlackConnection() {
  try {
    // Test auth
    console.log('🔐 Testing authentication...');
    const authTest = await makeSlackRequest('auth.test');
    
    if (authTest.ok) {
      console.log('✅ Slack authentication successful!');
      console.log(`\n📋 Bot Information:`);
      console.log(`   🤖 Bot Name: ${authTest.user}`);
      console.log(`   🏢 Team: ${authTest.team}`);
      console.log(`   🆔 Team ID: ${authTest.team_id}`);
      console.log(`   🆔 User ID: ${authTest.user_id}`);
      
      // Test channels access
      console.log('\n📢 Testing channel access...');
      const channelsInfo = await makeSlackRequest('conversations.list');
      
      if (channelsInfo.ok) {
        console.log('✅ Channel access successful!');
        
        const targetChannels = channelsInfo.channels.filter(channel => 
          CHANNEL_IDS.includes(channel.id)
        );
        
        console.log(`\n🎯 Your configured channels:`);
        CHANNEL_IDS.forEach(channelId => {
          const channel = targetChannels.find(c => c.id === channelId);
          if (channel) {
            console.log(`   ✅ #${channel.name} (${channelId})`);
          } else {
            console.log(`   ❌ Channel ${channelId} not found or no access`);
          }
        });
        
        console.log('\n🚀 MCP Setup Status:');
        console.log('   ✅ Bot token valid');
        console.log('   ✅ Team access confirmed');
        console.log('   ✅ API permissions working');
        console.log('\n🎉 Ready to use with Cursor MCP!');
        
      } else {
        console.log('❌ Channel access failed:', channelsInfo.error);
      }
      
    } else {
      console.log('❌ Authentication failed:', authTest.error);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testSlackConnection(); 