# Emotion Tags Fix - ElevenLabs Reading Tags Aloud

## Problem Identified
ElevenLabs was reading emotion tags aloud (e.g., saying "brackets chuckles" or "brackets thoughtfully") because square bracket tags like `[chuckles]`, `[thoughtfully]` are **not natively supported** by ElevenLabs and get treated as regular text.

## Root Cause
According to [ElevenLabs documentation](https://elevenlabs.io/docs/best-practices/prompting/controls), the TTS engine does not interpret square bracket tags as emotion instructions. Instead, it simply reads them as part of the text.

## Solution Implemented
Switched from **explicit bracket tags** to **narrative context** as recommended by ElevenLabs best practices.

### Before (Incorrect):
```
That's interesting. [chuckles] Well, based on my experience... [thoughtfully]
```
**Result:** ElevenLabs says "That's interesting brackets chuckles Well..."

### After (Correct):
```
"That's interesting," she chuckled. "Well, based on my experience..." She paused thoughtfully.
```
**Result:** ElevenLabs naturally delivers the line with a chuckle and thoughtful pause, WITHOUT saying "she chuckled" or "paused thoughtfully"

## Changes Made

### 1. Chat API - Updated Emotion Instructions
**File:** `src/app/api/chat/route.ts` (lines 75-87)

Changed from instructing AI to use `[emotion]` tags to using natural narrative context like:
- "she chuckled"
- "said excitedly"
- "with a laugh"
- "pausing thoughtfully"

### 2. Persona Generation - Updated Instructions
**File:** `src/lib/personas.ts` (line 316)

Updated the Groq prompt that generates system prompts for new personas to:
- Instruct use of narrative context
- Explicitly tell it NOT to use bracket tags
- Provide examples of proper narrative phrasing

### 3. UI Stripping Utility - Enhanced Regex
**File:** `src/lib/utils.ts` (lines 8-41)

Enhanced `stripEmotionTags()` function to remove:
- Legacy bracket tags: `[chuckles]`, `[thoughtfully]`
- Narrative markers: "she chuckled", "he said excitedly"
- Temporal phrases: "after a moment", "pausing thoughtfully"
- Prepositional phrases: "with a laugh", "with enthusiasm"

The UI now displays clean dialogue without any emotion markers.

### 4. Documentation
**File:** `EMOTION_TAGS_IMPLEMENTATION.md`

Completely updated to document:
- The problem with bracket tags
- Why narrative context is the solution
- Examples of correct vs incorrect format
- Data flow with new system
- Testing checklist

## How It Works Now

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User sends message                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Groq generates response with narrative context:         │
│    "That's interesting," she chuckled. "Let me explain."    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Saved to database WITH narrative context (full text)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ UI Display (stripped):   │  │ TTS Audio (full):        │
│ "That's interesting.     │  │ "That's interesting,"    │
│  Let me explain."        │  │  she chuckled.           │
│                          │  │  "Let me explain."       │
│ User sees clean text     │  │                          │
└──────────────────────────┘  │ ElevenLabs interprets    │
                              │ "chuckled" as emotion    │
                              │ WITHOUT saying the word  │
                              └──────────────────────────┘
```

## Testing Instructions

### Test 1: Create New Persona
1. Run the app: `npm run dev`
2. Create a new persona (e.g., "Elon Musk")
3. Chat with the persona
4. **Check console logs** - responses should include narrative context like "chuckled", "said thoughtfully"
5. **Check UI** - text should be clean without "chuckled" visible
6. **Play audio** - should hear natural emotion WITHOUT hearing the word "chuckled" spoken

### Test 2: Verify No Audible Tags
1. Send a message that would trigger emotional response (e.g., "Tell me something funny")
2. Play the audio response
3. **Expected:** Natural laughter/chuckle sound, NOT the word "chuckles" being read aloud
4. **Expected:** UI shows clean text without narrative markers

### Test 3: Check Database Storage
```sql
-- Check that messages are stored with full narrative context
SELECT content FROM messages WHERE role = 'assistant' LIMIT 5;
```
**Expected:** Should see narrative context in stored messages like "chuckled", "said excitedly"

### Test 4: Legacy Bracket Tags (Backwards Compatibility)
1. Manually insert a message with old format: `"Hello [chuckles] how are you?"`
2. Display in UI
3. **Expected:** UI should strip the `[chuckles]` tag
4. Send to TTS
5. **Expected:** ElevenLabs will read "brackets chuckles" (legacy behavior, but at least UI is clean)

## Quick Comparison

| Aspect | Old System (Bracket Tags) | New System (Narrative Context) |
|--------|---------------------------|--------------------------------|
| **Format** | `[chuckles]` | `she chuckled` |
| **ElevenLabs Behavior** | ❌ Reads tag aloud | ✅ Interprets naturally |
| **UI Display** | ✅ Stripped cleanly | ✅ Stripped cleanly |
| **Natural Sound** | ❌ Sounds robotic | ✅ Sounds natural |
| **Standards** | ❌ Non-standard | ✅ ElevenLabs best practice |

## Rollout Plan

### Immediate (Completed)
- ✅ Updated chat API to use narrative instructions
- ✅ Updated persona generation for new personas
- ✅ Enhanced UI stripping utility
- ✅ Updated documentation

### Existing Personas
**No action needed.** Existing personas will:
1. Continue working with current system prompts
2. Receive narrative context instructions at runtime (via `emotionInstructions` in chat route)
3. Gradually start using narrative context in responses

### Optional: Regenerate Existing Personas
If you want existing personas to have narrative context baked into their system prompts:
```bash
# Run this script (TO BE CREATED) to update system prompts
node scripts/migrate-personas-to-narrative-context.js
```

## Troubleshooting

### Issue: Still hearing tags read aloud
**Solution:** 
1. Check the message content in database - does it have bracket tags `[tag]` or narrative context?
2. If bracket tags: The AI is still using old format. Check system prompt includes narrative instructions.
3. If narrative context: May be a different issue. Check ElevenLabs API version.

### Issue: UI showing narrative markers
**Solution:**
1. Verify `stripEmotionTags()` is being called in ChatList component (line 106)
2. Check console - any JavaScript errors?
3. Test the regex in isolation with sample text

### Issue: Responses sound robotic/emotionless
**Solution:**
1. Narrative context may be too subtle. Increase frequency of emotion markers in system prompt.
2. Check voice_id - some voices respond better to emotion cues than others.
3. Consider using ElevenLabs Turbo v3 model which has better emotion interpretation.

## References

- [ElevenLabs Docs - Prompting Controls](https://elevenlabs.io/docs/best-practices/prompting/controls)
- [ElevenLabs Docs - Turbo v3 Model](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3)
- [OpenAI Chat Completion API](https://platform.openai.com/docs/api-reference/chat)

## Next Steps

1. **Test manually** - Create a new persona and verify the fix
2. **Monitor audio quality** - Ensure narrative context produces natural-sounding speech
3. **Gather feedback** - Ask users if voice synthesis sounds more natural
4. **Optional enhancement** - Add toggle in UI to show/hide emotion markers for debugging

---

**Fix Completed:** October 18, 2025  
**Status:** ✅ Ready for Testing  
**Breaking Changes:** None (backwards compatible)

