# GOAT.ai — Plan

_Last updated: October 18, 2025_

**Status:** 85% Complete - Core MVP functional, performance validation needed

---

# Clean PRD

## Mission
Deliver a 3–5 minute live demo where:
- I speak to **Sherry** using a mic (ElevenLabs **STT**).
- **Sherry** replies in text with her **real voice** overlaid (ElevenLabs **TTS**, consented).
- I summon **`@warrenbuffett`**, and the persona continues the conversation seamlessly (Groq LLM + generic mentor voice).
- Persona style is driven by **prebuilt Persona Cards** (seeded JSON). **Exa.ai** integration is optional/post-MVP.

## Non-Goals (MVP)
- No accounts, persistence beyond one session (optional).
- No multi-persona mixing or diarization.
- No live Exa.ai scraping in the happy-path demo.
- No financial/medical advice; voices for living people only with explicit consent.

## User Stories (MVP)
1. **Voice → Text:** Tap mic, ask Sherry a question; the app transcribes to text.
2. **Text → Voice (Sherry):** The reply renders as text + her voice (TTS).
3. **Persona Handoff:** Typing `@warrenbuffett …` switches persona; he replies in-thread with audio.
4. **Persona Cards:** System prompts and verbal style come from seeded JSON → Supabase.

## Acceptance Criteria
- End-to-end round trip per turn ≤ **5 s** (STT ≤ 2 s, LLM ≤ 1.5 s, TTS ≤ 1.5 s).
- Persona switch works on the next message after `@slug`.
- Demo runs on a fresh laptop with only `.env.local` configured.
- Backup **Demo Mode** produces canned text+audio and the same UI flow.

---

# Project Context Primer

## Final Stack (locked for hackathon)
- **Frontend:** Next.js (App Router, TS)
- **Backend / DB:** Supabase (tables: `personas`, `conversations`, `messages`)
- **LLM (Groq):** `meta-llama/llama-4-scout-17b-16e-instruct` (default)
- **Voice:** ElevenLabs for **STT + TTS**
- **Persona Source:** Prebuilt Persona Cards (JSON seed). Exa.ai added later if time.
- **Two coding devs; four people total.** Vertical slices, not FE/BE split.

## Roles & Ownership
- **You (Product / Architect):** Direction, demo script, `.env`, seeds, merges, prompts.
- **Dev A (Backend-leaning):** `/app/api/chat`, `/app/api/stt`, `/app/api/tts`, `/lib/supabase.ts`, schema + seed.
- **Dev B (Frontend-leaning):** `/components/*`, `/hooks/useRecorder.ts`, `/app/page.tsx`, persona chip, bubbles, audio.
- **Teammate D (Support/QA):** Voice setup (Sherry), curate persona cards, QA, timing, presentation.

### Folder Ownership (collision-free)
- `/app/api/*` → Dev A
- `/components/*`, `/hooks/*`, `/app/page.tsx` → Dev B
- `/lib/*`, `/scripts/*`, `/seed/*` → You
- Docs & `.env*` → You / D

## Branching & Merge Protocol
- `main` (protected, demo-ready)
- `dev/backend` (Dev A)
- `dev/frontend` (Dev B)
- `dev/integration` (You)
- **Ritual:** Pull before editing; commit before large Cursor refactors; nightly merge to `main` + smoke test; tag `stable-vX`.

## Architecture (MVP)
Next.js
├─ /api/stt → ElevenLabs STT
├─ /api/chat → Groq (Scout) + persona system prompt
├─ /api/tts → ElevenLabs TTS
├─ /api/switch → set active persona
└─ (optional) /api/persona → future Exa.ai rebuild

Supabase
├─ personas(id, slug, name, voice_style, system_prompt, style[], taboo[], sources[])
├─ conversations(id, active_persona, created_at)
└─ messages(id, conversation_id, role, persona_id, text, audio_url, created_at)


## API Contracts (concise)
- `POST /api/stt` → body: audio blob → `{ text }`
- `POST /api/chat` → `{ conversationId, text }` → `{ text }`
- `POST /api/tts` → `{ text, voiceStyle }` → `{ audioUrl }`
- `POST /api/switch` → `{ conversationId, slug }` → `{ success, activePersona }`

---

# Implementation Status

## ✅ Completed Features (Release v0.1)

### Database Schema ✅
**Status:** DONE  
**Location:** `supabase/schema.sql`, `supabase/seed.sql`

Schema created with `personas`, `conversations`, `messages` tables. RLS policies enabled. Indexes on foreign keys. 6 personas seeded (Warren Buffett, Elon Musk, Steve Jobs, Naval, Ray Dalio, Mentor).

### Groq Orchestrator ✅
**Status:** DONE  
**Location:** `/app/api/chat/route.ts`

Implemented using Groq `llama-3.1-70b-versatile` (Scout model unavailable), temperature 0.7, max_tokens 500. Accepts `{ message, systemPrompt, conversationHistory }`, composes SYSTEM from persona.system_prompt, returns `{ text }`. Note: Messages saved via separate `lib/chat.ts` functions, not in route directly.

