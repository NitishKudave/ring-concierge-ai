/**
 * Ring Concierge AI - Professional Surveillance & Ambient Core Script
 * Amazon Developer Hackathon 2026: Build, Ship, Shape
 */

// Sound state & Web Audio Context
let soundEnabled = true;
let audioCtx = null;
let isVisualizerActive = false;

// Personas & Scenarios Data
const PERSONAS = {
  delivery: {
    title: 'Amazon Logistics Courier',
    intent: 'PACKAGE_DELIVERY',
    confidence: '99.4% CONF',
    objectLabel: 'OBJECT: HUMAN COURIER',
    boxStyle: { top: '24%', left: '35%', width: '180px', height: '220px' },
    visitorPhrase: '"Amazon delivery for Nitish Kudave."',
    doorbellResponse: 'Hello! Please place the package securely behind the side porch pillar. Have a wonderful day!',
    alexaWhisper: 'An Amazon delivery courier just dropped off a parcel at the side porch.',
    pipTitle: 'Amazon Logistics at Porch',
    pipSummary: 'Package placed safely behind side pillar.',
    actionCode: 'AUTH_SAFE_DROP',
    decisionText: 'Directing courier to secure drop-off zone. Emitting ambient whisper to living room Echo.',
    eventCode: 'EVT-DLV-8821'
  },
  neighbor: {
    title: 'Verified Contact (Sarah)',
    intent: 'KNOWN_CONTACT_VISIT',
    confidence: '98.2% CONF',
    objectLabel: 'OBJECT: VERIFIED CONTACT',
    boxStyle: { top: '26%', left: '30%', width: '160px', height: '210px' },
    visitorPhrase: '"Hey Nitish! Returning your garden trimmer on the bench."',
    doorbellResponse: 'Hi Sarah! Nitish is occupied inside right now, but I have notified his Alexa+ hub that you dropped off the trimmer. Thank you!',
    alexaWhisper: 'Your neighbor Sarah stopped by to return your garden trimmer.',
    pipTitle: 'Neighbor Sarah at Porch',
    pipSummary: 'Returned garden trimmer. Left on bench.',
    actionCode: 'NOTIFY_DISCREET',
    decisionText: 'Recognized contact. Logged drop-off note. Sent ambient chime to homeowner.',
    eventCode: 'EVT-NBR-4109'
  },
  solicitor: {
    title: 'Sales Solicitor',
    intent: 'UNSOLICITED_SOLICITATION',
    confidence: '94.7% CONF',
    objectLabel: 'OBJECT: PEDESTRIAN (SALES)',
    boxStyle: { top: '30%', left: '42%', width: '150px', height: '200px' },
    visitorPhrase: '"Hi, here to discuss solar energy incentives for your roof."',
    doorbellResponse: 'Thank you for stopping by. The residents are not taking unsolicited inquiries today. Have a pleasant day!',
    alexaWhisper: 'Politely screened out an unsolicited solar salesperson at the front gate.',
    pipTitle: 'Solicitor Screened',
    pipSummary: 'Deflected solar salesperson without disturbing inside.',
    actionCode: 'POLITE_DEFLECT',
    decisionText: 'Unsolicited sales inquiry identified. Screened autonomously without ringing indoor bell.',
    eventCode: 'EVT-SOL-3012'
  },
  suspicious: {
    title: 'Suspicious Loitering',
    intent: 'SECURITY_ALERT_LOITERING',
    confidence: '98.9% CONF',
    objectLabel: 'ANOMALY: UNIDENTIFIED MOTION',
    boxStyle: { top: '32%', left: '20%', width: '190px', height: '210px' },
    visitorPhrase: '[Unknown motion detected lingering near doorway for >30s]',
    doorbellResponse: 'Security Notice: This property is actively monitored by Ring AI Concierge. Video and audio are recorded.',
    alexaWhisper: '⚠️ Security Alert: Unfamiliar motion detected lingering near front porch. Floodlights engaged.',
    pipTitle: 'Front Door Alert: Loitering',
    pipSummary: 'Unidentified motion detected for >30s.',
    actionCode: 'ENGAGE_SECURITY',
    decisionText: 'Late-night loitering anomaly detected. Engaged outdoor deterrence announcement & security floodlights.',
    eventCode: 'EVT-SEC-9904'
  }
};

