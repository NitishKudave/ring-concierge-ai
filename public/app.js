/**
 * Ring Concierge AI - Interactive Simulator Frontend
 * Built for Amazon Developer Hackathon 2026
 * Cross-Device Integration: Ring + Alexa+ + AWS Bedrock + Fire TV
 */

// Sound state
let soundEnabled = true;
let audioCtx = null;

// Simulated Personas
const PERSONAS = {
  delivery: {
    emoji: '📦',
    role: 'Delivery Courier (Amazon)',
    bgStyle: 'radial-gradient(circle at 50% 50%, #172554 0%, #080c14 100%)',
    intent: 'PACKAGE_DELIVERY',
    confidence: '99.2%',
    visitorPhrase: '"Package delivery for Nitish Kudave."',
    doorbellResponse: 'Hello! Please leave the package securely behind the side porch pillar. Have a wonderful day!',
    alexaWhisper: 'An Amazon delivery courier just dropped off a parcel at the side porch.',
    pipTitle: 'Amazon Delivery at Door',
    pipSummary: 'Package placed safely behind porch pillar.',
    decision: 'SAFE_DROP_AUTHORIZED'
  },
  neighbor: {
    emoji: '👤',
    role: 'Neighbor (Sarah)',
    bgStyle: 'radial-gradient(circle at 50% 50%, #064e3b 0%, #080c14 100%)',
    intent: 'KNOWN_CONTACT_VISIT',
    confidence: '96.5%',
    visitorPhrase: '"Hey Nitish! Just bringing back your garden trimmer."',
    doorbellResponse: 'Hi Sarah! Nitish is currently occupied, but I have alerted him on Alexa that you dropped off the trimmer. Thank you!',
    alexaWhisper: 'Your neighbor Sarah stopped by to return your garden trimmer.',
    pipTitle: 'Neighbor Sarah at Door',
    pipSummary: 'Returned garden trimmer. Left on bench.',
    decision: 'NOTIFY_HOMEOWNER_DISCREET'
  },
  solicitor: {
    emoji: '💼',
    role: 'Door-to-Door Sales',
    bgStyle: 'radial-gradient(circle at 50% 50%, #78350f 0%, #080c14 100%)',
    intent: 'UNSOLICITED_SOLICITATION',
    confidence: '94.8%',
    visitorPhrase: '"Hi, quick question about your monthly electric and solar bill..."',
    doorbellResponse: 'Thank you for stopping by. The residents are not taking unsolicited inquiries today. Have a pleasant day!',
    alexaWhisper: 'Politely screened out an unsolicited solar salesperson at the front gate.',
    pipTitle: 'Sales Inquiry Screened',
    pipSummary: 'Deflected solar solicitor without doorbell ring.',
    decision: 'POLITE_DEFLECTION_LOGGED'
  },
  suspicious: {
    emoji: '🌙',
    role: 'Suspicious Loitering',
    bgStyle: 'radial-gradient(circle at 50% 50%, #881337 0%, #080c14 100%)',
    intent: 'SECURITY_ALERT_LOITERING',
    confidence: '98.1%',
    visitorPhrase: '[Unknown individual loitering near entryway without ringing]',
    doorbellResponse: 'Security Notice: This property is actively monitored by Ring AI Concierge. Video and audio are being recorded.',
    alexaWhisper: '⚠️ Security Alert: Unfamiliar motion detected lingering near front porch. Floodlights engaged.',
    pipTitle: '🚨 Front Door Alert: Loitering',
    pipSummary: 'Unidentified motion detected for >30s.',
    decision: 'ESCALATE_SECURITY_EVENT'
  }
};

let currentPersonaKey = 'delivery';
let lastEventRecord = null;

