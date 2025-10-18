# Groq-to-ElevenLabs Voice Integration Guide

## Overview

This guide explains how to automatically generate custom ElevenLabs voices for personas based on characteristics extracted by Groq AI from Exa.ai research.

## Concept

Instead of manually assigning voices based on gender, we'll:

1. Have Groq analyze the person's voice characteristics from their content
2. Generate a voice description (age, accent, tone, pace, etc.)
3. Pass that description to ElevenLabs Voice Design API
4. Get back a custom voice_id that matches the real person
5. Assign that voice_id to the persona

## Current State

### ✅ Already Built

1. **ElevenLabs Voice Generation API** (`/api/elevenlabs/generate-voice`)

   - Accepts: `voiceDescription`, `previewText`, `gender`
   - Returns: `voice_id` and sample audio
   - Has fallback handling for plan limitations

2. **Exa.ai Research Integration**

   - Searches for content about the person
   - Returns 20 results with text snippets

3. **Groq AI Analysis**

   - Analyzes personality traits
   - Extracts communication patterns
   - Detects gender

4. **Basic Gender-Based Voice Assignment**
   - Female → Sherry's voice (`Qv0aP47SJsL43Pn6x7k9`)
   - Male → Roger's voice (`CwhRBWXzGAHq8TQ4Fs17`)

### ❌ Missing Pieces

1. **Voice Characteristics Analysis** in Groq prompt
2. **Voice Description Extraction** from Groq response
3. **Integration Logic** to call voice generation API
4. **Fallback Strategy** when voice generation fails

---

## Implementation Steps

### Step 1: Enhance Groq Prompt in `src/lib/personas.ts`

Update the `buildPersonaFromExa()` function to include voice characteristics analysis.

#### Current Groq Prompt Structure

```typescript
1. COMMUNICATION PATTERNS
2. EXPERTISE & PERSPECTIVE
3. EMOTIONAL TONE
4. INTERACTION STYLE
5. BOUNDARIES
6. GENDER IDENTIFICATION
```

#### Add Section 7: VOICE CHARACTERISTICS

```typescript
7. VOICE CHARACTERISTICS:
   Based on the person's profile, infer their likely voice characteristics:

   AGE RANGE:
   - young adult (20-35): energetic, modern, quick
   - middle-aged (36-55): authoritative, mature, steady
   - mature (56+): wise, measured, deep

   VOCAL PACE:
   - fast: rapid-fire, energetic speakers (e.g., entrepreneurs, coaches)
   - moderate: balanced, conversational (most people)
   - slow: deliberate, thoughtful (e.g., academics, philosophers)

   ENERGY LEVEL:
   - high-energy: enthusiastic, animated (e.g., motivational speakers)
   - measured: professional, controlled (e.g., executives, experts)
   - calm: soothing, gentle (e.g., therapists, spiritual teachers)

   ACCENT:
   - American: default for US-based individuals
   - British: UK-based individuals or those with British education
   - Australian: Australia-based individuals
   - neutral: international or unclear origin
   - other: specify if notable (e.g., Indian, French, etc.)

   TONE QUALITIES (select 2-3):
   - authoritative: commands respect, decisive
   - warm: friendly, approachable, caring
   - confident: self-assured, bold
   - professional: formal, polished
   - casual: relaxed, conversational
   - analytical: logical, precise
   - passionate: intense, emotional
   - humorous: playful, witty

   VOCAL TEXTURE:
   - smooth: polished, easy to listen to
   - clear: crisp, articulate
   - resonant: rich, full-bodied
   - raspy: textured, distinctive
   - soft: gentle, quiet
   - deep: low-pitched, commanding

   OUTPUT FORMAT:
   Create a single-sentence voice description:
   "[age] [gender] with [accent] accent, [tone1] and [tone2] tone, [pace] delivery"

   Examples:
   - "middle-aged male with American accent, authoritative and confident tone, measured delivery"
   - "young adult female with British accent, warm and professional tone, moderate delivery"
   - "mature male with neutral accent, analytical and calm tone, slow delivery"

   Also create a sample text (100-150 characters) that captures how this person would naturally speak,
   using their signature phrases, topics, or communication style.
```

