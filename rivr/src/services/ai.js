// Backboard.io — Two-pass agentic triage pipeline
// Pass 1: Symptom & vital extraction from transcript
// Pass 2: CTAS assessment using extracted clinical data
//
// Uses Backboard's unified LLM API with persistent memory.
// Assistants are created once per page load and reused across assessments.

// In dev, requests are proxied through Vite to avoid CORS.
// In production, you'd use your own backend or a CORS-friendly endpoint.
const BACKBOARD_URL = import.meta.env.DEV
  ? '/api/backboard'
  : 'https://app.backboard.io/api';

// NOTE: All curly braces in JSON examples are escaped with {{ }} because
// Backboard uses LangChain prompt templates that treat { } as variables.

const EXTRACTION_PROMPT = `You are a clinical data extraction AI. Extract structured medical information from a patient interview transcript.

Extract:
1. All symptoms mentioned (with severity, duration, and body location if stated)
2. Any self-reported vital signs (temperature, heart rate, blood pressure, etc.)
3. Current medications
4. Known allergies
5. Any red-flag symptoms that indicate a medical emergency

You MUST respond with ONLY valid JSON — no markdown, no explanation, no wrapping.
The JSON schema is:
{{
  "symptoms": [
    {{ "name": "string", "severity": "mild|moderate|severe", "duration": "string or null", "bodyLocation": "string or null" }}
  ],
  "selfReportedVitals": {{
    "heartRate": "number or null",
    "breathingRate": "number or null",
    "temperature": "number or null",
    "oxygenLevel": "number or null",
    "bloodPressure": "string or null"
  }},
  "medications": ["string"],
  "allergies": ["string"],
  "redFlags": ["string"],
  "chiefComplaint": "string - one sentence summary of main concern"
}}`;

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

You MUST respond with ONLY valid JSON — no markdown, no explanation, no wrapping.
The JSON schema is:
{{
  "ctasLevel": "number (1-5)",
  "careRecommendation": "selfcare | pharmacy | walkin | er",
  "reasoning": "string (2-3 sentences explaining the assessment)",
  "symptomSummary": "string (structured summary for clinical record)",
  "carePlanDetails": "string (specific care instructions)"
}}`;

// ── Backboard API helpers ──

const assistantCache = {};

async function backboard(path, apiKey, body = {}) {
  const res = await fetch(`${BACKBOARD_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.detail || data.error?.message || data.message || `Backboard API returned ${res.status}`;
    console.error('[Backboard] Error:', data);
    throw new Error(msg);
  }

  return data;
}

async function getOrCreateAssistant(name, systemPrompt, apiKey) {
  if (assistantCache[name]) return assistantCache[name];

  const res = await backboard('/assistants', apiKey, {
    name,
    system_prompt: systemPrompt,
  });

  assistantCache[name] = res.assistant_id;
  return res.assistant_id;
}

async function ask(assistantId, content, apiKey) {
  const thread = await backboard(`/assistants/${assistantId}/threads`, apiKey);

  const response = await backboard(`/threads/${thread.thread_id}/messages`, apiKey, {
    content,
    stream: false,
    memory: 'Auto',
  });

  return response.content;
}

// ── Parsing & validation ──

function parseJSON(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}\nRaw: ${cleaned.slice(0, 300)}`);
  }
}

function validateAssessment(assessment) {
  const level = assessment.ctasLevel;
  if (typeof level !== 'number' || level < 1 || level > 5) {
    assessment.ctasLevel = Math.max(1, Math.min(5, Math.round(level) || 4));
  }
  const validCare = ['selfcare', 'pharmacy', 'walkin', 'er'];
  if (!validCare.includes(assessment.careRecommendation)) {
    assessment.careRecommendation = assessment.ctasLevel <= 2 ? 'er' : 'walkin';
  }
  return assessment;
}

// ── Public API ──

/**
 * Two-pass agentic assessment pipeline via Backboard.io.
 *
 * Pass 1 — Extract structured symptoms & vitals from the interview transcript.
 * Pass 2 — CTAS assessment using the extracted data.
 *
 * @param {string} transcript  The voice interview transcript.
 * @param {string} apiKey      Backboard API key.
 * @param {(step: number) => void} onStepChange  Callback fired when each pass starts.
 * @returns {{ extraction: object, assessment: object }}
 */
export async function assessTranscript(transcript, apiKey, onStepChange) {
  if (!apiKey) {
    throw new Error('Backboard API key is required. Check your .env setup.');
  }

  // === PASS 1: Symptom & vital extraction ===
  onStepChange?.(1);
  const extractorId = await getOrCreateAssistant(
    'Rivr Symptom Extractor',
    EXTRACTION_PROMPT,
    apiKey,
  );
  const rawExtraction = await ask(
    extractorId,
    `Patient Interview Transcript:\n${transcript}\n\nExtract all clinical data as JSON.`,
    apiKey,
  );
  const extraction = parseJSON(rawExtraction);

  // === PASS 2: CTAS Assessment ===
  onStepChange?.(2);
  const assessorId = await getOrCreateAssistant(
    'Rivr CTAS Assessor',
    ASSESSMENT_PROMPT,
    apiKey,
  );
  const rawAssessment = await ask(
    assessorId,
    `Extracted Clinical Data:\n${JSON.stringify(extraction, null, 2)}\n\nProvide your CTAS assessment as JSON.`,
    apiKey,
  );
  const assessment = validateAssessment(parseJSON(rawAssessment));

  return { extraction, assessment };
}
