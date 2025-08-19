const https = require('https');

const CLICKUP_TOKEN = 'pk_66733245_76BVBTVC88U8QUMWSOAW9FDRTXZ28H15';

console.log('🔄 Testing ClickUp connection...');

const options = {
  hostname: 'api.clickup.com',
  path: '/api/v2/team',
  method: 'GET',
  headers: {
    'Authorization': CLICKUP_TOKEN,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const teams = JSON.parse(data);
      console.log('✅ ClickUp connection successful!');
      console.log('\n📋 Your Team Information:');
      
      if (teams.teams && teams.teams.length > 0) {
        teams.teams.forEach((team, index) => {
          console.log(`\n   Team ${index + 1}:`);
          console.log(`   🏷️  Name: ${team.name}`);
          console.log(`   🆔 Team ID: ${team.id}`);
          console.log(`   👥 Members: ${team.members.length}`);
        });
        
        console.log('\n🎯 Use this Team ID in your MCP configuration:');
        console.log(`   CLICKUP_TEAM_ID: "${teams.teams[0].id}"`);
      } else {
        console.log('❌ No teams found');
      }
    } else {
      console.log(`❌ Error: HTTP ${res.statusCode}`);
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection error: ${e.message}`);
});

req.end(); 