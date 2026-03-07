// ElevenLabs Conversational AI configuration
export const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

// Language code mapping for ElevenLabs override
const LANGUAGE_MAP = {
  en: 'en',
  fr: 'fr',
  zh: 'zh',
  ar: 'ar',
  pa: 'pa',
  es: 'es',
};

export function getElevenLabsLanguage(appLanguage) {
  return LANGUAGE_MAP[appLanguage] || 'en';
}

// Build transcript string from message history for downstream consumption
export function buildTranscript(messages) {
  return messages
    .map(m => `${m.type === 'ai' ? 'AI' : 'Patient'}: ${m.text}`)
    .join('\n');
}

// Mock transcript for offline/demo fallback
export function getMockTranscript() {
  return `Patient reports persistent severe headaches for 3 days, rated 6-7/10 severity.
Pain localized behind the eyes, worsening over time.
Currently taking ibuprofen with minimal relief.
Also takes daily multivitamin.
No known drug allergies.
Headaches interfering with daily work activities.`;
}
