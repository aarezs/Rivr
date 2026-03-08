# Rivr — AI-Powered Emergency Triage, Straight From Your Phone

**Stop Googling your symptoms. Talk to Rivr.**

Rivr is a voice-first AI triage app that interviews patients in their own language, assesses urgency using the Canadian Triage and Acuity Scale (CTAS), and routes them to the right level of care — whether that's self-care at home, a pharmacy, a walk-in clinic, or the ER.

**[Try it live](https://rivr-tau.vercel.app)**

---

## The Problem

Emergency rooms are overwhelmed. Patients wait hours for non-urgent issues while critical cases get delayed. People don't know *where* to go — they just know something's wrong.

Meanwhile, newcomers and non-English speakers face an even bigger barrier: they can't describe their symptoms effectively, leading to misdiagnosis and dangerous delays.

## What Rivr Does

1. **Talk, don't type** — Rivr uses ElevenLabs Conversational AI to conduct a natural voice interview. Speak in English, French, Mandarin, Arabic, Hindi, or Spanish.

2. **Two-pass AI assessment** — Your transcript is analyzed by a dual-agent AI pipeline powered by Backboard.io:
   - **Pass 1**: Extracts symptoms, vitals, medications, allergies, and red flags
   - **Pass 2**: Runs a CTAS-based triage assessment with clinical reasoning

3. **Smart care routing** — Based on your CTAS level, Rivr tells you exactly where to go:
   - **CTAS 5** — Go home and rest
   - **CTAS 4** — Visit a pharmacy
   - **CTAS 3** — Head to a walk-in clinic
   - **CTAS 1-2** — Get to the ER now (or call 911)

4. **Find nearby facilities** — Real-time map with nearby hospitals and walk-in clinics sorted by distance, powered by OpenStreetMap.

5. **ER wait times** — See estimated wait times and capacity at nearby emergency rooms to make informed decisions.

6. **Downloadable reports** — Generate PDF triage reports for ER staff or visit summaries for walk-in receptionists — skip the paperwork.

---

## How It Works

```
Patient speaks → ElevenLabs voice AI interviews them
                        ↓
              Transcript generated
                        ↓
        Pass 1: Symptom extraction (Backboard.io)
                        ↓
        Pass 2: CTAS assessment (Backboard.io)
                        ↓
           Care routing + facility map + PDF
```

---

## Built With

### Frontend
- **React 19** — UI framework
- **Vite 7** — Build tool & dev server
- **Tailwind CSS 4** — Styling
- **Leaflet + React-Leaflet** — Interactive maps
- **Lucide React** — Icons
- **react-i18next** — Internationalization (6 languages)
- **jsPDF** — Client-side PDF generation
- **html2canvas** — PDF rendering

### AI & APIs
- **ElevenLabs Conversational AI** — Real-time voice interviews via WebRTC
- **Backboard.io** — Unified LLM API with persistent memory (two-pass agentic pipeline)
- **OpenStreetMap Overpass API** — Nearby facility search (hospitals, clinics, pharmacies)

### Deployment
- **Vercel** — Hosting, API proxying via rewrites
- **GitHub** — Source control

---

## Run Locally

```bash
git clone https://github.com/aarezs/Rivr.git
cd Rivr/rivr
npm install
```

Create a `.env` file:
```
VITE_BACKBOARD_API_KEY=your_backboard_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id
```

```bash
npm run dev
```

---

## Team

Built at Hack Canada 2026.