#### Update JSON Response Format

```typescript
Format as JSON with keys:
  styleBullets (array),
  taboo (array),
  systemPrompt (string),
  gender (string: "male"|"female"|"other"),
  voiceDescription (string: single sentence as described above),
  sampleText (string: 100-150 chars in their voice)
```

#### Update Return Type

```typescript
export async function buildPersonaFromExa(
  slug: string,
  name?: string,
  query?: string
): Promise<
  Omit<Persona, "id" | "created_at"> & {
    gender?: string;
    voiceDescription?: string; // Add this
    sampleText?: string; // Add this
  }
> {
  // ... existing code ...

  const personaData = JSON.parse(groqData.choices[0].message.content);

  return {
    slug,
    name: name || slug,
    style_bullets: personaData.styleBullets || [],
    taboo: personaData.taboo || [],
    system_prompt: personaData.systemPrompt || "You are a helpful assistant.",
    sources: searchData.results.map(/* ... */),
    gender: personaData.gender || "other",
    voiceDescription: personaData.voiceDescription, // Add this
    sampleText: personaData.sampleText, // Add this
  };
}
```

---

### Step 2: Update Persona Creation API in `src/app/api/personas/create/route.ts`

Replace simple gender-based assignment with intelligent voice generation.

#### Current Logic (Simple)

```typescript
const voiceId = selectedGender === "female" ? FEMALE_VOICE_ID : MALE_VOICE_ID;
```

#### New Logic (Smart with Fallback)

```typescript
// Default fallback voices
let voiceId = selectedGender === "female" ? FEMALE_VOICE_ID : MALE_VOICE_ID;
let customVoiceGenerated = false;

// Attempt custom voice generation if we have voice characteristics
if (personaData.voiceDescription && personaData.sampleText) {
  console.log("[Persona Creation] 🎤 Attempting custom voice generation...");
  console.log(
    "[Persona Creation] Voice description:",
    personaData.voiceDescription
  );
  console.log("[Persona Creation] Sample text:", personaData.sampleText);

  try {
    // Call our voice generation endpoint
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const voiceGenResponse = await fetch(
      `${baseUrl}/api/elevenlabs/generate-voice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voiceDescription: personaData.voiceDescription,
          previewText: personaData.sampleText,
          gender: selectedGender,
        }),
      }
    );

    if (voiceGenResponse.ok) {
      const voiceGenData = await voiceGenResponse.json();

      if (voiceGenData.success && voiceGenData.voice_id) {
        voiceId = voiceGenData.voice_id;
        customVoiceGenerated = true;
        console.log(
          "[Persona Creation] ✅ Custom voice generated successfully!"
        );
        console.log("[Persona Creation] Voice ID:", voiceId);
      } else if (voiceGenData.fallback) {
        console.log(
          "[Persona Creation] ⚠️ Voice generation not available (plan limitation)"
        );
        console.log("[Persona Creation] Using gender-based fallback voice");
      }
    } else {
      const errorData = await voiceGenResponse.json();
      console.log(
        "[Persona Creation] ⚠️ Voice generation failed:",
        errorData.error
      );
      console.log("[Persona Creation] Using gender-based fallback voice");
    }
  } catch (error: any) {
    console.error("[Persona Creation] Voice generation error:", error.message);
    console.log("[Persona Creation] Using gender-based fallback voice");
  }
} else {
  console.log(
    "[Persona Creation] ℹ️ No voice characteristics provided by Groq"
  );
  console.log("[Persona Creation] Using gender-based fallback voice");
}

