import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips emotion tags like [sarcastically], [giggles] from text for display
 * Tags are kept for TTS processing
 */
export function stripEmotionTags(text: string): string {
  return text.replace(/\[[\w\s]+\]/g, '').replace(/\s{2,}/g, ' ').trim();
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
