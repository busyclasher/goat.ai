import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define keywords for more dynamic stripping
const NARRATIVE_SUBJECTS = ['he', 'she', 'they', 'I'];
const NARRATIVE_VERBS = [
  'said', 'replied', 'whispered', 'chuckled', 'laughed', 'noted', 'added', 
  'continued', 'murmured', 'paused', 'sighed', 'smiled', 'nodded', 'mused'
];

/**
 * Strips emotion tags and narrative context markers from text for clean UI display.
 * This version uses keyword lists to build regular expressions dynamically,
 * making it easier to maintain and expand.
 */
export function stripEmotionTags(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove legacy square bracket tags like [chuckles]
  cleaned = cleaned.replace(/\[(.*?)\]/g, '');

  // 2. Build and apply dynamic regex for narrative actions
  const subjects = NARRATIVE_SUBJECTS.join('|');
  const verbs = NARRATIVE_VERBS.join('|');
  
  // Regex for dialogue interruptions like ," he said, " or ." he said. "
  const interruptionRegex = new RegExp(`"\\s*,?\\s*(${subjects})\\s+(${verbs})[^"]*\\.\\s*"`, 'gi');
  cleaned = cleaned.replace(interruptionRegex, ' ');

  // Regex for clauses like ", she said thoughtfully."
  const narrativeClauseRegex = new RegExp(`,\\s*(${subjects})\\s*(${verbs})\\s*\\w*\\s*[.]?`, 'gi');
  cleaned = cleaned.replace(narrativeClauseRegex, '.');
  
  // Regex for standalone sentences like "She paused." or "He chuckled thoughtfully."
  const narrativeSentenceRegex = new RegExp(`(?:^|\\.\\s*|\\n\\s*)(${subjects})\\s*(${verbs})(\\s+\\w+)?\\.`, 'gi');
  cleaned = cleaned.replace(narrativeSentenceRegex, '.');

  // 3. Remove leading verb phrases like "Pausing thoughtfully, "
  cleaned = cleaned.replace(/^(Pausing|Chuckling|Laughing|Sighing)\\s*\\w*,\\s*/i, '');

  // 4. Remove phrases like "with a smile" or "after a moment"
  cleaned = cleaned.replace(/\\s*\\bwith\\s+a\\s+(smile|laugh|chuckle|sigh|nod)\\b/gi, '');
  cleaned = cleaned.replace(/\\s*\\bafter\\s+a\\s+(moment|pause)\\b[,.]?/gi, '');

  // 5. Final cleanup for quotes, spaces, and punctuation
  cleaned = cleaned.replace(/"\\s*,/g, '"'); // " , -> "
  cleaned = cleaned.replace(/\\s{2,}/g, ' '); // Collapse multiple spaces
  cleaned = cleaned.trim();
  
  // Remove orphaned leading punctuation
  if (cleaned.startsWith('.') || cleaned.startsWith(',')) {
    cleaned = cleaned.substring(1).trim();
  }

  // Remove surrounding quotes if they are the only thing left around the text
  cleaned = cleaned.replace(/^"(.*)"$/, '$1');

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Image Search] Failed to fetch image:', error.message);
    } else {
      console.error('[Image Search] An unknown error occurred:', error);
    }
    return null;
  }
}