// Seed initial DynamoDB events
const initialEvents = [
  { time: '18:42:10', visitor: 'Delivery Courier', intent: 'PACKAGE_DELIVERY', action: 'SAFE_DROP_AUTHORIZED', tagClass: 'tag-delivery' },
  { time: '17:15:02', visitor: 'Neighbor (Sarah)', intent: 'KNOWN_CONTACT', action: 'NOTIFIED_ALEXA', tagClass: 'tag-neighbor' },
  { time: '15:20:44', visitor: 'Sales Solicitor', intent: 'SOLICITATION', action: 'POLITELY_DEFLECTED', tagClass: 'tag-solicitor' },
  { time: '02:11:18', visitor: 'Late-Night Motion', intent: 'SECURITY_ALERT', action: 'FLOODLIGHT_ENGAGED', tagClass: 'tag-suspicious' }
];

// Web Audio API Synthesizer
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

// Play synthesized doorbell chime (Ding-Dong)
function playDoorbellChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note 1: Ding (E5 - 659.25Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(659.25, now);
  gain1.gain.setValueAtTime(0.4, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.9);

  // Note 2: Dong (C5 - 523.25Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(523.25, now + 0.35);
  gain2.gain.setValueAtTime(0.4, now + 0.35);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.35);
  osc2.stop(now + 1.4);
}

// Play Alexa wake chime
function playAlexaChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(783.99, now); // G5
  osc.frequency.setValueAtTime(1046.50, now + 0.12); // C6
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

// Browser Speech Synthesis
function speakText(text, pitch = 1.0, rate = 1.05, onEndCallback = null) {
  if (!soundEnabled || !('speechSynthesis' in window)) {
    if (onEndCallback) setTimeout(onEndCallback, 1500);
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.onend = () => {
    if (onEndCallback) onEndCallback();
  };
  utterance.onerror = () => {
    if (onEndCallback) onEndCallback();
  };
  window.speechSynthesis.speak(utterance);
}

// DOM Elements
const timecodeEl = document.getElementById('timecode');
const sceneContainerEl = document.getElementById('sceneContainer');
const avatarEmojiEl = document.getElementById('avatarEmoji');
const avatarRoleEl = document.getElementById('avatarRole');
const streamStatusTextEl = document.getElementById('streamStatusText');
const doorbellSpeechOutputEl = document.getElementById('doorbellSpeechOutput');
const soundWaveEl = document.getElementById('soundWave');

// Agent Pipeline
const stepDetectEl = document.getElementById('stepDetect');
const stepReasonEl = document.getElementById('stepReason');
const stepMcpEl = document.getElementById('stepMcp');
const stepDeliverEl = document.getElementById('stepDeliver');
const decisionValueEl = document.getElementById('decisionValue');
const agentLatencyEl = document.getElementById('agentLatency');

// Alexa
const alexaLightRingEl = document.getElementById('alexaLightRing');
const alexaStatusTextEl = document.getElementById('alexaStatusText');
const alexaWhisperTextEl = document.getElementById('alexaWhisperText');
const alexaQueryInputEl = document.getElementById('alexaQueryInput');
const askAlexaBtn = document.getElementById('askAlexaBtn');
const alexaReplyTextEl = document.getElementById('alexaReplyText');

// Fire TV PIP
const tvPipOverlayEl = document.getElementById('tvPipOverlay');
const pipThumbEl = document.getElementById('pipThumb');
const pipTitleEl = document.getElementById('pipTitle');
const pipSummaryEl = document.getElementById('pipSummary');
const pipCloseBtn = document.getElementById('pipCloseBtn');

// DynamoDB Table
const eventTableBodyEl = document.getElementById('eventTableBody');
const eventCountEl = document.getElementById('eventCount');

// Modal Elements
const feedbackModalEl = document.getElementById('feedbackModal');
const feedbackModalBtn = document.getElementById('feedbackModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeModalBottomBtn = document.getElementById('closeModalBottomBtn');
const copyFeedbackBtn = document.getElementById('copyFeedbackBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIconEl = document.getElementById('soundIcon');

// Clock
function updateClock() {
  const d = new Date();
  timecodeEl.innerText = d.toTimeString().split(' ')[0];
}
setInterval(updateClock, 1000);
updateClock();

// Initialize Persona Buttons
document.querySelectorAll('.btn-persona').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-persona').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPersonaKey = btn.getAttribute('data-persona');
    applyPersona(currentPersonaKey);
  });
});

