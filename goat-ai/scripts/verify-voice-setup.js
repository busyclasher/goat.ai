#!/usr/bin/env node

/**
 * Verify voice mapping setup for personas
 * Usage: node scripts/verify-voice-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying voice mapping setup...\n');
  
  // Check if voice_id column exists and get all personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('slug, name, voice_id, created_at');

  if (error) {
    console.error('❌ Error fetching personas:', error.message);
    process.exit(1);
  }

  if (!personas || personas.length === 0) {
    console.log('⚠️  No personas found in database');
    console.log('💡 Run: npm run seed');
    process.exit(0);
  }

  console.log('✅ Database connection successful');
  console.log('✅ voice_id column exists\n');
  console.log('📋 Personas in database:\n');

  personas.forEach((persona, index) => {
    const hasVoice = persona.voice_id ? '🎤' : '🔇';
    const status = persona.voice_id ? '✅' : '⚠️';
    
    console.log(`${index + 1}. ${status} ${persona.name} (@${persona.slug}) ${hasVoice}`);
    if (persona.voice_id) {
      console.log(`   Voice ID: ${persona.voice_id}`);
    } else {
      console.log(`   Voice ID: Not set (will use default)`);
    }
    console.log('');
  });

  // Check specifically for Sherry
  const sherry = personas.find(p => p.slug === 'sherry-jiang');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 SHERRY JIANG STATUS:\n');
  
  if (sherry) {
    if (sherry.voice_id) {
      console.log('✅ Persona exists');
      console.log('✅ Voice ID configured');
      console.log(`🎤 Voice ID: ${sherry.voice_id}`);
      console.log('\n🎉 Voice mapping is ACTIVE!');
      console.log('\n📝 Next steps:');
      console.log('   1. Start dev server: npm run dev');
      console.log('   2. Navigate to: http://localhost:3000');
      console.log('   3. Select Sherry\'s persona');
      console.log('   4. Send a test message');
      console.log('   5. Listen to the audio in Sherry\'s voice!');
    } else {
      console.log('✅ Persona exists');
      console.log('⚠️  Voice ID NOT configured');
      console.log('\n💡 To fix: node scripts/update-voice-id.js sherry-jiang Qv0aP47SJsL43Pn6x7k9');
    }
  } else {
    console.log('❌ Sherry persona NOT found');
    console.log('\n💡 Run migration: supabase/migrations/0003_update_sherry_voice.sql');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Summary
  const withVoice = personas.filter(p => p.voice_id).length;
  const withoutVoice = personas.length - withVoice;
  
  console.log('📊 SUMMARY:');
  console.log(`   Total personas: ${personas.length}`);
  console.log(`   With custom voice: ${withVoice} 🎤`);
  console.log(`   Using default voice: ${withoutVoice} 🔇`);
}

verifySetup();

