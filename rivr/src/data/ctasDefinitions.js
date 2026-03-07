export const ctasLevels = {
  1: {
    level: 1,
    name: 'Resuscitation',
    description: 'Immediate life-threatening condition',
    color: '#E53E3E',
    bgColor: 'rgba(229, 62, 62, 0.15)',
    careLevel: 'er',
    careAction: 'Call 911 or go to nearest ER immediately',
    examples: ['Cardiac arrest', 'Severe respiratory distress', 'Major trauma', 'Unconsciousness'],
    timeToAssess: 'Immediate',
  },
  2: {
    level: 2,
    name: 'Emergent',
    description: 'Potential threat to life, limb, or function',
    color: '#F56565',
    bgColor: 'rgba(245, 101, 101, 0.15)',
    careLevel: 'er',
    careAction: 'Go to the Emergency Room immediately',
    examples: ['Chest pain', 'Severe allergic reaction', 'Stroke symptoms', 'Severe bleeding'],
    timeToAssess: '≤ 15 minutes',
  },
  3: {
    level: 3,
    name: 'Urgent',
    description: 'Serious condition requiring emergency care',
    color: '#ECC94B',
    bgColor: 'rgba(236, 201, 75, 0.15)',
    careLevel: 'er',
    careAction: 'Visit the Emergency Room (compare wait times)',
    examples: ['High fever with symptoms', 'Moderate asthma', 'Abdominal pain', 'Fractures'],
    timeToAssess: '≤ 30 minutes',
  },
  4: {
    level: 4,
    name: 'Less Urgent',
    description: 'Condition that could benefit from medical intervention within 24-48 hours',
    color: '#2E9BDA',
    bgColor: 'rgba(46, 155, 218, 0.15)',
    careLevel: 'walkin',
    careAction: 'Visit a walk-in clinic within 24-48 hours',
    examples: ['Earache', 'Mild sprains', 'Urinary symptoms', 'Skin rashes'],
    timeToAssess: '≤ 60 minutes',
  },
  5: {
    level: 5,
    name: 'Non-Urgent',
    description: 'Condition that can be managed with self-care or a scheduled visit',
    color: '#48BB78',
    bgColor: 'rgba(72, 187, 120, 0.15)',
    careLevel: 'selfcare',
    careAction: 'Self-care at home or visit a pharmacy',
    examples: ['Common cold', 'Minor cuts', 'Insect bites', 'Mild headache'],
    timeToAssess: '≤ 120 minutes',
  },
};

export function getCareLevel(ctasLevel) {
  return ctasLevels[ctasLevel]?.careLevel || 'walkin';
}

export function getCareColor(careLevel) {
  const colors = {
    selfcare: '#48BB78',
    pharmacy: '#2E9BDA',
    walkin: '#ECC94B',
    er: '#F56565',
  };
  return colors[careLevel] || '#A0AEC0';
}
