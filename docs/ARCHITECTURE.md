# 🏗️ Architecture & Cross-Device Dataflow

**Ring Concierge AI** is built on an event-driven, multi-device architecture connecting:
* **Ring Video Doorbell API / Webhooks**
* **Amazon Bedrock (Claude 3.5 Sonnet Reasoning)**
* **Alexa+ Agent Skills via Model Context Protocol (MCP)**
* **Fire TV Picture-in-Picture Broadcast**
* **Amazon DynamoDB Event Ledger**

---

## 🔁 Complete Event Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant Ring as Ring Doorbell (Camera/Audio)
    participant Bedrock as Amazon Bedrock (Agent)
    participant Alexa as Alexa+ (In-Home Echo)
    participant FireTV as Fire TV (Living Room)
    participant DDB as Amazon DynamoDB

    Visitor->>Ring: Rings Doorbell / Triggers Motion
    Ring->>Bedrock: Ingests Audio Transcript & Sensor Data
    Note over Bedrock: Classifies Intent (Delivery, Friend, Solicitor)
    Bedrock-->>Ring: Synthesizes Outdoor Speaker Guidance ("Drop behind pillar")
    Bedrock->>Alexa: MCP Tool Call: alexa_dispatch_ambient_whisper
    Alexa->>Alexa: Plays Subtle Audio Whisper
    Bedrock->>FireTV: Broadcasts Mini PIP Stream Tile
    Bedrock->>DDB: Persists Visitor Log with Metadata
```

---

## 🛠️ MCP Tool Definitions for Alexa+
The system exposes standard **Model Context Protocol** tools to allow the homeowner to have bidirectional conversations with their home:
* `ring_get_last_visitor`: Allows asking *"Alexa, who was at the door?"*
* `alexa_dispatch_ambient_whisper`: Controls non-intrusive ambient speech across specific rooms.
* `firetv_trigger_picture_in_picture`: Opens or closes the mini-camera view without pausing active media playback.
