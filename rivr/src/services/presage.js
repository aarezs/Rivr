// Vital sign status helpers
// Used by Assessment, VitalsDisplay, and report components

export function getVitalStatus(type, value) {
  if (value === null || value === undefined) return 'unknown';

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