console.log(
  `[Persona Creation] Final voice assignment: ${voiceId} ${
    customVoiceGenerated ? "(custom)" : "(fallback)"
  }`
);
```

#### Add Voice Info to Response

```typescript
return NextResponse.json({
  success: true,
  persona: newPersona,
  gender: selectedGender,
  voiceId: voiceId,
  customVoice: customVoiceGenerated, // Add this flag
  voiceDescription: personaData.voiceDescription, // Add this for debugging
});
```

---

### Step 3: Update UI Feedback in `src/components/CreatePersonaModal.tsx`

Show better feedback during voice generation.

#### Update Loading Message

```typescript
{
  isLoading && (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">
        Researching persona and generating custom voice...
      </p>
      <p className="text-xs text-gray-400 mt-2">This may take 10-15 seconds</p>
    </div>
  );
}
```

#### Optional: Show Voice Generation Success

```typescript
{
  success && (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <p className="text-green-600 font-medium">
        {responseData?.customVoice
          ? "Persona created with custom voice!"
          : "Persona created successfully!"}
      </p>
      {responseData?.voiceDescription && (
        <p className="text-xs text-gray-500 mt-2">
          Voice: {responseData.voiceDescription}
        </p>
      )}
    </div>
  );
}
```

---

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                               │
│    User types: "Elon Musk"                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EXA.AI RESEARCH                                          │
│    • Searches for "Elon Musk"                               │
│    • Returns 20 articles, interviews, tweets                │
│    • Extracts 2000 chars of content                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GROQ AI ANALYSIS                                         │
│    Analyzes content and returns:                            │
│    {                                                        │
│      styleBullets: ["First principles thinker", ...],       │
│      taboo: ["Short-term thinking", ...],                   │
│      systemPrompt: "You are Elon Musk...",                  │
│      gender: "male",                                        │
│      voiceDescription: "middle-aged male with South         │
│        African-American accent, confident and technical     │
│        tone, fast delivery",                                │
│      sampleText: "When something is important enough,       │
│        you do it even if the odds are not in your favor"    │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ELEVENLABS VOICE GENERATION                              │
│    POST /api/elevenlabs/generate-voice                      │
│    {                                                        │
│      voiceDescription: "middle-aged male...",               │
│      previewText: "When something is important...",         │
│      gender: "male"                                         │
│    }                                                        │
│                                                             │
│    ↓ ElevenLabs processes (5-10 seconds)                    │
│                                                             │
│    Returns: { voice_id: "abc123xyz456" }                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SAVE TO DATABASE                                         │
│    INSERT INTO personas (                                   │
│      slug: "elon-musk",                                     │
│      name: "Elon Musk",                                     │
│      voice_id: "abc123xyz456",  ← Custom generated!         │
│      ...                                                    │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. USER EXPERIENCE                                          │
│    • Persona appears in list                                │
│    • User starts chatting                                   │
│    • AI responds as Elon                                    │
│    • TTS uses custom voice that sounds like Elon! 🎤        │
└─────────────────────────────────────────────────────────────┘
```

---

## Fallback Strategy (3-Tier)

### Tier 1: Custom Generated Voice ⭐

- **When**: Voice generation succeeds
- **Result**: Unique voice matching person's characteristics
- **Best for**: Production with ElevenLabs Creator plan

### Tier 2: Gender-Based Fallback

- **When**: Voice generation fails (plan limitation, API error)
- **Result**: Female → Sherry's voice, Male → Roger's voice
- **Best for**: Development, free tier users

### Tier 3: System Default

- **When**: Everything fails
- **Result**: ElevenLabs default voice
- **Best for**: Emergency fallback

---

## Testing Guide

### Test 1: Successful Custom Voice Generation

