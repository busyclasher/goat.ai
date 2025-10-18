// Test Google Image Search API
// Run with: node scripts/test-image-search.js

require('dotenv').config({ path: '.env.local' });

async function testImageSearch(personName) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  console.log('\n=== Google Image Search Test ===');
  console.log('Person Name:', personName);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  console.log('Search Engine ID:', searchEngineId || 'MISSING');
  console.log('');

  if (!apiKey || !searchEngineId) {
    console.error('❌ Missing credentials!');
    console.log('Required environment variables:');
    console.log('- GOOGLE_SEARCH_API_KEY');
    console.log('- GOOGLE_SEARCH_ENGINE_ID');
    process.exit(1);
  }

  try {
    const searchQuery = `${personName} profile`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=1&imgSize=medium`;

    console.log('🔍 Searching for:', searchQuery);
    console.log('');

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const imageUrl = data.items[0].link;
      console.log('✅ Success! Found image:');
      console.log('URL:', imageUrl);
      console.log('');
      console.log('Image details:');
      console.log('- Title:', data.items[0].title);
      console.log('- Thumbnail:', data.items[0].image?.thumbnailLink);
      console.log('- Width:', data.items[0].image?.width);
      console.log('- Height:', data.items[0].image?.height);
      console.log('');
      console.log('✨ Image search is working correctly!');
    } else {
      console.log('⚠️ No images found for:', personName);
      console.log('API response:', JSON.stringify(data, null, 2));
    }

    // Show quota info if available
    if (data.queries?.request?.[0]) {
      console.log('\nAPI Quota Info:');
      console.log('- Total results:', data.searchInformation?.totalResults);
      console.log('- Search time:', data.searchInformation?.searchTime, 'seconds');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Test with a well-known person
const testName = process.argv[2] || 'Elon Musk';
testImageSearch(testName);

