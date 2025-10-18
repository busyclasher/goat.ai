# Troubleshooting Profile Pictures / Avatars

## Quick Diagnostics

### 1. Test the Image Search API
```bash
node scripts/test-image-search.js "Person Name"
```

This will verify:
- ✅ API credentials are configured
- ✅ Google Custom Search API is accessible
- ✅ Images can be found

### 2. Check Environment Variables

**Correct format:**
```bash
GOOGLE_SEARCH_API_KEY=AIzaSy...
GOOGLE_SEARCH_ENGINE_ID=629996c02aa6d49fb
```

**Common mistakes:**
```bash
# ❌ Wrong - includes full URL
GOOGLE_SEARCH_ENGINE_ID=https://cse.google.com/cse.js?cx=629996c02aa6d49fb

# ✅ Correct - just the ID
GOOGLE_SEARCH_ENGINE_ID=629996c02aa6d49fb
```

### 3. Check Server Logs

When creating a persona, look for these logs:
```
[Persona Creation] Building persona from Exa...
[Image Search] Fetching image for: [Name]
[Image Search] Found image: [URL]          // ✅ Success
```

If you see:
```
[Image Search] Google Search API credentials not configured  // ❌ Missing credentials
[Image Search] No images found for: [Name]                   // ⚠️ Person not found
[Image Search] API error: 403                                 // ❌ Invalid credentials
```

## Common Issues

### Issue 1: "API credentials not configured"

**Solution:**
1. Ensure `.env.local` has both variables set
2. Restart dev server: `npm run dev`
3. Verify variables are loaded: check server startup logs

### Issue 2: "API error: 403 Forbidden"

**Causes:**
- Invalid API key
- API key restrictions are too strict
- Custom Search API not enabled

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Check "APIs & Services" → "Credentials"
3. Verify API key restrictions allow "Custom Search API"
4. Ensure "Custom Search API" is enabled in "APIs & Services" → "Library"

### Issue 3: "API error: 429 Too Many Requests"

**Cause:** Exceeded free tier quota (100 searches/day)

**Solution:**
- Wait 24 hours for quota reset
- Upgrade to paid tier
- Use existing personas without creating new ones

### Issue 4: "No images found"

**Cause:** Person name is not well-known or misspelled

**Solution:**
- Use more famous/searchable names
- Add context in the "Additional Context" field
- Verify spelling of person's name

### Issue 5: Next.js Image Configuration Error

**Error Message:**
```
Invalid src prop (...) on `next/image`, hostname "..." is not configured under images in your `next.config.js`
```

**Cause:** Next.js requires external image domains to be explicitly allowed for security.

**Solution:**
1. The `next.config.ts` file has been updated to allow common image hosting domains
2. If you see this error, restart your dev server:
```bash
# Kill any running servers
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill

# Start fresh
npm run dev
```

3. The config now includes:
   - Wikipedia (upload.wikimedia.org)
   - Google image services
   - Wildcard for any HTTPS domain (`**`)

**Note:** The wildcard `hostname: '**'` allows all HTTPS images, which is safe since we're only displaying profile pictures from Google's trusted search API.

### Issue 6: Images load but don't display

**Causes:**
- CORS issues with image host
- Image URL is broken/expired
- Browser blocking mixed content (HTTP images on HTTPS site)

**Solution:**
1. Check browser console for errors
2. Verify the image URL works directly in browser
3. Ensure images are served over HTTPS (HTTP images will be blocked)
4. Try a different person name if the specific image is problematic

### Issue 7: Wrong Search Engine ID format

**Problem:** Using full URL instead of ID

**Check:**
```bash
grep GOOGLE_SEARCH_ENGINE_ID .env.local
```

**Should show:**
```
GOOGLE_SEARCH_ENGINE_ID=629996c02aa6d49fb
```

**NOT:**
```
GOOGLE_SEARCH_ENGINE_ID=https://cse.google.com/cse.js?cx=629996c02aa6d49fb
```

**Fix:**
```bash
# Extract just the ID (the part after 'cx=')
# Edit .env.local and update GOOGLE_SEARCH_ENGINE_ID=<just_the_id>
```

## Fallback Behavior

If image search fails for any reason:
- ✅ Persona creation still succeeds
- ✅ Initials-based avatar is shown instead
- ✅ No user-facing errors

This ensures the feature never blocks persona creation.

## Environment Variable Reference

```bash
# Required for image search (optional feature)
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXA_API_KEY=your_exa_api_key
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## Setup Guide

For full setup instructions, see: [GOOGLE_IMAGE_SEARCH_SETUP.md](../GOOGLE_IMAGE_SEARCH_SETUP.md)

## Testing Checklist

After fixing avatar issues:

1. ✅ Run test script: `node scripts/test-image-search.js "Test Name"`
2. ✅ Restart dev server
3. ✅ Create a new persona with a well-known name
4. ✅ Check server logs for image search messages
5. ✅ Verify avatar appears on landing page
6. ✅ Check avatar appears in persona selector during chat

## Quick Fixes

### Restart dev server
```bash
# Kill existing server
lsof -ti:3000 | xargs kill

# Start fresh
npm run dev
```

### View environment variables (server-side)
Check server startup logs for:
```
[Image Search] Fetching image for: ...
```

### Test with curl
```bash
API_KEY="your_key"
ENGINE_ID="your_engine_id"
NAME="Elon Musk"

curl "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${ENGINE_ID}&q=${NAME}%20profile&searchType=image&num=1"
```

## Need Help?

1. Run the test script: `node scripts/test-image-search.js`
2. Check this troubleshooting guide
3. Review server logs during persona creation
4. Verify all environment variables are set correctly

