# Emotion Tags Testing Guide

## Quick Test Checklist

### 1. Create New Persona (Tests Emotion Tag Instructions)
```bash
# In your browser:
1. Go to landing page
2. Click "Create Persona" button
3. Enter name: "Test Persona"
4. Optional query: "tech entrepreneur"
5. Select gender: male or female
6. Submit and wait for creation

# Verify:
- ✅ Persona created successfully
- ✅ Check database: persona should have description field populated
- ✅ System prompt should mention using emotion tags
```

### 2. Start Chat (Tests Style Bullets & Taboo Integration)
```bash
# In browser:
1. Select your newly created persona
2. Click "Start Chat"

# Check browser console for:
- System prompt should include:
  * Base persona prompt
  * "Communication Style:" section with bullets
  * "Topics to Avoid:" section with taboo items
  * "IMPORTANT: Use emotion/delivery tags..." instruction
```

### 3. Send Message (Tests Emotion Tag Generation)
```bash
# In chat:
1. Type any question: "What do you think about AI?"
2. Send message
3. Wait for response

# Verify in browser DevTools:
- Open Network tab
- Find POST to /api/chat
- Check response - should include text with emotion tags like:
  "Well, that's interesting. [thoughtfully] I believe..."
```

### 4. Check UI Display (Tests Tag Stripping)
```bash
# In chat interface:
- Look at the displayed message
- Should be clean text WITHOUT brackets
- Example: "Well, that's interesting. I believe..."
- NOT: "Well, that's interesting. [thoughtfully] I believe..."
```

### 5. Check Database (Tests Tag Preservation)
```bash
# Using Supabase dashboard or psql:
SELECT content FROM messages WHERE role = 'assistant' ORDER BY created_at DESC LIMIT 1;

# Verify:
- Content should include emotion tags: "[thoughtfully]", "[chuckles]", etc.
- Full original text preserved for TTS processing
```

### 6. Test TTS Audio (Tests Tag Delivery)
```bash
# In chat:
1. Click play button on assistant message with audio
2. Listen carefully to voice

# What to listen for:
- Vocal inflections matching emotion tags
- Pauses where [pauses] appears
- Tone changes matching [sarcastically], [excitedly], etc.
- Laughter/chuckles where [giggles], [chuckles] appear
```

## Expected Results

### Good Response Example:
```
Database stores:
"That's a great question! [excitedly] I've been thinking about this a lot. 
[thoughtfully] You see, the key is... [pauses] well, it's all about balance. 
[chuckles] But let me explain..."

UI displays:
"That's a great question! I've been thinking about this a lot. 
You see, the key is... well, it's all about balance. But let me explain..."

Audio: 
- Excited tone on first sentence
- Thoughtful pause before "You see"
- Brief silence at [pauses]
- Light laughter at "But let me explain"
```

## Common Issues & Solutions

### Issue: No emotion tags in responses
**Solution:** Check that:
- Persona was created AFTER the emotion tag update
- System prompt includes emotion instruction
- Groq API is responding (check Network tab)

### Issue: Tags visible in UI
**Solution:** Check that:
- `stripEmotionTags()` is imported in ChatList.tsx
- Function is applied to message.content
- No linter errors in ChatList component

### Issue: Audio sounds flat/monotone
**Solution:** 
- ElevenLabs may need specific tag format
- Try regenerating persona with clearer emotion examples
- Check that TTS API receives full text with tags

### Issue: Style bullets not appearing
**Solution:** Check that:
- Database has style_bullets field populated
- Chat API query includes `style_bullets` in SELECT
- System prompt builder includes styleContext

## Manual Test Script

### Complete Flow Test (5 minutes)
```
[0:00] Open landing page
[0:10] Create new persona: "Albert Einstein"
[0:30] Wait for persona creation
[0:40] Click persona card
[0:45] Click "Start Chat"
[0:50] Type: "What is your view on quantum mechanics?"
[0:55] Click Send
[1:00] Wait for response
[1:05] ✅ Verify response appears (without tags)
[1:10] ✅ Click audio play button
[1:15] ✅ Listen for emotion in voice
[2:00] Open DevTools → Network
[2:05] Send another message
[2:10] ✅ Check /api/chat response has tags
[2:20] Open DevTools → Application → IndexedDB or Supabase dashboard
[2:30] ✅ Check message content includes tags
[2:40] Switch persona: type "@warrenbuffett"
[2:45] ✅ Verify style bullets are different
[2:50] Send message to Warren
[3:00] ✅ Verify different communication style
[3:30] Type: "Should I day trade?"
[3:35] ✅ Verify taboo topic is handled appropriately
[4:00] Test complete ✅
```

## Automated Test Ideas (Future)

```typescript
// test/emotion-tags.spec.ts
test('AI response includes emotion tags', async ({ page }) => {
  // Send message
  // Intercept /api/chat response
  // Assert response.text includes regex /\[[\w\s]+\]/
});

test('UI displays clean text without tags', async ({ page }) => {
  // Send message and wait for response
  // Get message element text content
  // Assert NO brackets in displayed text
});

test('Database preserves emotion tags', async ({ page }) => {
  // Send message
  // Query Supabase directly
  // Assert message.content includes emotion tags
});

test('Style bullets appear in system prompt', async ({ page }) => {
  // Intercept /api/chat request
  // Assert system message includes "Communication Style:"
});
```

## Performance Benchmarks

Track these metrics:
- Persona creation time: Target <10s
- Message send → response display: Target <5s total
  - STT: ~1-2s
  - LLM (with emotion generation): ~1.5-2.5s
  - TTS: ~1.5-2s
- Tag stripping: Should be <1ms (negligible)

## Browser Console Commands

```javascript
// Check if emotion tags utility exists
console.log(typeof stripEmotionTags);

// Test emotion tag stripping
const text = "Hello [thoughtfully] there [chuckles]";
console.log(stripEmotionTags(text)); // Should output: "Hello there"

// View last message with tags
const lastMessage = document.querySelector('[role="assistant"]').textContent;
console.log(lastMessage);
```

## Rollback Plan

If emotion tags cause issues:

1. **Disable emotion instructions only:**
   - Comment out `emotionInstructions` in `/api/chat/route.ts`
   - Keep style bullets and taboo functionality

2. **Disable tag stripping:**
   - Remove `stripEmotionTags()` call in `ChatList.tsx`
   - Tags will be visible but system still works

3. **Full rollback:**
   - Revert changes to `/api/chat/route.ts`
   - Revert changes to `/lib/personas.ts`
   - Keep utility function (harmless)

## Success Criteria

- ✅ New personas include emotion tag instructions
- ✅ Chat responses include emotion tags in database
- ✅ UI displays clean text without tags
- ✅ TTS audio has improved expressiveness
- ✅ Style bullets guide conversation style
- ✅ Taboo topics are appropriately avoided
- ✅ No linting errors
- ✅ No performance degradation

---

**Status:** Ready for testing
**Created:** October 18, 2025
**Last Updated:** October 18, 2025

