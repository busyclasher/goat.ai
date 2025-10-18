import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips emotion tags and narrative context markers from text for clean UI display
 * - Removes square bracket tags: [chuckles], [thoughtfully], etc.
 * - Removes narrative context: "she said", "he chuckled", etc.
 * - Keeps quoted dialogue and main content
 * Tags/context are preserved for TTS processing
 */
export function stripEmotionTags(text: string): string {
  // First, remove square bracket tags (legacy format)
  let cleaned = text.replace(/\[[\w\s]+\]/g, '');
  
  // Remove narrative context patterns like:
  // "she chuckled", "he said excitedly", "pausing thoughtfully", etc.
  cleaned = cleaned
    // Remove standalone narrative markers: "she chuckled", "he said thoughtfully"
    .replace(/\b(she|he|I)\s+(said|chuckled|laughed|whispered|paused|sighed|continued|replied|responded)(\s+\w+ly)?\s*[,.]?\s*/gi, '')
    // Remove "with a/an [emotion]" patterns: "with a laugh", "with enthusiasm"
    .replace(/\s*with\s+(a|an)\s+\w+\s*/gi, ' ')
    // Remove "after a moment" type phrases
    .replace(/\s*after\s+a\s+(moment|pause|beat)\s*/gi, ' ')
    // Remove "pausing [adverb]" patterns
    .replace(/\s*pausing\s+\w+ly\s*/gi, ' ')
    // Clean up excessive quotes and commas left behind
    .replace(/[,]\s*["']/g, ' "')
    .replace(/["']\s*[,]/g, '" ')
    // Remove double spaces and trim
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  // Clean up any orphaned punctuation at the start
  cleaned = cleaned.replace(/^[,.\s]+/, '');
  
  return cleaned;
}

/**
 * Search for a person's profile image using Google Custom Search API
 * Returns the first high-quality image URL or null if not found
 */
export async function searchPersonImage(personName: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn('[Image Search] Google Search API credentials not configured');
    return null;
  }

  try {
    const searchQuery = `${personName} profile`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=1&imgSize=medium`;

    console.log('[Image Search] Fetching image for:', personName);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[Image Search] API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const imageUrl = data.items[0].link;
      console.log('[Image Search] Found image:', imageUrl);
      return imageUrl;
    }

    console.log('[Image Search] No images found for:', personName);
    return null;
  } catch (error: any) {
    console.error('[Image Search] Failed to fetch image:', error.message);
    return null;
  }
}