let currentPersonaKey = 'delivery';
let lastEventRecord = null;
let isProcessing = false;

// Seed initial DynamoDB events
const initialEvents = [
  { time: '18:42:10', visitor: 'Delivery Courier', intent: 'PACKAGE_DELIVERY', action: 'AUTH_SAFE_DROP', tagClass: 'tag-delivery' },
  { time: '17:15:02', visitor: 'Neighbor (Sarah)', intent: 'KNOWN_CONTACT', action: 'NOTIFY_DISCREET', tagClass: 'tag-neighbor' },
  { time: '15:20:44', visitor: 'Sales Solicitor', intent: 'SOLICITATION', action: 'POLITE_DEFLECT', tagClass: 'tag-solicitor' },
  { time: '02:11:18', visitor: 'Late-Night Motion', intent: 'SECURITY_ALERT', action: 'ENGAGE_SECURITY', tagClass: 'tag-suspicious' }
];

// Audio Context Singleton
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Chime synthesizers
function playDoorbellChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Tone 1: E5
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.9);

  // Tone 2: C5
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(523.25, now + 0.3);
  gain2.gain.setValueAtTime(0.35, now + 0.3);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.3);
  osc2.stop(now + 1.3);
}

function playAlexaChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(783.99, now);
  osc.frequency.setValueAtTime(1046.50, now + 0.12);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);
}

