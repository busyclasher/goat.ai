# Voice Mapping Setup Guide

This guide explains how to set up persona-specific voices using ElevenLabs voice cloning.

## Overview

The voice mapping feature allows each persona to have their own unique voice for text-to-speech (TTS). This is particularly important for personas based on real people (like Sherry) who have consented to voice cloning.

## Architecture

### Database Schema
- Added `voice_id` column to `personas` table (VARCHAR 100, nullable)
- If `voice_id` is NULL, the system uses ElevenLabs default voice
- If specified, TTS API uses the persona's unique voice

### API Flow
1. Chat page sends message to `/api/chat` (Groq LLM)
2. LLM generates response text
3. Chat page sends text + persona's `voice_id` to `/api/tts`
4. TTS API generates audio using specified voice
5. Audio plays back in chat interface

## Setup Instructions

### Step 1: Get Sherry's ElevenLabs Voice ID

You need to obtain or create Sherry's voice in ElevenLabs:

#### Option A: Use Existing Voice
1. Log into ElevenLabs dashboard: https://elevenlabs.io/
2. Go to "Voices" section
3. Find Sherry's voice (if already cloned)
4. Copy the Voice ID (format: `21m00Tcm4TlvDq8ikWAM`)

#### Option B: Clone New Voice
1. Log into ElevenLabs dashboard
2. Navigate to "Voice Lab" → "Instant Voice Cloning"
3. Upload at least 1 minute of clear audio samples of Sherry's voice
4. **IMPORTANT**: Ensure you have explicit consent from Sherry
5. Name the voice (e.g., "Sherry Jiang")
6. Copy the generated Voice ID

### Step 2: Run Database Migrations

Run the migration files in order:

```bash
# 1. Add voice_id column to personas table
# In Supabase SQL Editor, run:
# supabase/migrations/0002_add_voice_id.sql

# 2. Update Sherry's persona with voice ID
# First, edit the migration file and replace 'YOUR_ELEVENLABS_VOICE_ID_HERE'
# with Sherry's actual voice ID, then run:
# supabase/migrations/0003_update_sherry_voice.sql
```

**Using Supabase CLI:**
```bash
# If using Supabase CLI locally
supabase db push
```

**Using Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to "SQL Editor"
3. Open and run `0002_add_voice_id.sql`
4. Edit `0003_update_sherry_voice.sql` with actual voice ID
5. Run `0003_update_sherry_voice.sql`

### Step 3: Update Voice ID Directly (Alternative)

If you prefer to update the voice ID directly via SQL:

```sql
-- Update Sherry's voice ID
UPDATE personas 
SET voice_id = 'YOUR_ACTUAL_VOICE_ID_HERE'
WHERE slug = 'sherry-jiang';
```

### Step 4: Verify Setup

Test the voice mapping:

1. Start your dev server: `npm run dev`
2. Navigate to chat and select Sherry's persona
3. Send a message
4. Listen to the audio response - it should use Sherry's voice

## Adding Voice Mapping to Other Personas

To add custom voices for other personas:

```sql
-- Update any persona with a voice ID
UPDATE personas 
SET voice_id = 'ELEVENLABS_VOICE_ID'
WHERE slug = 'persona-slug';
```

## Default Voices

If a persona doesn't have a `voice_id` set, the TTS API will use the default ElevenLabs voice (`21m00Tcm4TlvDq8ikWAM`).

## Voice Consent & Ethics

**IMPORTANT**: Only use voice cloning for:
- Public figures where voice synthesis is clearly identified
- Individuals who have provided explicit written consent
- Personas where you have obtained proper authorization

Always:
- ✅ Get explicit written consent before cloning someone's voice
- ✅ Clearly indicate when voice is AI-generated
- ✅ Respect privacy and consent boundaries
- ❌ Never clone voices without permission
- ❌ Never use voices to mislead or deceive

## Troubleshooting

### Voice doesn't change
- Check that `voice_id` is correctly set in database
- Verify voice ID is valid in ElevenLabs dashboard
- Check browser console for TTS API errors
- Ensure ElevenLabs API key has access to the voice

### "Voice not found" error
- Verify the voice ID exists in your ElevenLabs account
- Check that the voice isn't deleted or archived
- Confirm API key has permission to access the voice

### Audio quality issues
- Ensure voice samples were high quality during cloning
- Check ElevenLabs voice settings (stability, similarity)
- Consider re-cloning with better audio samples

## API Reference

### TTS API Request Format
```typescript
POST /api/tts
Content-Type: application/json

{
  "text": "Hello, this is a test message",
  "voiceId": "21m00Tcm4TlvDq8ikWAM"  // Optional, uses default if not provided
}
```

### Response Format
```typescript
{
  "audioUrl": "data:audio/mpeg;base64,..."
}
```

## Files Modified

- ✅ `/supabase/migrations/0002_add_voice_id.sql` - Add voice_id column
- ✅ `/supabase/migrations/0003_update_sherry_voice.sql` - Seed Sherry's data
- ✅ `/src/lib/supabase.ts` - Updated Persona type with voice_id
- ✅ `/src/app/api/tts/route.ts` - Accept and use voiceId parameter
- ✅ `/src/app/chat/page.tsx` - Pass persona.voice_id to TTS API

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Sherry's voice_id is set in database
- [ ] Chat page loads Sherry's persona without errors
- [ ] Sending message generates audio response
- [ ] Audio plays in Sherry's voice (not default voice)
- [ ] Other personas still work with default voice
- [ ] Error handling works if voice_id is invalid

## Next Steps

After setting up Sherry's voice:
1. Test full conversation flow with voice
2. Gather feedback on voice quality
3. Consider adding voice mapping to other key personas
4. Document voice IDs in secure location
5. Update demo script to showcase voice features

---

**Questions?** See main README.md or check docs/progress.md for project status.