```bash
# Prerequisites:
# - ElevenLabs Creator plan ($22/mo)
# - ELEVEN_API_KEY set in .env.local
# - GROQ_API_KEY set in .env.local
# - EXA_API_KEY set in .env.local

# Steps:
1. Start dev server: npm run dev
2. Open http://localhost:3000/landing
3. Click "Create Persona"
4. Enter name: "Tim Ferriss"
5. Click "Create Persona"
6. Wait 10-15 seconds

# Expected Console Output:
[Persona Creation] Building persona from Exa...
[Persona Creation] Detected gender from Groq: male
[Persona Creation] 🎤 Attempting custom voice generation...
[Persona Creation] Voice description: middle-aged male with American accent, analytical and confident tone, moderate delivery
[Persona Creation] Sample text: The question you should be asking isn't who am I, but who do I want to become?
[Voice Gen] Generating custom voice...
[Voice Gen] Step 1: Designing voice...
[Voice Gen] ✅ Voice generated successfully! ID: xyz123abc456
[Persona Creation] ✅ Custom voice generated successfully!
[Persona Creation] Voice ID: xyz123abc456
[Persona Creation] Final voice assignment: xyz123abc456 (custom)

# Verify:
- Persona appears in list
- Chat with persona
- Click voice button to hear TTS
- Voice should sound appropriate for Tim Ferriss
```

### Test 2: Fallback to Gender-Based Voice

```bash
# Prerequisites:
# - ElevenLabs FREE tier (no voice generation)
# - All API keys set

# Steps:
1-5. Same as Test 1

# Expected Console Output:
[Persona Creation] Building persona from Exa...
[Persona Creation] 🎤 Attempting custom voice generation...
[Voice Gen] Generating custom voice...
[Voice Gen] Design API error: 403 {"detail":"Voice generation requires a higher ElevenLabs plan"}
[Persona Creation] ⚠️ Voice generation not available (plan limitation)
[Persona Creation] Using gender-based fallback voice
[Persona Creation] Final voice assignment: CwhRBWXzGAHq8TQ4Fs17 (fallback)

# Verify:
- Persona still created successfully
- Uses Roger's voice (male default)
- Everything else works normally
```

### Test 3: Female Persona

```bash
# Test with a female public figure
# Enter name: "Oprah Winfrey"

# Expected:
[Persona Creation] Detected gender from Groq: female
[Persona Creation] Voice description: mature female with American accent, warm and enthusiastic tone, moderate delivery
[Voice Gen] ✅ Voice generated successfully!
# OR fallback to Sherry's voice if no Creator plan

# Verify voice sounds appropriate for Oprah
```

---

## Debugging

### Check Groq Response

Add temporary logging in `buildPersonaFromExa()`:

```typescript
const personaData = JSON.parse(groqData.choices[0].message.content);
console.log(
  "[Groq Analysis] Full response:",
  JSON.stringify(personaData, null, 2)
);
```

Look for:

- ✅ `voiceDescription` is present and well-formed
- ✅ `sampleText` is 100-150 characters
- ✅ `gender` is detected correctly

### Check Voice Generation Call

```typescript
// In create/route.ts, log the request:
console.log("[Voice Gen Request]", {
  voiceDescription: personaData.voiceDescription,
  previewText: personaData.sampleText,
  gender: selectedGender,
});
```

### Check ElevenLabs API Response

```typescript
// In generate-voice/route.ts:
console.log("[Voice Gen] ElevenLabs response:", await designResponse.json());
```

### Common Issues

#### Issue 1: Groq doesn't return voice characteristics

**Cause**: Prompt wasn't updated correctly  
**Fix**: Ensure system prompt includes section 7 (VOICE CHARACTERISTICS)

#### Issue 2: Voice generation returns 403