// Speech Synthesis
function speakText(text, pitch = 1.0, rate = 1.05, onEndCallback = null) {
  if (!soundEnabled || !('speechSynthesis' in window)) {
    if (onEndCallback) setTimeout(onEndCallback, 1500);
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.onend = () => { if (onEndCallback) onEndCallback(); };
  utterance.onerror = () => { if (onEndCallback) onEndCallback(); };
  window.speechSynthesis.speak(utterance);
}

// Canvas Audio Spectrum Visualizer
const visualizerCanvas = document.getElementById('audioVisualizerCanvas');
const vCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
let animFrameId = null;

function renderVisualizer() {
  if (!vCtx) return;
  vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  const numBars = 16;
  const barWidth = visualizerCanvas.width / numBars - 2;

  for (let i = 0; i < numBars; i++) {
    let barHeight = 2;
    if (isVisualizerActive) {
      barHeight = Math.random() * (visualizerCanvas.height - 4) + 4;
    }
    const x = i * (barWidth + 2);
    const y = visualizerCanvas.height - barHeight;

    const grad = vCtx.createLinearGradient(0, y, 0, visualizerCanvas.height);
    grad.addColorStop(0, '#00d2ff');
    grad.addColorStop(1, '#3b82f6');

    vCtx.fillStyle = grad;
    vCtx.fillRect(x, y, barWidth, barHeight);
  }

  animFrameId = requestAnimationFrame(renderVisualizer);
}
renderVisualizer();

// DOM Element References
const hudTimestampEl = document.getElementById('hudTimestamp');
const cameraViewportEl = document.getElementById('cameraViewport');
const aiBoundingBoxEl = document.getElementById('aiBoundingBox');
const targetTypeTagEl = document.getElementById('targetTypeTag');
const targetConfTagEl = document.getElementById('targetConfTag');
const streamTelemetryEl = document.getElementById('streamTelemetry');
const doorbellSpeechOutputEl = document.getElementById('doorbellSpeechOutput');

// Pipeline elements
const stepDetectEl = document.getElementById('stepDetect');
const stepReasonEl = document.getElementById('stepReason');
const stepMcpEl = document.getElementById('stepMcp');
const stepDeliverEl = document.getElementById('stepDeliver');
const terminalEventCodeEl = document.getElementById('terminalEventCode');
const decisionStatusTextEl = document.getElementById('decisionStatusText');
const decisionActionTextEl = document.getElementById('decisionActionText');
const agentLatencyEl = document.getElementById('agentLatency');

// Alexa elements
const alexaLightRingEl = document.getElementById('alexaLightRing');
const alexaStatusTextEl = document.getElementById('alexaStatusText');
const alexaWhisperTextEl = document.getElementById('alexaWhisperText');
const alexaQueryInputEl = document.getElementById('alexaQueryInput');
const askAlexaBtn = document.getElementById('askAlexaBtn');
const alexaReplyTextEl = document.getElementById('alexaReplyText');

// Fire TV elements
const tvPipOverlayEl = document.getElementById('tvPipOverlay');
const pipTitleEl = document.getElementById('pipTitle');
const pipSummaryEl = document.getElementById('pipSummary');
const pipCloseBtn = document.getElementById('pipCloseBtn');

// DynamoDB Table
const eventTableBodyEl = document.getElementById('eventTableBody');
const eventCountEl = document.getElementById('eventCount');

// Mode Switch (Day / Night IR)
const modeDayBtn = document.getElementById('modeDayBtn');
const modeNightBtn = document.getElementById('modeNightBtn');
const securityStatusPill = document.getElementById('securityStatusPill');

modeDayBtn.addEventListener('click', () => {
  modeDayBtn.classList.add('active');
  modeNightBtn.classList.remove('active');
  cameraViewportEl.classList.remove('night-mode');
  securityStatusPill.innerText = 'PERIMETER ARMED';
  securityStatusPill.style.color = '#10b981';
  streamTelemetryEl.innerText = '140° Ultra-Wide Fisheye • Audio Duplex';
});

modeNightBtn.addEventListener('click', () => {
  modeNightBtn.classList.add('active');
  modeDayBtn.classList.remove('active');
  cameraViewportEl.classList.add('night-mode');
  securityStatusPill.innerText = 'IR NIGHT ACTIVE';
  securityStatusPill.style.color = '#00d2ff';
  streamTelemetryEl.innerText = 'Infrared 850nm Matrix • High Contrast IR';
});

// Update Digital Timecode
function updateClock() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.toTimeString().split(' ')[0];
  hudTimestampEl.innerText = `${year}-${month}-${day} ${time} EDT`;
}
setInterval(updateClock, 1000);
updateClock();

// Persona Selection
document.querySelectorAll('.persona-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    document.querySelectorAll('.persona-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
    currentPersonaKey = tile.getAttribute('data-persona');
    applyPersona(currentPersonaKey);
  });
});

function applyPersona(key) {
  const p = PERSONAS[key];
  targetTypeTagEl.innerText = p.objectLabel;
  targetConfTagEl.innerText = p.confidence;
  
  // Reposition bounding box smoothly
  aiBoundingBoxEl.style.top = p.boxStyle.top;
  aiBoundingBoxEl.style.left = p.boxStyle.left;
  aiBoundingBoxEl.style.width = p.boxStyle.width;
  aiBoundingBoxEl.style.height = p.boxStyle.height;

  // Auto toggle night mode for late-night scenario
  if (key === 'suspicious') {
    modeNightBtn.click();
  } else if (!cameraViewportEl.classList.contains('manual-night')) {
    modeDayBtn.click();
  }
}
applyPersona('delivery');

