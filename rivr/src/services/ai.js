// Backboard.io — Two-pass agentic triage pipeline
// Pass 1: Symptom & vital extraction from transcript
// Pass 2: CTAS assessment using extracted clinical data
//
// Uses Backboard's unified LLM API with persistent memory.
// Assistants are created once per page load and reused across assessments.

// In dev, requests are proxied through Vite to avoid CORS.
// In production, you'd use your own backend or a CORS-friendly endpoint.
const BACKBOARD_URL = '/api/backboard';

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

CTAS Scale — use these examples to calibrate your assessment:
- CTAS 1 (Resuscitation): Cardiac arrest, not breathing, unresponsive — recommend "er"
- CTAS 2 (Emergent): Active chest pain, stroke symptoms, severe allergic reaction, major trauma, severe difficulty breathing — recommend "er"
- CTAS 3 (Urgent): High fever with severe symptoms, moderate difficulty breathing, significant abdominal pain, head injury with vomiting, suspected fracture — recommend "er" or "walkin"
- CTAS 4 (Less Urgent): Sore throat, ear pain, UTI symptoms, mild sprains, skin rash, vomiting without dehydration, cough with mucus, low-grade fever — recommend "walkin" or "pharmacy"
- CTAS 5 (Non-Urgent): Common cold, mild headache, minor cuts, insect bites, congestion, general fatigue — recommend "selfcare" or "pharmacy"

Do NOT assign CTAS 3 or higher for common infections (sore throat, ear infections, sinus infections, cough) unless accompanied by a confirmed red flag symptom above. When in doubt between two levels, choose the less urgent one if no red flags are present.

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

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[Backboard] Non-JSON response:', text.slice(0, 500));
    throw new Error(`Backboard API returned non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

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

  // Backboard may return content as a string, array of content blocks, or nested object
  const raw = response.content;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    // Handle array of content blocks like [{type: "text", text: "..."}]
    const textBlock = raw.find(b => b.type === 'text') || raw[0];
    return textBlock?.text || textBlock?.content || JSON.stringify(textBlock);
  }
  if (raw && typeof raw === 'object') {
    return raw.text || raw.content || raw.message || JSON.stringify(raw);
  }
  // Fallback: try the full response object
  const fallback = response.text || response.message || response.output || response.result;
  if (fallback) return typeof fallback === 'string' ? fallback : JSON.stringify(fallback);
  // Last resort: stringify whatever we got
  console.warn('[Backboard] Unexpected response shape:', response);
  return JSON.stringify(response);
}

// ── Parsing & validation ──

function parseJSON(text) {
  // If already an object (pre-parsed), return directly
  if (typeof text === 'object' && text !== null) return text;

  let cleaned = String(text).trim();
  // Strip markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Strip any leading/trailing non-JSON text (find first { or [)
  const jsonStart = cleaned.search(/[{\[]/);
  const jsonEndBrace = cleaned.lastIndexOf('}');
  const jsonEndBracket = cleaned.lastIndexOf(']');
  const jsonEnd = Math.max(jsonEndBrace, jsonEndBracket);
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${e.message}\nRaw: ${cleaned.slice(0, 300)}`);
  }
}

function validateAssessment(assessment) {
  // Coerce ctasLevel to number (LLM may return "3" instead of 3)
  let level = Number(assessment.ctasLevel);
  if (isNaN(level) || level < 1 || level > 5) {
    level = 4; // safe default
  }
  assessment.ctasLevel = Math.max(1, Math.min(5, Math.round(level)));

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
