# GOAT.ai - Digital Minds

A Next.js application that creates AI-powered digital minds using Supabase, ElevenLabs, and Groq. Chat with personalized AI personas that can speak and listen.

## Features

- 🎭 **Digital Personas**: Create AI personas from real people using Exa API
- 🎤 **Voice Input**: Speech-to-text using ElevenLabs
- 🔊 **Voice Output**: Text-to-speech with ElevenLabs
- 💬 **Real-time Chat**: Powered by Supabase real-time database
- 🎯 **Persona Switching**: Switch between different AI personas with @mentions
- 📱 **Responsive UI**: Modern, accessible chat interface

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (database + real-time subscriptions)
- **AI**: Groq (Llama 3.1), ElevenLabs TTS/STT, Exa API
- **Testing**: Playwright for e2e tests

## Setup

### 1. Environment Variables

Create your `.env.local` file:

```bash
npm run setup
```

Or manually create `.env.local` with:

```bash
# API Keys
EXA_API_KEY=your_exa_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Demo Mode (set to true for offline testing)
NEXT_PUBLIC_DEMO_MODE=false
```

Required keys:
- `EXA_API_KEY`: Get from [Exa.ai](https://exa.ai)
- `ELEVEN_API_KEY`: Get from [ElevenLabs](https://elevenlabs.io)
- `GROQ_API_KEY`: Get from [Groq Console](https://console.groq.com)
- `NEXT_PUBLIC_SUPABASE_URL`: Get from your Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Get from your Supabase project settings

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Run the seed data from `supabase/seed.sql` to add sample personas
4. Get your project URL and anon key from Settings > API

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Personas

Personas are automatically created when you first mention them. For example:
- Type `@warrenbuffett` to chat with a Warren Buffett persona
- Type `@elonmusk` to chat with an Elon Musk persona

The system will:
1. Search for content about the person using Exa API
2. Generate a personalized system prompt using Groq
3. Create a persona with their communication style

### Chat Features

- **Text Input**: Type messages normally
- **Voice Input**: Click the mic button to record
- **Persona Switching**: Use `@persona` to switch
- **Voice Output**: AI responses include audio playback

### Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` in your `.env.local` to use canned responses instead of real API calls. Useful for:
- Development without API costs
- Testing the UI
- Offline demonstrations

## API Endpoints

- `POST /api/tts` - Text-to-speech using ElevenLabs
- `POST /api/stt` - Speech-to-text using ElevenLabs
- `POST /api/chat` - Chat completion using Groq (Llama 3.1)

## Testing

Run end-to-end tests:

```bash
npm run test:e2e
```

## Project Structure

```
goat-ai/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── page.tsx        # Main chat page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   └── lib/               # Utilities & Supabase client
├── supabase/              # Supabase configuration
│   └── schema.sql         # Database schema
└── tests/                 # Playwright tests
```

## Privacy & Consent

- Generic voices are used unless explicit consent is given
- All conversations are stored in your Supabase database
- Audio files are processed in real-time and not permanently stored
- Persona data is cached for performance

## Troubleshooting

### Common Issues

1. **"Groq API key not configured"**: Add `GROQ_API_KEY` to your `.env.local` file
2. **"Supabase URL not configured"**: Set up Supabase and add credentials to `.env.local`
3. **"API key not configured"**: Check your `.env.local` file has all required keys
4. **Microphone not working**: Ensure HTTPS or localhost
5. **Audio not playing**: Check browser autoplay policies

### Development Tips

- Use demo mode (`NEXT_PUBLIC_DEMO_MODE=true`) for UI development
- Check browser console for errors
- Use Supabase dashboard to inspect data
- Monitor Groq API usage in console.groq.com
- Test with different personas

## License

MIT