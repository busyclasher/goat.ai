#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envExample = `# API Keys
EXA_API_KEY=your_exa_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Demo Mode (set to true for offline testing)
NEXT_PUBLIC_DEMO_MODE=false`;

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Created .env.local file');
  console.log('📝 Please update the API keys in .env.local');
} else {
  console.log('⚠️  .env.local already exists');
}

console.log('\n🔧 Setup instructions:');
console.log('1. Get your API keys:');
console.log('   - EXA_API_KEY: https://exa.ai');
console.log('   - ELEVEN_API_KEY: https://elevenlabs.io');
console.log('   - GROQ_API_KEY: https://console.groq.com');
console.log('   - Supabase keys: https://supabase.com');
console.log('2. Run the Supabase schema: supabase/schema.sql');
console.log('3. Start the dev server: npm run dev');
