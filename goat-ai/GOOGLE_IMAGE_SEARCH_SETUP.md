# Google Image Search Setup

## Overview
The persona creation feature automatically fetches profile images using Google Custom Search API.

## Setup Instructions

### 1. Enable Google Custom Search API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"

### 2. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. (Optional but recommended) Restrict the key to only "Custom Search API"

### 3. Create Custom Search Engine
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. Configuration:
   - **Sites to search**: Select "Search the entire web"
   - **Name**: "Persona Image Search" (or any name)
4. After creation, click "Control Panel"
5. In "Setup" → "Basics":
   - Enable "Image search"
   - Enable "Search the entire web"
6. Copy the **Search engine ID** (cx parameter)

### 4. Add Environment Variables
Add these to your `.env.local` file:

```bash
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 5. Restart Development Server
```bash
npm run dev
```

## Pricing
- **Free tier**: 100 search queries per day
- **Paid tier**: $5 per 1,000 queries after free tier
- [Pricing details](https://developers.google.com/custom-search/v1/overview#pricing)

## Testing
Create a new persona through the UI - you should see:
1. Console log: `[Image Search] Fetching image for: [Name]`
2. Console log: `[Image Search] Found image: [URL]` (if successful)
3. Avatar displayed in chat interface

## Troubleshooting

### No image found
- Check that the person's name is well-known
- Verify API credentials are correct
- Check daily quota hasn't been exceeded

### API errors
- Verify API key is valid and not restricted incorrectly
- Ensure Custom Search API is enabled in Google Cloud Console
- Check Search Engine ID is correct

### Fallback behavior
If image search fails for any reason, the persona will still be created successfully with an initial-based avatar fallback. This ensures persona creation never fails due to image issues.

