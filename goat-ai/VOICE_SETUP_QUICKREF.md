# Voice Mapping Quick Reference

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Get Sherry's Voice ID from ElevenLabs
```
1. Go to: https://elevenlabs.io/
2. Login → "Voices" tab
3. Find/Clone Sherry's voice
4. Copy the Voice ID (e.g., 21m00Tcm4TlvDq8ikWAM)
```

### 2️⃣ Run Database Migrations
```bash
# In Supabase SQL Editor, run these files in order:
# 1. supabase/migrations/0002_add_voice_id.sql
# 2. Edit 0003_update_sherry_voice.sql with actual voice ID
# 3. Run supabase/migrations/0003_update_sherry_voice.sql
```

### 3️⃣ Update Voice ID (Alternative - Direct Update)
```bash
# Option A: Use helper script
node scripts/update-voice-id.js sherryjiang YOUR_VOICE_ID

# Option B: Direct SQL in Supabase
UPDATE personas 
SET voice_id = 'YOUR_VOICE_ID' 
WHERE slug = 'sherryjiang';
```

---

## 🧪 Test It

```bash
npm run dev
# Navigate to http://localhost:3000
# Select Sherry's persona
# Send a message
# Listen to response in Sherry's voice
```

---

## 📚 Full Documentation

See `docs/VOICE_MAPPING_SETUP.md` for:
- Complete setup guide
- Voice consent & ethics guidelines
- Troubleshooting tips
- API reference
- Testing checklist

---

## 🔑 Important Voice IDs

| Persona | Voice ID | Status |
|---------|----------|--------|
| Sherry Jiang | `Qv0aP47SJsL43Pn6x7k9` | ✅ Configured |
| Default Voice | `21m00Tcm4TlvDq8ikWAM` | ✅ Active |

---

## ⚠️ Consent Checklist

Before using a voice:
- [ ] Explicit written consent obtained
- [ ] Purpose clearly communicated
- [ ] Voice samples properly licensed
- [ ] Attribution/disclosure plan in place

---

## 🆘 Troubleshooting

**Voice doesn't change?**
```sql
-- Check if voice_id is set
SELECT slug, name, voice_id FROM personas WHERE slug = 'sherryjiang';
```

**"Voice not found" error?**
- Verify voice ID exists in ElevenLabs dashboard
- Check API key has access to the voice
- Ensure voice isn't deleted or archived

---

**Need Help?** Check console logs, verify .env.local has ELEVEN_API_KEY set.

