# Quick Start Guide - GOAT.ai

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project to be created

2. **Run the Database Schema**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click "New Query"
   - Copy the entire contents of `supabase/schema.sql`
   - Paste and click "Run"
   - You should see "Success" message

3. **Add Sample Personas**
   - Still in SQL Editor, click "New Query"
   - Copy the entire contents of `supabase/seed.sql`
   - Paste and click "Run"
   - You should see "Sample personas added successfully!"

4. **Get Your API Keys**
   - Go to **Settings** > **API**
   - Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy the **anon public** key (long string starting with `eyJ...`)

### Step 2: Configure Environment Variables

1. **Navigate to the project folder**
   ```bash
   cd "C:\Users\tanyi\Downloads\goat.ai\goat-ai"
   ```

2. **Run the setup script**
   ```bash
   npm run setup
   ```

3. **Edit `.env.local` file**
   Open the file and add your keys:
   ```bash
   # API Keys (optional for now)
   EXA_API_KEY=your_exa_api_key_here
   ELEVEN_API_KEY=your_elevenlabs_api_key_here
   GROQ_API_KEY=your_groq_api_key_here

   # Supabase (REQUIRED - add your actual keys)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Demo Mode (set to false to use real APIs)
   NEXT_PUBLIC_DEMO_MODE=true
   ```

### Step 3: Start the Development Server

```bash
# Make sure you're in the right directory
cd "C:\Users\tanyi\Downloads\goat.ai\goat-ai"

# Start the server
npm run dev
```

### Step 4: Open Your Browser

Visit: **http://localhost:3000**

You should now see the chat interface with Warren Buffett persona loaded!

## 🎭 Available Sample Personas

After running the seed script, you'll have these personas:

1. **@warrenbuffett** - Investment wisdom and long-term thinking
2. **@elonmusk** - Innovation and bold vision
3. **@stevejobs** - Design and user experience
4. **@naval** - Wealth creation and philosophy
5. **@mentor** - General practical advice
6. **@raydalio** - Principles-based thinking

## 💬 How to Use

1. **Chat with default persona**: Just type and send messages
2. **Switch personas**: Type `@elonmusk` in the chat or use the persona switcher
3. **Voice input**: Click the microphone button (requires ElevenLabs API key)

## 🐛 Troubleshooting

### "Persona not found"
- Make sure you ran `supabase/seed.sql` in your Supabase SQL editor
- Check that your Supabase URL and anon key are correct in `.env.local`

### "npm run dev" doesn't work
- Make sure you're in the `goat-ai` folder (the inner one)
- Run: `cd "C:\Users\tanyi\Downloads\goat.ai\goat-ai"`

### Database connection errors
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure you ran the schema.sql first, then seed.sql

## 🎯 Next Steps

1. **Get Groq API Key** (for real AI responses)
   - Visit [console.groq.com](https://console.groq.com)
   - Sign up and create an API key
   - Add to `.env.local`: `GROQ_API_KEY=gsk_...`
   - Set `NEXT_PUBLIC_DEMO_MODE=false`

2. **Get ElevenLabs API Key** (for voice features)
   - Visit [elevenlabs.io](https://elevenlabs.io)
   - Sign up and get your API key
   - Add to `.env.local`: `ELEVEN_API_KEY=...`

3. **Get Exa API Key** (for creating new personas)
   - Visit [exa.ai](https://exa.ai)
   - Sign up and get your API key
   - Add to `.env.local`: `EXA_API_KEY=...`

## 📝 Testing Checklist

- [ ] Supabase project created
- [ ] Schema.sql executed successfully
- [ ] Seed.sql executed successfully
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Can see Warren Buffett persona
- [ ] Can send messages
- [ ] Can switch personas with @mention

Enjoy chatting with your AI personas! 🎉