### ElevenLabs STT ✅
**Status:** DONE  
**Location:** `/app/api/stt/route.ts`

Accepts FormData with WebM audio blob → ElevenLabs STT API → returns `{ text }`. Graceful error handling with fallback message if service unavailable.

### ElevenLabs TTS ✅
**Status:** DONE  
**Location:** `/app/api/tts/route.ts`

Accepts `{ text, voiceStyleId }` → ElevenLabs TTS API → returns `{ audioUrl }` as base64 data URL. Character limit enforced (150 chars ≈ 12 seconds) to prevent quota exhaustion.

### Frontend UI ✅
**Status:** DONE  
**Location:** `/components/*`, `/app/chat/page.tsx`, `/app/landing/page.tsx`

Created `ChatList.tsx`, `Composer.tsx`, `MicButton.tsx`, `AudioPlayer.tsx`, `Toast.tsx`. Full wiring: mic → `/api/stt`; text submit → `/api/chat`; auto-generates assistant audio via `/api/tts`; detects `@slug` for persona switching (client-side).

### Recorder Integration ✅
**Status:** DONE  
**Location:** `/components/MicButton.tsx`

Implemented inline using MediaRecorder API. Exposes start/stop via button click, visual state (recording/processing). On stop, POSTs to `/api/stt` and returns transcript to parent component.

### Chat Operations ✅
**Status:** DONE  
**Location:** `/lib/chat.ts`, `/lib/personas.ts`

Functions: `getConversation()`, `createConversation()`, `sendMessage()`, `addAssistantMessage()`. Persona functions: `getPersona()`, `listPersonas()`, `createPersona()`, `buildPersona()` with Exa API integration for dynamic persona creation.

### Demo Mode ✅
**Status:** DONE  
**Location:** All `/app/api/*` routes + components

Gated with `NEXT_PUBLIC_DEMO_MODE=true`. Returns canned responses from chat API. TTS still generates audio. In-memory persona storage. Works offline for development and backup demo.

---

## 🚧 Remaining Work (Release v0.2)

### Performance Validation & Optimization (HIGH PRIORITY)
**Target:** Verify <5s round-trip (STT ≤2s + LLM ≤1.5s + TTS ≤1.5s)

"Add performance instrumentation to chat flow. Measure: (1) STT latency from mic stop → transcript; (2) LLM latency from request → response; (3) TTS latency from request → audioUrl. Log timings to console. If exceeding targets: consider `llama-3.1-8b-instant` for faster LLM, reduce max_tokens to 300, or implement parallel TTS (start TTS request as LLM streams)."

**Files:** `/app/chat/page.tsx`, `/components/MicButton.tsx`  
**Success:** Console logs show per-component timing, total <5s for happy path

### Real-time Message Updates (HIGH PRIORITY)
**Target:** Live message sync without manual refresh

"Implement Supabase real-time subscriptions in chat page. On mount, subscribe to `messages` table where `conversation_id = current`. On insert event, update local state with new message. Auto-scroll to latest. Clean up subscription on unmount. Remove manual `getConversation()` refresh after sending."

**Files:** `/app/chat/page.tsx`, `/lib/chat.ts`  
**Success:** New messages appear instantly without page refresh

### Persona Switch Endpoint (MEDIUM PRIORITY)
**Target:** RESTful persona switching

"Implement `/api/switch` to accept `{ conversationId, slug }`. Update `conversations.persona_id` in Supabase. Return `{ success: true, activePersona: { id, slug, name } }`. Update chat page to call this endpoint when `@slug` detected instead of client-side conversation recreation."

**Files:** `/app/api/switch/route.ts`, `/app/chat/page.tsx`  
**Success:** Persona switches within same conversation, maintains message history

### Voice Mapping per Persona (MEDIUM PRIORITY)
**Target:** Persona-specific voices (especially Sherry)

"Add `voice_id` column to `personas` table (varchar 100, nullable). Update seed data with ElevenLabs voice IDs (Sherry's voice_id for 'sherry' persona, generic for others). Update `/api/tts` to accept persona object, use `persona.voice_id || DEFAULT_VOICE_ID`. Test with at least one custom cloned voice."

**Files:** `supabase/schema.sql`, `supabase/seed.sql`, `/app/api/tts/route.ts`, `/app/chat/page.tsx`  
**Success:** Different personas produce audio in different voices

### Demo Preparation & Testing (HIGH PRIORITY)
**Target:** Fresh laptop setup validation

"Create `docs/demo-script.md` with step-by-step demo flow (5 minutes). Test on fresh laptop: clone repo, `npm install`, `npm run setup`, add API keys to `.env.local`, `npm run dev`. Verify all features work. Document any manual steps. Test demo mode as backup. Record timing for each demo step."

**Files:** `docs/demo-script.md`, `README.md` (update troubleshooting)  
**Success:** Demo runs smoothly on fresh machine, <3min setup time

