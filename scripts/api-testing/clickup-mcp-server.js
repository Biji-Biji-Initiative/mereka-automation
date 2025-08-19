#!/usr/bin/env node

/**
 * ClickUp MCP Server
 * Simple MCP server for ClickUp integration
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const https = require('https');

// Get environment variables
const CLICKUP_TOKEN = process.env.CLICKUP_PERSONAL_TOKEN;
const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!CLICKUP_TOKEN) {
  console.error('❌ CLICKUP_PERSONAL_TOKEN environment variable is required');
  process.exit(1);
}

// Helper function to make ClickUp API requests
function makeClickUpRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clickup.com',
      path: `/api/v2${path}`,
      method: method,
      headers: {
        'Authorization': CLICKUP_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`ClickUp API Error: ${res.statusCode} - ${jsonData.err || jsonData.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request Error: ${e.message}`));
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Create MCP server
const server = new Server(
  {
    name: 'clickup-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List spaces tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'list_spaces',
        description: 'List all spaces in the ClickUp team',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'create_task',
        description: 'Create a new task in ClickUp',
        inputSchema: {
          type: 'object',
          properties: {
            list_id: {
              type: 'string',
              description: 'The list ID where the task should be created'
            },
            name: {
              type: 'string',
              description: 'The name of the task'
            },
            description: {
              type: 'string',
              description: 'The description of the task'
            },
            priority: {
              type: 'string',
              description: 'Priority level (1=Urgent, 2=High, 3=Normal, 4=Low)',
              enum: ['1', '2', '3', '4']
            }
          },
          required: ['list_id', 'name']
        }
      },
      {
        name: 'list_tasks',
        description: 'List tasks from a specific list',
        inputSchema: {
          type: 'object',
          properties: {
            list_id: {
              type: 'string',
              description: 'The list ID to get tasks from'
            }
          },
          required: ['list_id']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_spaces':
        if (!CLICKUP_TEAM_ID) {
          throw new Error('CLICKUP_TEAM_ID environment variable is required for this operation');
        }
        const spacesData = await makeClickUpRequest(`/team/${CLICKUP_TEAM_ID}/space`);
        return {
          content: [
            {
              type: 'text',
              text: `📁 ClickUp Spaces:\n\n${spacesData.spaces.map(space => 
                `• ${space.name} (ID: ${space.id})\n  ${space.multiple_assignees ? '👥' : '👤'} ${space.statuses.length} statuses`
              ).join('\n\n')}`
            }
          ]
        };

      case 'create_task':
        const taskData = {
          name: args.name,
          description: args.description || '',
          priority: args.priority ? parseInt(args.priority) : 3
        };
        
        const newTask = await makeClickUpRequest(`/list/${args.list_id}/task`, 'POST', taskData);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Task created successfully!\n\n📋 **${newTask.name}**\n🆔 ID: ${newTask.id}\n🔗 URL: ${newTask.url}\n📊 Status: ${newTask.status.status}`
            }
          ]
        };

      case 'list_tasks':
        const tasksData = await makeClickUpRequest(`/list/${args.list_id}/task`);
        return {
          content: [
            {
              type: 'text',
              text: `📋 Tasks in list:\n\n${tasksData.tasks.slice(0, 10).map(task => 
                `• ${task.name}\n  🆔 ${task.id} | 📊 ${task.status.status} | 👤 ${task.assignees.length > 0 ? task.assignees[0].username : 'Unassigned'}`
              ).join('\n\n')}`
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  if (LOG_LEVEL === 'info') {
    console.error('🚀 ClickUp MCP Server started successfully');
    console.error(`📋 Team ID: ${CLICKUP_TEAM_ID}`);
    console.error('🔗 Tools available: list_spaces, create_task, list_tasks');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });
} 