// Populate DynamoDB initial table
function renderTableEvents() {
  eventTableBodyEl.innerHTML = '';
  initialEvents.forEach(evt => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="time-col">${evt.time}</td>
      <td><strong>${evt.visitor}</strong></td>
      <td><span class="tag-pill ${evt.tagClass}">${evt.action}</span></td>
    `;
    eventTableBodyEl.appendChild(row);
  });
  eventCountEl.innerText = `${initialEvents.length} Records`;
}
renderTableEvents();

// Sound Toggle
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundLabelEl = document.getElementById('soundLabel');

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundLabelEl.innerText = 'Audio: Active';
    soundToggleBtn.classList.remove('btn-glass-subtle');
  } else {
    soundLabelEl.innerText = 'Audio: Muted';
    soundToggleBtn.classList.add('btn-glass-subtle');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
});

// Trigger Concierge Flow
function triggerConciergeFlow(isDoorbellPress = true) {
  if (isProcessing) return;
  isProcessing = true;

  const persona = PERSONAS[currentPersonaKey];
  const nowTime = new Date().toTimeString().split(' ')[0];

  // 1. Play doorbell sound
  if (isDoorbellPress) {
    playDoorbellChime();
  }

  // Step 1: Ingestion
  stepDetectEl.classList.add('active');
  stepReasonEl.classList.remove('active');
  stepMcpEl.classList.remove('active');
  stepDeliverEl.classList.remove('active');
  terminalEventCodeEl.innerText = persona.eventCode;
  decisionStatusTextEl.innerText = 'INGESTING_FRAME';
  decisionActionTextEl.innerText = `Ingesting optical stream & audio: ${persona.visitorPhrase}`;
  agentLatencyEl.innerText = 'Inference: 42ms';

  setTimeout(() => {
    // Step 2: Bedrock Reasoning
    stepDetectEl.classList.remove('active');
    stepReasonEl.classList.add('active');
    decisionStatusTextEl.innerText = `CLASSIFYING_${persona.intent}`;
    decisionActionTextEl.innerText = `Evaluating with Claude 3.5 Sonnet on AWS Bedrock...`;
    agentLatencyEl.innerText = 'Inference: 168ms';

    setTimeout(() => {
      // Step 3: MCP Tools & Two-way Outdoor Response
      stepReasonEl.classList.remove('active');
      stepMcpEl.classList.add('active');
      decisionStatusTextEl.innerText = persona.actionCode;
      decisionActionTextEl.innerText = persona.decisionText;
      agentLatencyEl.innerText = 'Inference: 182ms (Locked)';

      // Outdoor speaker output
      doorbellSpeechOutputEl.innerHTML = `<strong>Ring Intercom:</strong> "${persona.doorbellResponse}"`;
      isVisualizerActive = true;

      // Speak at front door
      speakText(persona.doorbellResponse, 1.02, 1.05, () => {
        isVisualizerActive = false;

        // Step 4: Ambient Cross-Device Sync
        stepMcpEl.classList.remove('active');
        stepDeliverEl.classList.add('active');

        // Alexa Wake Chime & Whisper
        setTimeout(() => {
          playAlexaChime();
          alexaLightRingEl.classList.add('speaking');
          alexaStatusTextEl.innerText = 'Speaking ambient whisper...';
          alexaWhisperTextEl.innerHTML = `<strong>Whisper:</strong> "${persona.alexaWhisper}"`;

          speakText(persona.alexaWhisper, 1.15, 1.1, () => {
            alexaLightRingEl.classList.remove('speaking');
            alexaStatusTextEl.innerText = 'Ambient awareness active';
            stepDeliverEl.classList.remove('active');
            isProcessing = false;
          });
        }, 400);

        // Fire TV Picture-in-Picture
        pipTitleEl.innerText = persona.pipTitle;
        pipSummaryEl.innerText = persona.pipSummary;
        tvPipOverlayEl.classList.remove('hidden');

        // Auto dismiss PIP after 8s
        setTimeout(() => {
          tvPipOverlayEl.classList.add('hidden');
        }, 8000);

        // Append to DynamoDB table
        const tagMap = {
          delivery: 'tag-delivery',
          neighbor: 'tag-neighbor',
          solicitor: 'tag-solicitor',
          suspicious: 'tag-suspicious'
        };
        initialEvents.unshift({
          time: nowTime,
          visitor: persona.title,
          intent: persona.intent,
          action: persona.actionCode,
          tagClass: tagMap[currentPersonaKey] || 'tag-delivery'
        });
        lastEventRecord = persona;
        renderTableEvents();
      });
    }, 550);
  }, 450);
}

// Action Button Listeners
document.getElementById('pressDoorbellBtn').addEventListener('click', () => {
  triggerConciergeFlow(true);
});

document.getElementById('triggerMotionBtn').addEventListener('click', () => {
  triggerConciergeFlow(false);
});

document.getElementById('speakCustomBtn').addEventListener('click', () => {
  const custom = prompt('Enter custom simulated visitor speech:', 'I am here to inspect the water meter.');
  if (custom) {
    PERSONAS[currentPersonaKey].visitorPhrase = `"${custom}"`;
    PERSONAS[currentPersonaKey].doorbellResponse = `Thank you. I have logged your message: "${custom}". Nitish has been notified via his ambient hub.`;
    PERSONAS[currentPersonaKey].alexaWhisper = `A visitor arrived stating: "${custom}".`;
    PERSONAS[currentPersonaKey].pipTitle = 'Visitor at Front Door';
    PERSONAS[currentPersonaKey].pipSummary = custom;
    triggerConciergeFlow(true);
  }
});

// Follow-up Alexa Query
askAlexaBtn.addEventListener('click', () => {
  const q = alexaQueryInputEl.value.trim();
  if (!q) return;

  playAlexaChime();
  alexaLightRingEl.classList.add('speaking');
  alexaStatusTextEl.innerText = 'Querying MCP context memory...';

  const p = lastEventRecord || PERSONAS[currentPersonaKey];
  const reply = `At ${new Date().toLocaleTimeString()}, ${p.title} was at the front porch. Action taken: ${p.actionCode}.`;
  alexaReplyTextEl.innerText = reply;

  speakText(reply, 1.15, 1.1, () => {
    alexaLightRingEl.classList.remove('speaking');
    alexaStatusTextEl.innerText = 'Ambient awareness active';
  });
});

// PIP Close
pipCloseBtn.addEventListener('click', () => {
  tvPipOverlayEl.classList.add('hidden');
});

// Modal Listeners
const feedbackModalEl = document.getElementById('feedbackModal');
const feedbackModalBtn = document.getElementById('feedbackModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeModalBottomBtn = document.getElementById('closeModalBottomBtn');
const copyFeedbackBtn = document.getElementById('copyFeedbackBtn');

feedbackModalBtn.addEventListener('click', () => { feedbackModalEl.classList.remove('hidden'); });
closeModalBtn.addEventListener('click', () => { feedbackModalEl.classList.add('hidden'); });
closeModalBottomBtn.addEventListener('click', () => { feedbackModalEl.classList.add('hidden'); });

copyFeedbackBtn.addEventListener('click', () => {
  const text = `Amazon Developer Product Feedback - Ring Concierge AI
1. Onboarding & SDK Usability: Alexa+ Agent Skill documentation and Model Context Protocol (MCP) integrations provide a clean, standardized schema for agentic tool calling.
2. Friction Points: Testing simultaneous multi-device pipelines (Ring -> Bedrock -> Alexa+ -> Fire TV) locally required writing custom event mockers. An official "Amazon Multi-Device Playground CLI" would accelerate development drastically.
3. Feature Requests: Native WebRTC audio streaming bridge directly between Alexa+ agent skills and outdoor Ring two-way speaker hardware.`;
  navigator.clipboard.writeText(text).then(() => {
    copyFeedbackBtn.innerText = '✅ Copied to Clipboard!';
    setTimeout(() => { copyFeedbackBtn.innerText = 'Copy Feedback for Submission'; }, 2500);
  });
});