---

## 🔮 Future Enhancements (Release v0.3+)

### Unified API Response Format
**Target:** Consistent error handling

"Standardize all `/api/*` routes to return `{ success: boolean, data?: any, error?: string }`. Add Zod schemas for request validation. Return proper HTTP status codes (400 for validation, 401/403 for auth, 500 for server errors). Update frontend to handle unified format."

**Files:** All `/app/api/*/route.ts`, create `/lib/schemas.ts`  
**Success:** All APIs follow same response contract, better error messages

### Rate Limiting
**Target:** Protect API endpoints

"Add rate limiting middleware using `@upstash/ratelimit` or in-memory store. Limit: `/api/chat` → 20 req/min; `/api/tts` → 30 req/min; `/api/stt` → 30 req/min. Return 429 status when exceeded. Add client-side retry with exponential backoff."

**Files:** `middleware.ts`, `/lib/rate-limit.ts`  
**Success:** APIs protected from abuse, graceful degradation under load

### Conversation Persistence UI
**Target:** Access conversation history

"Add sidebar to chat page showing previous conversations. List conversations by title (auto-generate from first message) and timestamp. Click to load conversation. Add 'New Chat' button. Store conversation_id in URL params for sharing/bookmarking."

**Files:** `/components/ConversationList.tsx`, `/app/chat/page.tsx`, `/lib/chat.ts`  
**Success:** Users can resume previous conversations

### Streaming LLM Responses
**Target:** Faster perceived response time

"Update `/api/chat` to stream Groq responses using `stream: true`. Use ReadableStream in Next.js. Update chat page to consume stream and render tokens as they arrive. Consider streaming TTS generation (split response into sentences, generate audio in parallel)."

**Files:** `/app/api/chat/route.ts`, `/app/chat/page.tsx`  
**Success:** Users see response appear word-by-word, feels faster

### Advanced Persona Builder
**Target:** UI for creating custom personas

"Create `/app/personas/new` page. Form: name, slug, style bullets (textarea), taboo topics (textarea), system prompt (textarea). Optionally query Exa API for research. Preview persona before saving. Update seed script to load from JSON file for easier customization."

**Files:** `/app/personas/new/page.tsx`, `/components/PersonaForm.tsx`  
**Success:** Non-technical users can create personas via UI

### Audio Waveform Visualization
**Target:** Better voice recording UX

"Add live audio waveform during recording using Web Audio API. Show amplitude bars or wave pattern. Visual confirmation that mic is picking up sound. Add silence detection to auto-stop recording after 2s of silence."

**Files:** `/components/MicButton.tsx`, create `/lib/audio-visualizer.ts`  
**Success:** Users see visual feedback while speaking

### Mobile Optimization
**Target:** Responsive design for phone/tablet

"Test on iOS Safari and Android Chrome. Fix: mic permissions, audio playback autoplay policies, touch targets (44px min), viewport scaling. Add PWA manifest for install-to-homescreen. Test offline mode with service worker cache."

**Files:** `/app/layout.tsx`, `manifest.json`, `service-worker.ts`, CSS updates  
**Success:** App works smoothly on mobile devices

---

# Tech Stack Notes

## LLM Model Change
- **Original Plan:** `meta-llama/llama-4-scout-17b-16e-instruct`
- **Current Implementation:** `llama-3.1-70b-versatile`
- **Reason:** Scout model not available on Groq platform
- **Impact:** Faster inference (<1s), excellent quality, no issues

## Database Schema Differences
- **Plan:** `voice_style` column in personas table
- **Current:** `style_bullets` and `taboo` JSONB columns
- **Plan:** `active_persona` column in conversations
- **Current:** `persona_id` foreign key in conversations
- Minor naming differences, functionality equivalent

## Client-side Persona Switching
- **Plan:** `/api/switch` endpoint to update conversation
- **Current:** Client-side logic creates new conversation on switch
- **Impact:** Works for demo, but loses message history on switch
- **Recommendation:** Implement `/api/switch` for v0.2

---

# Quick Commands

```bash
# Setup
cd goat-ai && npm install
npm run setup  # Creates .env.local template

# Development
npm run dev    # Start Next.js dev server

# Database
npm run seed   # Seed personas (requires Supabase configured)

# Testing
npm run test:e2e  # Playwright E2E tests

# Demo Mode (offline)
# Set in .env.local: NEXT_PUBLIC_DEMO_MODE=true
```

---

# Next Session Checklist

Before the demo, ensure:
- [ ] Performance timings logged and verified <5s
- [ ] Real-time message updates working
- [ ] Demo tested on fresh laptop
- [ ] Demo script written and rehearsed
- [ ] Backup demo mode verified working
- [ ] Voice mapping for Sherry (if applicable)
- [ ] Error handling tested (network offline, API failures)
- [ ] All API keys documented and secured

**Current Focus:** Performance validation → Real-time sync → Demo prep

See `docs/progress.md` for detailed implementation status and recommendations.