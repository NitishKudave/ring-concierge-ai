/**
 * Alexa+ Model Context Protocol (MCP) Server
 * Exposes Smart Doorbell tools to Alexa+ Agent Skills
 */

const TOOLS = [
  {
    name: 'ring_get_last_visitor',
    description: 'Retrieves details about the most recent visitor or motion event at the Ring front door.',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Ring Doorbell device ID' }
      }
    }
  },
  {
    name: 'alexa_dispatch_ambient_whisper',
    description: 'Broadcasts a low-volume ambient audio whisper across connected in-home Echo devices.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Text for ambient whisper' },
        targetRoom: { type: 'string', description: 'e.g. living_room, office' }
      },
      required: ['message']
    }
  },
  {
    name: 'firetv_trigger_picture_in_picture',
    description: 'Displays a live camera PIP tile on the living room Fire TV.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        streamUrl: { type: 'string' }
      },
      required: ['title']
    }
  }
];

async function handleAlexaMcpRequest(request) {
  const { method, params } = request;

  if (method === 'tools/list') {
    return { tools: TOOLS };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    switch (name) {
      case 'ring_get_last_visitor':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                visitor: 'Amazon Delivery Courier',
                actionTaken: 'SAFE_DROP_AUTHORIZED',
                timestamp: new Date().toISOString()
              })
            }
          ]
        };

      case 'alexa_dispatch_ambient_whisper':
        return {
          content: [
            {
              type: 'text',
              text: `Dispatched whisper to ${args.targetRoom || 'all_echo_devices'}: "${args.message}"`
            }
          ]
        };

      case 'firetv_trigger_picture_in_picture':
        return {
          content: [
            {
              type: 'text',
              text: `Fire TV PIP overlay broadcasted: ${args.title}`
            }
          ]
        };

      default:
        throw new Error(`Unknown MCP Tool: ${name}`);
    }
  }

  return { error: 'Invalid MCP Request' };
}

module.exports = {
  TOOLS,
  handleAlexaMcpRequest
};
