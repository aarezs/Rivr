// Presage SDK integration wrapper
// Phase 3: Replace mock with real Presage WebSDK

export async function initPresage(videoElement, apiKey) {
  // TODO: Initialize Presage WebSDK with video element
  // const presage = new PresageSDK({ apiKey, videoElement });
  // await presage.initialize();
  // return presage;
  console.log('[Presage] SDK initialization - using mock in development');
  return null;
}

export function generateMockVitals() {
  // Generate realistic-looking vital signs for demo
  const heartRate = Math.floor(Math.random() * 40) + 65; // 65-105
  const breathingRate = Math.floor(Math.random() * 10) + 14; // 14-24
  const stressLevel = Math.floor(Math.random() * 50) + 20; // 20-70
  const temperature = Math.round((36.2 + Math.random() * 2.0) * 10) / 10; // 36.2-38.2
  const oxygenLevel = Math.floor(Math.random() * 5) + 95; // 95-99

  return {
    heartRate,
    breathingRate,
    stressLevel,
    temperature,
    oxygenLevel,
    timestamp: new Date().toISOString(),
  };
}

export function getVitalStatus(type, value) {
  const ranges = {
    heartRate: { low: 60, high: 100, unit: 'BPM' },
    breathingRate: { low: 12, high: 20, unit: 'br/min' },
    stressLevel: { low: 0, high: 40, unit: '%' },
  };

  const range = ranges[type];
  if (!range) return 'unknown';

  if (type === 'stressLevel') {
    if (value <= 40) return 'normal';
    if (value <= 60) return 'elevated';
    return 'concerning';
  }

  if (value < range.low) return 'concerning';
  if (value > range.high) return 'elevated';
  return 'normal';
}
