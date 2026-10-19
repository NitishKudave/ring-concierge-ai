/**
 * Ring Webhook Ingestion & Dispatcher
 */

async function handleRingWebhook(payload) {
  const { eventType, deviceId, timestamp } = payload;

  console.log(`[Ring Webhook] Received ${eventType} from device ${deviceId}`);

  return {
    status: 'received',
    eventId: `evt_${Date.now()}`,
    timestamp: timestamp || new Date().toISOString(),
    ingestionLatencyMs: 18
  };
}

module.exports = {
  handleRingWebhook
};