function applyPersona(key) {
  const p = PERSONAS[key];
  avatarEmojiEl.innerText = p.emoji;
  avatarRoleEl.innerText = p.role;
  sceneContainerEl.style.background = p.bgStyle;
  streamStatusTextEl.innerText = `Simulated: ${p.role} detected on porch.`;
}

// Apply initial persona
applyPersona('delivery');

// Populate DynamoDB initial table
function renderTableEvents() {
  eventTableBodyEl.innerHTML = '';
  initialEvents.forEach(evt => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="time-col">${evt.time}</td>
      <td><strong>${evt.visitor}</strong></td>
      <td><span class="tag-pill ${evt.tagClass}">${evt.intent}</span></td>
      <td><code>${evt.action}</code></td>
    `;
    eventTableBodyEl.appendChild(row);
  });
  eventCountEl.innerText = `${initialEvents.length} Events`;
}
renderTableEvents();

// Sound Toggle
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundToggleBtn.innerHTML = '<span>🔊</span> Audio: ON';
    soundToggleBtn.classList.remove('btn-outline');
    soundToggleBtn.classList.add('btn-secondary');
  } else {
    soundToggleBtn.innerHTML = '<span>🔇</span> Audio: OFF';
    soundToggleBtn.classList.remove('btn-secondary');
    soundToggleBtn.classList.add('btn-outline');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
});

// Trigger Concierge Automation Flow
let isProcessing = false;

function triggerConciergeFlow(isDoorbellPress = true) {
  if (isProcessing) return;
  isProcessing = true;

  const persona = PERSONAS[currentPersonaKey];
  const nowTime = new Date().toTimeString().split(' ')[0];

  // 1. Play doorbell chime if button pressed
  if (isDoorbellPress) {
    playDoorbellChime();
    streamStatusTextEl.innerText = 'Doorbell Rang! Ingesting camera audio & vision stream...';
  } else {
    streamStatusTextEl.innerText = 'PIR Motion Triggered! Ingesting stream...';
  }

  // Animate Pipeline Step 1: Ingestion
  stepDetectEl.classList.add('active');
  stepReasonEl.classList.remove('active');
  stepMcpEl.classList.remove('active');
  stepDeliverEl.classList.remove('active');
  decisionValueEl.innerText = 'INGESTING_FRAME';
  agentLatencyEl.innerText = 'Latency: ~45ms';

  setTimeout(() => {
    // Step 2: Bedrock Reasoning
    stepDetectEl.classList.remove('active');
    stepReasonEl.classList.add('active');
    decisionValueEl.innerText = `ANALYZING_${persona.intent}`;
    agentLatencyEl.innerText = 'Latency: ~180ms';

    setTimeout(() => {
      // Step 3: MCP Tool Dispatch
      stepReasonEl.classList.remove('active');
      stepMcpEl.classList.add('active');
      decisionValueEl.innerText = persona.decision;
      agentLatencyEl.innerText = 'Latency: ~210ms (Done)';

      // Ring Outdoor Speaker Output
      doorbellSpeechOutputEl.innerHTML = `<strong>Ring Concierge:</strong> "${persona.doorbellResponse}"`;
      soundWaveEl.classList.add('active');

      // Speak at door
      speakText(persona.doorbellResponse, 1.05, 1.0, () => {
        soundWaveEl.classList.remove('active');

        // Step 4: Cross-Device Ambient Delivery
        stepMcpEl.classList.remove('active');
        stepDeliverEl.classList.add('active');

        // Alexa Wake Chime & Glow
        setTimeout(() => {
          playAlexaChime();
          alexaLightRingEl.classList.add('speaking');
          alexaStatusTextEl.innerText = 'Speaking ambient whisper...';
          alexaWhisperTextEl.innerHTML = `<strong>Whisper:</strong> "${persona.alexaWhisper}"`;

          speakText(persona.alexaWhisper, 1.2, 1.1, () => {
            alexaLightRingEl.classList.remove('speaking');
            alexaStatusTextEl.innerText = 'Listening contextually...';
            stepDeliverEl.classList.remove('active');
            isProcessing = false;
          });
        }, 500);

        // Fire TV Picture-in-Picture Trigger
        pipThumbEl.innerText = persona.emoji;
        pipTitleEl.innerText = persona.pipTitle;
        pipSummaryEl.innerText = persona.pipSummary;
        tvPipOverlayEl.classList.remove('hidden');

        // Auto-hide PIP after 8s
        setTimeout(() => {
          tvPipOverlayEl.classList.add('hidden');
        }, 8000);

        // Log to DynamoDB Ledger
        const tagMap = {
          delivery: 'tag-delivery',
          neighbor: 'tag-neighbor',
          solicitor: 'tag-solicitor',
          suspicious: 'tag-suspicious'
        };
        initialEvents.unshift({
          time: nowTime,
          visitor: persona.role,
          intent: persona.intent,
          action: persona.decision,
          tagClass: tagMap[currentPersonaKey] || 'tag-delivery'
        });
        lastEventRecord = persona;
        renderTableEvents();
      });
    }, 600);
  }, 500);
}

// Action Button Listeners
document.getElementById('pressDoorbellBtn').addEventListener('click', () => {
  triggerConciergeFlow(true);
});

document.getElementById('triggerMotionBtn').addEventListener('click', () => {
  triggerConciergeFlow(false);
});

document.getElementById('speakCustomBtn').addEventListener('click', () => {
  const custom = prompt('Enter custom simulated visitor speech:', 'I am here for the plumbing inspection.');
  if (custom) {
    PERSONAS[currentPersonaKey].visitorPhrase = `"${custom}"`;
    PERSONAS[currentPersonaKey].doorbellResponse = `Thank you. I have notified Nitish that you are here for: "${custom}". Please wait a moment.`;
    PERSONAS[currentPersonaKey].alexaWhisper = `A visitor arrived stating: "${custom}".`;
    PERSONAS[currentPersonaKey].pipTitle = 'Custom Visitor at Door';
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
  alexaStatusTextEl.innerText = 'Querying memory store...';

  const p = lastEventRecord || PERSONAS[currentPersonaKey];
  const reply = `At ${new Date().toLocaleTimeString()}, ${p.role} was at the front door. Decision taken: ${p.decision}.`;
  alexaReplyTextEl.innerText = reply;

  speakText(reply, 1.2, 1.1, () => {
    alexaLightRingEl.classList.remove('speaking');
    alexaStatusTextEl.innerText = 'Listening contextually...';
  });
});

// PIP Close Button
pipCloseBtn.addEventListener('click', () => {
  tvPipOverlayEl.classList.add('hidden');
});

// Modal Events
feedbackModalBtn.addEventListener('click', () => {
  feedbackModalEl.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => {
  feedbackModalEl.classList.add('hidden');
});
closeModalBottomBtn.addEventListener('click', () => {
  feedbackModalEl.classList.add('hidden');
});

copyFeedbackBtn.addEventListener('click', () => {
  const text = `Amazon Developer Product Feedback - Ring Concierge AI
1. Onboarding & SDK Usability: Alexa+ Agent Skill documentation and Model Context Protocol (MCP) tool integrations are very strong.
2. Friction Points: Testing simultaneous multi-device pipelines (Ring -> Bedrock -> Alexa+ -> Fire TV) locally required writing custom event mockers. An official "Amazon Unified Device Playground CLI" would accelerate development drastically.
3. Feature Requests: Pre-built MCP connectors for Ring and Fire OS in Amazon Developer Console, and direct WebRTC channels between Alexa+ and outdoor Ring speakers.`;
  navigator.clipboard.writeText(text).then(() => {
    copyFeedbackBtn.innerText = '✅ Copied to Clipboard!';
    setTimeout(() => {
      copyFeedbackBtn.innerText = 'Copy Feedback for Submission';
    }, 2500);
  });
});
