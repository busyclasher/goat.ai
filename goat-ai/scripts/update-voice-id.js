#!/usr/bin/env node

/**
 * Quick script to update a persona's voice ID
 * Usage: node scripts/update-voice-id.js <personaslug> <elevenlabs-voice-id>
 * Example: node scripts/update-voice-id.js sherryjiang 21m00Tcm4TlvDq8ikWAM
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVoiceId(slug, voiceId) {
  console.log(`🔄 Updating voice ID for persona: ${slug}`);
  console.log(`🎤 Voice ID: ${voiceId}`);
  
  const { data, error } = await supabase
    .from('personas')
    .update({ voice_id: voiceId })
    .eq('slug', slug)
    .select();

  if (error) {
    console.error('❌ Error updating voice ID:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Voice ID updated successfully!');
    console.log('📋 Updated persona:', {
      name: data[0].name,
      slug: data[0].slug,
      voice_id: data[0].voice_id
    });
  } else {
    console.error(`❌ Persona not found: ${slug}`);
    console.log('💡 Available personas:');
    
    const { data: personas } = await supabase
      .from('personas')
      .select('slug, name, voice_id');
    
    if (personas) {
      personas.forEach(p => {
        console.log(`   - ${p.slug} (${p.name}) ${p.voice_id ? '🎤' : '🔇'}`);
      });
    }
  }
}

// Parse command line arguments
const [,, slug, voiceId] = process.argv;

if (!slug || !voiceId) {
  console.log('📖 Usage: node scripts/update-voice-id.js <persona-slug> <voice-id>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/update-voice-id.js sherryjiang 21m00Tcm4TlvDq8ikWAM');
  console.log('');
  console.log('To get your ElevenLabs voice ID:');
  console.log('  1. Go to https://elevenlabs.io/');
  console.log('  2. Navigate to "Voices"');
  console.log('  3. Click on the voice you want to use');
  console.log('  4. Copy the Voice ID');
  process.exit(1);
}

updateVoiceId(slug, voiceId);