**Cause**: ElevenLabs free tier doesn't support voice generation  
**Fix**: Upgrade to Creator plan or use fallback (it's working as designed)

#### Issue 3: Voice generation times out

**Cause**: ElevenLabs API can be slow (10-15 seconds)  
**Fix**: Increase timeout or show better loading UI

#### Issue 4: Generated voice doesn't match expectations

**Cause**: Groq's voice description may be generic  
**Fix**: Improve Groq prompt with more specific examples

#### Issue 5: NEXT_PUBLIC_BASE_URL not defined

**Cause**: Environment variable missing in production  
**Fix**: Set in Vercel environment variables or use VERCEL_URL

---

## Performance Metrics

| Step             | Time      | Cacheable?           |
| ---------------- | --------- | -------------------- |
| Exa Research     | 2-3s      | Yes (by query)       |
| Groq Analysis    | 1-2s      | Yes (by content)     |
| Voice Generation | 5-10s     | Yes (by description) |
| Database Save    | <1s       | No                   |
| **Total**        | **8-15s** | Partial              |

### Optimization Ideas

1. **Cache Groq Responses**: Store voice descriptions by person name
2. **Parallel Processing**: Run voice generation while saving persona
3. **Background Jobs**: Generate voice async, update persona later
4. **Pre-generate Common Personas**: Cache voices for popular figures

---

## Production Considerations

### 1. Environment Variables

```bash
# Required for full functionality
ELEVEN_API_KEY=sk_xxx                 # Creator plan or higher
EXA_API_KEY=xxx                       # For persona research
GROQ_API_KEY=gsk_xxx                  # For AI analysis

# Production deployment
NEXT_PUBLIC_BASE_URL=https://your-domain.com
VERCEL_URL=your-domain.vercel.app     # Auto-set by Vercel
```

### 2. Error Handling

- ✅ Graceful fallback to gender-based voices
- ✅ User-friendly error messages
- ✅ Detailed console logging for debugging
- ✅ Timeout handling for slow APIs

### 3. Cost Management

**ElevenLabs Voice Generation**:

- Creator Plan: $22/month
- 30 custom voices per month included
- $0.50 per additional voice

**Strategy**:

- Cache generated voices
- Reuse voices for similar personas
- Show warning when approaching limit

### 4. Rate Limiting

Consider adding rate limiting to prevent abuse:

```typescript
// Example: Max 5 persona creations per user per day
const MAX_CREATIONS_PER_DAY = 5;
```

### 5. Voice Management

Consider building an admin panel to:

- View all generated voices
- Listen to voice samples
- Manually assign voices
- Delete unused voices
- Monitor voice generation usage

---

## Success Metrics

### KPIs to Track

1. **Voice Generation Success Rate**

   - Target: >80% for Creator plan users
   - Fallback: <20% for free tier users

2. **Voice Quality Score**

   - User rating: 4+ stars
   - Voice matches persona: >90%

3. **Performance**

   - Total persona creation: <15s
   - Voice generation: <10s

4. **Cost Efficiency**
   - Avg cost per persona: <$0.50
   - Voice reuse rate: >30%

---

## Future Enhancements

### Phase 1: Basic Improvements

- [ ] Add voice preview before saving persona
- [ ] Allow manual voice regeneration
- [ ] Cache voice descriptions to speed up retries
- [ ] Add progress indicators for each step

### Phase 2: Advanced Features

- [ ] Voice cloning from audio samples
- [ ] Multiple voice variations per persona
- [ ] Voice fine-tuning parameters (stability, clarity, style)
- [ ] A/B testing for voice descriptions

### Phase 3: Enterprise Features

- [ ] Bulk persona creation
- [ ] Voice library management
- [ ] Custom voice training
- [ ] Analytics dashboard for voice usage

---

## Conclusion

This integration completes the vision of fully automated, intelligent persona creation:

1. **User enters a name** → Simple input
2. **System researches the person** → Exa.ai finds content
3. **AI analyzes personality AND voice** → Groq extracts everything
4. **Custom voice is generated** → ElevenLabs creates unique voice
5. **User chats with realistic persona** → Complete experience

**Total implementation time**: 2-3 hours  
**Complexity**: Medium  
**Impact**: High - makes personas feel much more authentic

**The magic**: Users just type a name, and the system creates a fully-voiced AI persona that sounds like the real person. 🎤✨
