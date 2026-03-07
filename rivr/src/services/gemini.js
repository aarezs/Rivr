// Gemini API — Two-pass agentic triage architecture
// Pass 1: Symptom & vital extraction from transcript
// Pass 2: CTAS assessment using extracted clinical data

const EXTRACTION_PROMPT = `You are a clinical data extraction AI. Extract structured medical information from a patient interview transcript.

Extract:
1. All symptoms mentioned (with severity, duration, and body location if stated)
2. Any self-reported vital signs (temperature, heart rate, blood pressure, etc.)
3. Current medications
4. Known allergies
5. Any red-flag symptoms that indicate a medical emergency

Output MUST be valid JSON:
{
  "symptoms": [
    { "name": "string", "severity": "mild|moderate|severe", "duration": "string or null", "bodyLocation": "string or null" }
  ],
  "selfReportedVitals": {
    "heartRate": number or null,
    "breathingRate": number or null,
    "temperature": number or null,
    "oxygenLevel": number or null,
    "bloodPressure": "string or null"
  },
  "medications": ["string"],
  "allergies": ["string"],
  "redFlags": ["string"],
  "chiefComplaint": "string - one sentence summary of main concern"
}`;

const ASSESSMENT_PROMPT = `You are a clinical triage AI assistant trained on the Canadian Triage and Acuity Scale (CTAS).

Given structured clinical data extracted from a patient interview, provide a CTAS assessment.

CRITICAL RULE — SYMPTOM-FIRST TRIAGE:
The patient's reported symptoms ALWAYS take priority over vital sign readings.
Vital signs may be measured under calm conditions and can appear normal even when the patient is describing a medical emergency.

If the extracted data contains ANY of these life-threatening red flags, you MUST assign CTAS 1 or CTAS 2 and recommend "er", REGARDLESS of how normal the vitals appear:
- Chest pain, chest tightness, or chest pressure
- Shortness of breath or difficulty breathing
- Sudden weakness, numbness, or paralysis (especially one-sided)
- Severe abdominal pain
- Signs of stroke (slurred speech, facial drooping, confusion)
- Severe allergic reaction or anaphylaxis
- Uncontrolled bleeding or trauma
- Loss of consciousness, fainting, or syncope
- Suicidal ideation or self-harm

CTAS Scale:
- CTAS 1 (Resuscitation): Immediate life-threatening — recommend "er"
- CTAS 2 (Emergent): Potential threat to life/limb — recommend "er"
- CTAS 3 (Urgent): Serious, needs emergency care — recommend "er" or "walkin"
- CTAS 4 (Less Urgent): Needs care within 24-48h — recommend "walkin" or "pharmacy"
- CTAS 5 (Non-Urgent): Self-care or pharmacy — recommend "selfcare" or "pharmacy"

You must also estimate reasonable vital sign values based on the symptoms described if the patient did not self-report them. Use clinical judgement: for example, a patient with high fever likely has elevated heart rate.

Output MUST be valid JSON:
{
  "ctasLevel": number (1-5),
  "careRecommendation": "selfcare" | "pharmacy" | "walkin" | "er",
  "reasoning": "string (2-3 sentences explaining the assessment)",
  "symptomSummary": "string (structured summary for clinical record)",
  "carePlanDetails": "string (specific care instructions)",
  "vitals": {
    "heartRate": number or null,
    "breathingRate": number or null,
    "temperature": number or null,
    "oxygenLevel": number or null,
    "stressLevel": number or null
  }
}`;

async function callGemini(systemPrompt, userPrompt, apiKey) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
    apiKey;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Gemini] API error:', data);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const candidate = data.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    console.warn('[Gemini] Response stopped:', candidate.finishReason);
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No text in Gemini response');

  return JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
}

/**
 * Two-pass agentic assessment pipeline.
 *
 * Pass 1 — Extract structured symptoms & vitals from the interview transcript.
 * Pass 2 — CTAS assessment using the extracted data.
 *
 * @param {string} transcript  The voice interview transcript.
 * @param {string} apiKey      Gemini API key.
 * @param {(step: number) => void} onStepChange  Optional callback fired when each pass starts.
 * @returns {{ extraction: object|null, assessment: object }}
 */
export async function assessWithGemini(transcript, apiKey, onStepChange) {
  if (!apiKey) {
    console.log('[Gemini] No API key. Returning mock assessment.');
    return { extraction: null, assessment: getMockAssessment(transcript) };
  }

  try {
    // === PASS 1: Symptom & vital extraction ===
    onStepChange?.(1);
    console.log('[Gemini] Pass 1: Extracting symptoms & vitals...');
    const extraction = await callGemini(
      EXTRACTION_PROMPT,
      `Patient Interview Transcript:\n${transcript}\n\nExtract all clinical data as JSON.`,
      apiKey,
    );
    console.log('[Gemini] Pass 1 complete:', extraction);

    // === PASS 2: CTAS Assessment ===
    onStepChange?.(2);
    console.log('[Gemini] Pass 2: Running CTAS assessment...');
    const assessment = await callGemini(
      ASSESSMENT_PROMPT,
      `Extracted Clinical Data:\n${JSON.stringify(extraction, null, 2)}\n\nProvide your CTAS assessment as JSON. Include estimated vitals if the patient did not report them.`,
      apiKey,
    );
    console.log('[Gemini] Pass 2 complete:', assessment);

    return { extraction, assessment };
  } catch (error) {
    console.error('[Gemini] Pipeline failed. Falling back to mock.', error);
    return { extraction: null, assessment: getMockAssessment(transcript) };
  }
}

// ---------------------------------------------------------------------------
// Red-flag detection for the mock fallback
// ---------------------------------------------------------------------------

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
  return RED_FLAG_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
}

export function getMockAssessment(transcript) {
  const redFlags = detectRedFlags(transcript);
  const hasRedFlags = redFlags.length > 0;

  let ctasLevel = 4;
  let careRecommendation = 'walkin';

  if (hasRedFlags) {
    ctasLevel = redFlags.length >= 2 ? 1 : 2;
    careRecommendation = 'er';
  }

  const symptomNote = hasRedFlags
    ? 'Transcript contains life-threatening red-flag symptoms requiring immediate emergency evaluation.'
    : 'No life-threatening red flags detected in transcript.';

  const transcriptSummary = transcript
    ? transcript.substring(0, 300) + (transcript.length > 300 ? '...' : '')
    : 'No transcript available.';

  return {
    ctasLevel,
    careRecommendation,
    reasoning: `Based on the patient's reported symptoms, the condition warrants ${
      careRecommendation === 'er'
        ? 'immediate emergency evaluation'
        : 'clinical assessment within 24-48 hours'
    }. ${symptomNote}`,
    symptomSummary: transcriptSummary,
    carePlanDetails:
      careRecommendation === 'er'
        ? 'Proceed to nearest Emergency Department immediately. Bring this triage report. Call 911 if condition worsens.'
        : careRecommendation === 'walkin'
          ? 'Schedule a visit to a walk-in clinic within 24-48 hours. If symptoms worsen, proceed to the ER.'
          : careRecommendation === 'pharmacy'
            ? 'Visit a nearby pharmacy for OTC medication consultation.'
            : 'Rest and stay hydrated. Monitor symptoms for 48-72 hours.',
    vitals: {
      heartRate: null,
      breathingRate: null,
      temperature: null,
      oxygenLevel: null,
      stressLevel: null,
    },
  };
}
