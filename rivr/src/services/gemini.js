// Gemini API wrapper + CTAS prompt engineering
// Phase 3: Replace mock with real Gemini API calls

const CTAS_SYSTEM_PROMPT = `You are a clinical triage AI assistant trained on the Canadian Triage and Acuity Scale (CTAS).

Given a patient's vital signs and symptom interview transcript, assess the patient and provide:
1. A CTAS level (1-5)
2. A care-level recommendation
3. Clinical reasoning
4. A structured symptom summary

CRITICAL RULE — SYMPTOM-FIRST TRIAGE:
The patient's reported symptoms in the transcript ALWAYS take priority over vital sign readings.
Vital signs may be measured under calm conditions and can appear normal even when the patient is describing a medical emergency.

If the transcript contains ANY of these life-threatening red flags, you MUST assign CTAS 1 or CTAS 2 and recommend "er", REGARDLESS of how normal the vital signs appear:
- Chest pain, chest tightness, or chest pressure
- Shortness of breath or difficulty breathing
- Sudden weakness, numbness, or paralysis (especially one-sided)
- Severe abdominal pain
- Signs of stroke (slurred speech, facial drooping, confusion)
- Severe allergic reaction or anaphylaxis
- Uncontrolled bleeding or trauma
- Loss of consciousness, fainting, or syncope
- Suicidal ideation or self-harm

Do NOT average or dilute the severity based on normal vitals. A patient reporting crushing chest pain with a heart rate of 72 BPM is still CTAS 1.

CTAS Scale:
- CTAS 1 (Resuscitation): Immediate life-threatening conditions — recommend "er"
- CTAS 2 (Emergent): Potential threats to life, limb, or function — recommend "er"
- CTAS 3 (Urgent): Serious conditions requiring emergency care — recommend "er" or "walkin"
- CTAS 4 (Less Urgent): Conditions requiring care within 24-48 hours — recommend "walkin" or "pharmacy"
- CTAS 5 (Non-Urgent): Conditions manageable with self-care or pharmacy — recommend "selfcare" or "pharmacy"

Output MUST be valid JSON with these fields:
{
  "ctasLevel": number (1-5),
  "careRecommendation": string ("selfcare" | "pharmacy" | "walkin" | "er"),
  "reasoning": string (2-3 sentences explaining the assessment),
  "symptomSummary": string (structured summary of symptoms for clinical record),
  "carePlanDetails": string (specific care instructions or next steps)
}`;

export async function assessWithGemini(vitals, transcript, apiKey) {
  if (!apiKey) {
    console.log('[Gemini] No API key found (Vite env missing or not loaded). Returning mock assessment.');
    return getMockAssessment(vitals, transcript);
  }

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    const promptText = 'Patient Vitals:\n- Heart Rate: ' + vitals.heartRate + ' BPM\n- Breathing Rate: ' + vitals.breathingRate + ' breaths/min\n- Temperature: ' + (vitals.temperature || 'N/A') + ' °C\n- SpO2: ' + (vitals.oxygenLevel || 'N/A') + '%\n- Stress Level: ' + vitals.stressLevel + '%\n\nSymptom Interview Transcript:\n' + transcript + '\n\nProvide your CTAS assessment as JSON.';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: CTAS_SYSTEM_PROMPT }] },
        contents: [{
          parts: [{ text: promptText }]
        }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Gemini] API returned an error:', data);
      throw new Error(`API returned status ${response.status}`);
    }

    // Safety checks or empty text catching
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
      console.error('[Gemini] Response blocked or stopped due to:', candidate.finishReason, data);
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (text) {
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    }
    
    console.error('[Gemini] Empty text in response payload:', data);
    throw new Error('No text generated from Gemini');
  } catch (error) {
    console.error('[Gemini] Failed to generate real assessment. Falling back to mock.', error);
    return getMockAssessment(vitals, transcript);
  }
}

