# 📝 Amazon Developer Product Feedback
**Project:** Ring Concierge AI  
**Submitted for:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Developer:** Nitish Kudave  

---

## 1. Onboarding Experience ("Zero to Hello World")
* **What Went Well:** Getting started with the Alexa+ Agent Skill documentation and testing MCP (Model Context Protocol) tool signatures was intuitive. The ability to expose JSON schemas directly to the agent model made structured tool calling straightforward.
* **Speed to Prototype:** The unified availability of Bedrock foundation models (especially Claude 3.5 Sonnet) gave exceptional reasoning fidelity out of the box.

---

## 2. Friction Points & Developer Pain Points
1. **Multi-Device Local Testing:**
   * Developing an experience that spans **Ring**, **Alexa+**, and **Fire TV** simultaneously is challenging because each service historically has separate sandbox environments.
   * *Pain point:* We had to build our own web-based multi-device event emulator to visualize how an event from Ring triggers an Alexa whisper while popping up a Fire TV PIP tile.
2. **Real-time Webhook Latency:**
   * A visitor at the front door expects an answer within 1 second. When chaining webhook delivery -> LLM inference -> speech synthesis, round-trip times can creep over 1.5 seconds.
   * *Suggestion:* Provide edge-optimized Bedrock inference profiles for smart-home conversational skills.

---

## 3. Top Feature Requests for Amazon Engineering
1. **Unified Amazon Device CLI Playground:** A single CLI command (e.g. `amazon-dev sandbox start --devices ring,alexa,firetv`) that spins up mock WebSocket event streams.
2. **Native WebRTC Audio Bridge:** A managed WebRTC API connecting Alexa+ agent voice synthesis directly to outdoor Ring two-way speaker hardware with zero custom streaming servers.
