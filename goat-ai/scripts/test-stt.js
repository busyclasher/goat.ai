#!/usr/bin/env node

// Quick diagnostic script to test STT APIs
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing STT API Configuration\n');

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log('Environment Variables:');
console.log('  ELEVEN_API_KEY:', ELEVEN_API_KEY ? `✅ Present (${ELEVEN_API_KEY.substring(0, 15)}...)` : '❌ Missing');
console.log('  GROQ_API_KEY:', GROQ_API_KEY ? `✅ Present (${GROQ_API_KEY.substring(0, 15)}...)` : '❌ Missing');
console.log('');

// Test ElevenLabs API
async function testElevenLabs() {
  if (!ELEVEN_API_KEY) {
    console.log('❌ ElevenLabs: Skipped (no API key)');
    return;
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': ELEVEN_API_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ElevenLabs API: Connected');
      console.log('   Character count:', data.subscription?.character_count || 'N/A');
      console.log('   Character limit:', data.subscription?.character_limit || 'N/A');
    } else {
      const error = await response.text();
      console.log('❌ ElevenLabs API: Failed');
      console.log('   Status:', response.status);
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ ElevenLabs API: Exception');
    console.log('   Error:', error.message);
  }
}

// Test Groq API
async function testGroq() {
  if (!GROQ_API_KEY) {
    console.log('❌ Groq: Skipped (no API key)');
    return;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const whisperModel = data.data?.find(m => m.id.includes('whisper'));
      console.log('✅ Groq API: Connected');
      console.log('   Whisper available:', whisperModel ? '✅ Yes' : '❌ No');
      if (whisperModel) {
        console.log('   Model:', whisperModel.id);
      }
    } else {
      const error = await response.text();
      console.log('❌ Groq API: Failed');
      console.log('   Status:', response.status);
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ Groq API: Exception');
    console.log('   Error:', error.message);
  }
}

// Run tests
(async () => {
  console.log('Testing API Connections...\n');
  await testElevenLabs();
  console.log('');
  await testGroq();
  console.log('\n✨ Diagnostic complete!');
})();