// Red-flag keywords that override vitals and force ER recommendation
const RED_FLAG_PATTERNS = [
  /chest\s*(pain|tight|pressure|heavy)/i,
  /shortness\s*of\s*breath/i,
  /can'?t\s*breathe/i,
  /difficulty\s*breathing/i,
  /sudden\s*weakness/i,
  /numbness/i,
  /paralysis/i,
  /slurred\s*speech/i,
  /facial\s*droop/i,
  /severe\s*(abdominal|stomach)\s*pain/i,
  /anaphylaxis/i,
  /allergic\s*reaction/i,
  /uncontrolled\s*bleeding/i,
  /loss\s*of\s*consciousness/i,
  /faint/i,
  /suicidal/i,
  /self[- ]?harm/i,
  /heart\s*attack/i,
  /stroke/i,
];

function detectRedFlags(text) {
  if (!text) return [];
  return RED_FLAG_PATTERNS.filter(p => p.test(text)).map(p => p.source);
}

export function getMockAssessment(vitals, transcript) {
  // Symptom-first triage: check transcript for red flags BEFORE looking at vitals
  const redFlags = detectRedFlags(transcript);
  const hasRedFlags = redFlags.length > 0;

  let ctasLevel = 4;
  let careRecommendation = 'walkin';

  if (hasRedFlags) {
    // Red flags override vitals — always escalate to ER
    ctasLevel = redFlags.length >= 2 ? 1 : 2;
    careRecommendation = 'er';
  } else {
    // Fall back to vitals-based heuristic only when no red flags
    const hrHigh = vitals?.heartRate > 100;
    const brHigh = vitals?.breathingRate > 20;
    const stressHigh = vitals?.stressLevel > 60;
    const concerning = [hrHigh, brHigh, stressHigh].filter(Boolean).length;

    if (concerning >= 3) {
      ctasLevel = 2;
      careRecommendation = 'er';
    } else if (concerning >= 2) {
      ctasLevel = 3;
      careRecommendation = 'er';
    } else if (concerning >= 1) {
      ctasLevel = 4;
      careRecommendation = 'walkin';
    } else {
      ctasLevel = 5;
      careRecommendation = 'selfcare';
    }
  }

  const hr = vitals?.heartRate || '--';
  const br = vitals?.breathingRate || '--';
  const sl = vitals?.stressLevel || '--';

  const symptomNote = hasRedFlags
    ? 'Transcript contains life-threatening red-flag symptoms that require immediate emergency evaluation regardless of vital sign readings.'
    : 'No life-threatening red flags detected in transcript.';

  const careDesc = careRecommendation === 'er'
    ? 'immediate emergency evaluation'
    : careRecommendation === 'walkin'
    ? 'clinical assessment within 24-48 hours'
    : careRecommendation === 'pharmacy'
    ? 'pharmacy consultation'
    : 'self-care management';

  const transcriptSummary = transcript
    ? transcript.substring(0, 300) + (transcript.length > 300 ? '...' : '')
    : 'No transcript available.';

  return {
    ctasLevel,
    careRecommendation,
    reasoning: 'Based on the patient\'s reported symptoms and vital signs (HR: ' + hr + ' BPM, BR: ' + br + ' br/min, Stress: ' + sl + '%), the condition warrants ' + careDesc + '. ' + symptomNote,
    symptomSummary: transcriptSummary,
    carePlanDetails: careRecommendation === 'er'
      ? 'Proceed to nearest Emergency Department immediately. Bring this triage report for the triage nurse. Avoid driving if experiencing severe symptoms. Call 911 if condition worsens.'
      : careRecommendation === 'walkin'
      ? 'Schedule a visit to a walk-in clinic within the next 24-48 hours. If symptoms worsen significantly or new symptoms develop (vision changes, neck stiffness, high fever), proceed to the ER immediately.'
      : careRecommendation === 'pharmacy'
      ? 'Visit a nearby pharmacy for OTC medication consultation. If symptoms persist beyond 48 hours or worsen, visit a walk-in clinic.'
      : 'Rest and stay hydrated. Monitor symptoms for 48-72 hours. Seek medical attention if symptoms worsen or new symptoms develop.',
  };
}
