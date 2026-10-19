# 🔔 Ring Concierge AI
### Autonomous Smart Home Ambient Gatekeeper Connecting Ring, Alexa+, and AWS Bedrock
**Built for the [Amazon Developer Hackathon 2026: Build, Ship, Shape](https://devpost.com)**

[![Amazon Hackathon 2026](https://img.shields.io/badge/Amazon%20Developer%20Hackathon-2026-orange?style=for-the-badge&logo=amazon)](https://devpost.com)
[![Alexa+ Agent Skill](https://img.shields.io/badge/Alexa%2B-Agent%20Skill%20%26%20MCP-00d2ff?style=for-the-badge&logo=amazon-alexa)](https://developer.amazon.com)
[![Ring Ecosystem](https://img.shields.io/badge/Ring-Connected%20Device-3b82f6?style=for-the-badge)](https://ring.com)
[![AWS Bedrock](https://img.shields.io/badge/AWS%20Bedrock-Claude%203.5%20Sonnet-purple?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/bedrock)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Overview
Traditional smart doorbells are noisy and passive: they ping your phone with endless motion alerts, leaving you constantly distracted. When a courier arrives or a neighbor stops by, you still have to stop what you're doing, open an app, wait for the video stream to load, and speak through a laggy two-way audio feed.

**Ring Concierge AI** transforms your front door into an autonomous, polite, and ambient gatekeeper:
* **Greets visitors autonomously** with natural spoken voice at the outdoor speaker.
* **Directs couriers** on where to safely place deliveries (e.g., *"Please place the parcel behind the side porch pillar"*).
* **Screens solicitors** and unwanted sales visits politely without interrupting the homeowner.
* **Delivers contextual ambient whispers** on inside **Alexa+** Echo devices instead of noisy chimes.
* **Pops up Picture-in-Picture alerts on Fire TV** during active movie watching.

---

## 🏗️ System Architecture

```
                      ┌─────────────────────────────────┐
                      │    Ring Video Doorbell Pro      │
                      │ (PIR Motion / Doorbell / Audio) │
                      └───────────────┬─────────────────┘
                                      │ Webhook / Audio Stream
                                      ▼
                      ┌─────────────────────────────────┐
                      │     AWS API Gateway & Lambda    │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │   Amazon Bedrock Agent Core     │
                      │    (Claude 3.5 Sonnet Model)    │
                      └───────┬───────────────┬─────────┘
                              │               │
            ┌─────────────────┘               └─────────────────┐
            │ Two-Way Audio Direct Response                     │ MCP Tool Dispatch
            ▼                                                   ▼
┌───────────────────────────┐                       ┌───────────────────────────┐
│ Ring Outdoor Speaker Feed │                       │      Alexa+ Agent Skill   │
│ "Leave package on porch"  │                       │  (Model Context Protocol) │
└───────────────────────────┘                       └─────────────┬─────────────┘
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼                                           ▼
                                ┌───────────────────────┐                   ┌───────────────────────┐
                                │   Alexa+ Echo Ambient │                   │  Fire TV Picture-in-  │
                                │   Audio Whisper       │                   │  Picture (PIP) Tile   │
                                └───────────────────────┘                   └───────────────────────┘
```

---

## ✨ Key Features
1. **Low-Latency Two-Way Outdoor Dialogue:** Evaluates visitor speech in sub-250ms and responds naturally through the outdoor speaker.
2. **Alexa+ Model Context Protocol (MCP):** Connects door events with an in-home conversational agent. You can ask: *"Alexa, who was at the door?"* and receive a complete contextual briefing.
3. **Smart Ambient Whisper:** In-home Echo devices play a subtle, low-volume chime and whisper instead of startling loud doorbells.
4. **Fire TV Ambient Experience:** An unintrusive picture-in-picture card slides into view on your living room television and auto-dismisses after 8 seconds.
5. **Amazon DynamoDB Event Ledger:** Stores categorized visitor timestamps, confidence scores, and action transcripts.

---

## 🚀 Quickstart & Interactive Simulator

### 1. Clone & Run Locally
```bash
git clone https://github.com/NitishKudave/ring-concierge-ai.git
cd ring-concierge-ai

# Install dependencies
npm install

# Start the interactive simulator server
npm start
```
Open **`http://localhost:3000`** in your browser.

### 2. Live Simulator Features
* **Click any of the 4 Visitor Personas:**
  * 📦 **Delivery Courier:** Safe drop instructions triggered.
  * 👤 **Friendly Neighbor:** Discreet Alexa notification logged.
  * 💼 **Door-to-Door Sales:** Polite deflection without disturbance.
  * 🌙 **Late-Night Suspicious:** Security warning and floodlight escalation.
* **Press "🛎️ Press Doorbell" or "🏃 Trigger Motion":** Watch the 4-step Bedrock pipeline execute in real-time with live synthesized audio.
* **Ask Alexa:** Type or click *"Alexa, who was at the door?"* to test the MCP memory query.

---

## 📂 Repository Structure
```
ring-concierge-ai/
├── public/                 # Interactive Simulator Dashboard
│   ├── index.html          # Web dashboard (Ring + Alexa+ + Fire TV UI)
│   ├── style.css           # Glassmorphism dark mode styles & animations
│   └── app.js              # Synthesized audio, Web Speech API & logic
├── server/                 # Backend & Agent Core
│   ├── index.js            # Express API Gateway
│   ├── bedrockAgent.js     # Amazon Bedrock reasoning loop
│   ├── alexaMcpServer.js   # Model Context Protocol (MCP) server
│   └── ringWebhook.js      # Ring event dispatcher
├── lambda/
│   └── handler.py          # AWS Lambda Python serverless handler
├── docs/
│   ├── ARCHITECTURE.md     # Deep dive architectural diagrams
│   └── AMAZON_FEEDBACK.md  # Official Developer Product Feedback
├── package.json
└── README.md
```

---

## 📝 Official Amazon Developer Product Feedback
*(Included in accordance with the hackathon submission guidelines)*
* **What Worked Well:** The Alexa+ Agent Skill documentation and Model Context Protocol (MCP) integrations provide a clean, standardized schema for agentic tool calling.
* **Friction Points:** Testing multi-device flows (Ring -> Bedrock -> Alexa+ -> Fire TV) locally required building custom event mockers. A unified Amazon Device Playground CLI would significantly streamline future developer workflows.
* **Feature Request:** Native WebRTC audio streaming connectors directly between Alexa+ agent skills and outdoor Ring two-way speakers.

---

## ⚖️ Judging Criteria Alignment
* **Technical Implementation:** Full multi-tier architecture featuring AWS Bedrock reasoning, Alexa+ MCP server endpoints, Ring webhook handlers, and AWS Lambda serverless compatibility.
* **Design & UX:** High-polish dark mode interface with real-time sound wave visualizations, glowing Alexa ring feedback, and Fire TV PIP animations.
* **Potential Impact:** Solves the #1 consumer complaint about smart doorbells (noisy notifications and manual interaction) through ambient automation.
* **Quality of Idea:** Pushes past obvious camera feeds into an autonomous ambient gatekeeper bridging three core Amazon device platforms.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
