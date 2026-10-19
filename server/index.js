/**
 * Ring Concierge AI - Backend Server & API Gateway
 * Amazon Developer Hackathon 2026
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { processBedrockReasoning } = require('./bedrockAgent');
const { handleAlexaMcpRequest } = require('./alexaMcpServer');
const { handleRingWebhook } = require('./ringWebhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ring-concierge-ai',
    version: '1.0.0',
    hackathon: 'Amazon Developer Hackathon 2026',
    tracks: ['Alexa+', 'Ring', 'Fire TV', 'AWS Bedrock']
  });
});

// Ring Webhook Ingestion Endpoint
app.post('/api/ring/webhook', async (req, res) => {
  try {
    const event = req.body;
    const result = await handleRingWebhook(event);
    res.status(200).json(result);
  } catch (error) {
    console.error('Ring Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Bedrock AI Reasoning Endpoint
app.post('/api/agent/decide', async (req, res) => {
  try {
    const { visitorProfile, audioTranscript, cameraSnapshot } = req.body;
    const decision = await processBedrockReasoning({
      visitorProfile,
      audioTranscript,
      cameraSnapshot
    });
    res.status(200).json(decision);
  } catch (error) {
    console.error('Bedrock Reasoning Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alexa+ MCP (Model Context Protocol) Server Endpoint
app.post('/api/alexa/mcp', async (req, res) => {
  try {
    const mcpResponse = await handleAlexaMcpRequest(req.body);
    res.status(200).json(mcpResponse);
  } catch (error) {
    console.error('Alexa MCP Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🔔 Ring Concierge AI Server Running on http://localhost:${PORT}`);
  console.log(`🏆 Amazon Developer Hackathon 2026`);
  console.log(`=======================================================`);
});
